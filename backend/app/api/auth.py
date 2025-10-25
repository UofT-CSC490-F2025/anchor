from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import uuid

router = APIRouter()
security = HTTPBearer()

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Pydantic Models matching frontend expectations
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    firstName: str
    lastName: str

class OAuthRequest(BaseModel):
    provider: str  # 'google', 'facebook', 'twitter'
    accessToken: str

class RefreshRequest(BaseModel):
    refreshToken: str

class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    created_at: str
    updated_at: str
    is_active: bool
    locale: str
    metadata: dict

class AuthResponse(BaseModel):
    success: bool
    user: UserResponse | None = None
    token: str | None = None
    refreshToken: str | None = None
    tokenExpiresAt: str | None = None
    refreshTokenExpiresAt: str | None = None
    isNewUser: bool = False
    error: str | None = None

# Database connection helper
def get_db_conn():
    from app.main import _get_database_url
    return psycopg2.connect(_get_database_url(), cursor_factory=RealDictCursor)

# JWT token creation
def create_access_token(data: dict) -> tuple[str, str]:
    """Create access token and return (token, expiry_timestamp)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token, expire.isoformat()

def create_refresh_token(data: dict) -> tuple[str, str]:
    """Create refresh token and return (token, expiry_timestamp)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token, expire.isoformat()

# Get current user from token
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Fetch user from database
        conn = get_db_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE id = %s AND is_active = TRUE", (user_id,))
                user = cur.fetchone()
                if not user:
                    raise HTTPException(status_code=401, detail="User not found")
                return dict(user)
        finally:
            conn.close()
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def user_to_response(user: dict) -> UserResponse:
    """Convert database user dict to UserResponse"""
    return UserResponse(
        id=str(user["id"]),
        email=user["email"],
        display_name=user["display_name"],
        created_at=user["created_at"].isoformat() if hasattr(user["created_at"], 'isoformat') else str(user["created_at"]),
        updated_at=user["updated_at"].isoformat() if hasattr(user["updated_at"], 'isoformat') else str(user["updated_at"]),
        is_active=user["is_active"],
        locale=user.get("locale", "en"),
        metadata=user.get("metadata", {})
    )

@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Email/password login
    Matches frontend: await mockAuthAPI.login(email, password)
    """
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # For now, we don't have password_hash in schema, so we'll accept any password
            # In production, add password_hash column and verify properly
            cur.execute("SELECT * FROM users WHERE email = %s AND is_active = TRUE", (request.email,))
            user = cur.fetchone()
            
            if not user:
                return AuthResponse(
                    success=False,
                    error="Invalid email or password"
                )
            
            # TODO: In production, verify password:
            # if not verify_password(request.password, user['password_hash']):
            #     return AuthResponse(success=False, error="Invalid email or password")
            
            # Create tokens
            access_token, access_expiry = create_access_token({"sub": str(user["id"])})
            refresh_token, refresh_expiry = create_refresh_token({"sub": str(user["id"])})
            
            return AuthResponse(
                success=True,
                user=user_to_response(user),
                token=access_token,
                refreshToken=refresh_token,
                tokenExpiresAt=access_expiry,
                refreshTokenExpiresAt=refresh_expiry,
                isNewUser=False
            )
    finally:
        conn.close()

@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    User signup with email and password
    Matches frontend: await mockAuthAPI.signup(email, password, firstName, lastName)
    """
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE email = %s", (request.email,))
            if cur.fetchone():
                return AuthResponse(
                    success=False,
                    error="Email already registered"
                )
            
            # Create new user
            display_name = f"{request.firstName} {request.lastName}"
            # password_hash = hash_password(request.password)  # TODO: Add password_hash column
            
            cur.execute("""
                INSERT INTO users (email, display_name, is_active, locale, metadata)
                VALUES (%s, %s, TRUE, 'en', %s)
                RETURNING *
            """, (request.email, display_name, '{}'))
            
            conn.commit()
            user = cur.fetchone()
            
            # Create tokens
            access_token, access_expiry = create_access_token({"sub": str(user["id"])})
            refresh_token, refresh_expiry = create_refresh_token({"sub": str(user["id"])})
            
            return AuthResponse(
                success=True,
                user=user_to_response(user),
                token=access_token,
                refreshToken=refresh_token,
                tokenExpiresAt=access_expiry,
                refreshTokenExpiresAt=refresh_expiry,
                isNewUser=True
            )
    finally:
        conn.close()

@router.post("/oauth", response_model=AuthResponse)
async def oauth_login(request: OAuthRequest):
    """
    OAuth provider login (Google, Facebook, Twitter)
    Matches frontend: await mockAuthAPI.oauthLogin(provider)
    """
    conn = get_db_conn()
    try:
        # TODO: Verify OAuth token with provider API
        # For now, create/get user based on provider
        
        # Mock email from provider (in production, get from OAuth token)
        email = f"{request.provider}_user_{uuid.uuid4().hex[:8]}@oauth.example.com"
        
        with conn.cursor() as cur:
            # Check if user exists with this OAuth provider
            cur.execute("""
                SELECT u.* FROM users u
                JOIN user_accounts ua ON ua.user_id = u.id
                WHERE ua.platform = %s AND u.is_active = TRUE
                LIMIT 1
            """, (request.provider,))
            
            user = cur.fetchone()
            is_new_user = False
            
            if not user:
                # Create new user
                display_name = f"{request.provider.title()} User"
                cur.execute("""
                    INSERT INTO users (email, display_name, is_active, locale, metadata)
                    VALUES (%s, %s, TRUE, 'en', %s)
                    RETURNING *
                """, (email, display_name, '{}'))
                conn.commit()
                user = cur.fetchone()
                is_new_user = True
                
                # Create user_account entry
                cur.execute("""
                    INSERT INTO user_accounts (user_id, platform, platform_user_id, oauth_token, scopes)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    user["id"],
                    request.provider,
                    f"{request.provider}_{uuid.uuid4().hex}",
                    request.accessToken,
                    []
                ))
                conn.commit()
            
            # Create tokens
            access_token, access_expiry = create_access_token({"sub": str(user["id"])})
            refresh_token, refresh_expiry = create_refresh_token({"sub": str(user["id"])})
            
            return AuthResponse(
                success=True,
                user=user_to_response(user),
                token=access_token,
                refreshToken=refresh_token,
                tokenExpiresAt=access_expiry,
                refreshTokenExpiresAt=refresh_expiry,
                isNewUser=is_new_user
            )
    finally:
        conn.close()

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: RefreshRequest):
    """
    Refresh access token using refresh token
    Matches frontend: await mockAuthAPI.refreshToken(refreshToken)
    """
    try:
        payload = jwt.decode(request.refreshToken, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return AuthResponse(
                success=False,
                error="Invalid token type"
            )
        
        user_id = payload.get("sub")
        
        conn = get_db_conn()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM users WHERE id = %s AND is_active = TRUE", (user_id,))
                user = cur.fetchone()
                
                if not user:
                    return AuthResponse(
                        success=False,
                        error="User not found"
                    )
                
                # Create new tokens
                access_token, access_expiry = create_access_token({"sub": str(user["id"])})
                new_refresh_token, refresh_expiry = create_refresh_token({"sub": str(user["id"])})
                
                return AuthResponse(
                    success=True,
                    user=user_to_response(user),
                    token=access_token,
                    refreshToken=new_refresh_token,
                    tokenExpiresAt=access_expiry,
                    refreshTokenExpiresAt=refresh_expiry,
                    isNewUser=False
                )
        finally:
            conn.close()
    except jwt.ExpiredSignatureError:
        return AuthResponse(
            success=False,
            error="Refresh token expired"
        )
    except jwt.JWTError:
        return AuthResponse(
            success=False,
            error="Invalid refresh token"
        )

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user (client should delete tokens)
    Matches frontend: logout functionality
    """
    # In production, you might want to:
    # 1. Blacklist the token
    # 2. Remove refresh tokens from database
    # 3. Log the logout action
    
    return {
        "success": True,
        "message": "Logged out successfully"
    }

@router.get("/validate")
async def validate_token(current_user: dict = Depends(get_current_user)):
    """
    Validate current token and return user info
    Useful for frontend token validation
    """
    return {
        "success": True,
        "user": user_to_response(current_user),
        "valid": True
    }

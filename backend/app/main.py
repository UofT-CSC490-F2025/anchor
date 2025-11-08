from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
from app.api.tiktok_scrapper import router as tiktok_router
from app.api.auth import router as auth_router
from app.models import HealthCheckResponse, ApiResponse
from urllib.parse import urlparse
from psycopg2 import sql

# DB init imports
import os
import json
from pathlib import Path
from dotenv import load_dotenv
import psycopg2

app = FastAPI(
    title="Anchor - Content Verification API",
    description="Backend API for deepfake detection and content verification",
    version="1.0.0"
)

# Middleware to ensure JSON content-type for POST requests
@app.middleware("http")
async def ensure_json_content_type(request: Request, call_next):
    """
    Middleware to ensure POST, PUT, PATCH requests have application/json content-type
    """
    if request.method in ["POST", "PUT", "PATCH"] and request.url.path not in ["/docs", "/openapi.json"]:
        content_type = request.headers.get("content-type", "")
        if content_type and not content_type.startswith("application/json"):
            # Allow multipart/form-data for file uploads if needed
            if not content_type.startswith("multipart/form-data"):
                raise HTTPException(
                    status_code=415,
                    detail="Content-Type must be application/json for this endpoint"
                )
    
    response = await call_next(request)
    return response

def _get_secret(secret_name: str, region: str = "us-east-1") -> dict:
    """
    Retrieve secrets from AWS Secrets Manager when running in AWS environment.
    """
    try:
        import boto3
        from botocore.exceptions import ClientError
        
        session = boto3.session.Session()
        client = session.client(
            service_name='secretsmanager',
            region_name=region
        )
        
        try:
            get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        except ClientError as e:
            print(f"[AWS SECRETS] Error retrieving secret {secret_name}: {e}")
            raise e
        
        # Secrets Manager stores secrets as JSON strings
        secret = get_secret_value_response['SecretString']
        return json.loads(secret)
    except ImportError:
        print("[AWS SECRETS] boto3 not installed, skipping Secrets Manager")
        return {}
    except Exception as e:
        print(f"[AWS SECRETS] Failed to get secret {secret_name}: {e}")
        return {}

def _is_aws_environment() -> bool:
    """
    Check if running in AWS environment (ECS, EC2, Lambda, etc.)
    """
    return (
        os.getenv("ENVIRONMENT") in ["prod", "staging"] or
        os.getenv("AWS_EXECUTION_ENV") is not None or
        os.getenv("ECS_CONTAINER_METADATA_URI") is not None
    )

def _get_database_url() -> str:
    """
    Resolve DATABASE_URL from environment or construct from PG* vars.
    In AWS, retrieve from Secrets Manager.
    Fallback: postgresql://postgres:postgres@localhost:5432/anchor
    """
    # Check if running in AWS environment
    if _is_aws_environment():
        print("[DB INIT] Running in AWS environment, fetching credentials from Secrets Manager")
        try:
            secret_name = f"anchor/db-credentials-{os.getenv('ENVIRONMENT', 'prod')}"
            db_secret = _get_secret(secret_name, os.getenv("AWS_REGION", "us-east-1"))
            
            if db_secret:
                host = db_secret.get("host")
                port = db_secret.get("port", 5432)
                user = db_secret.get("username")
                password = db_secret.get("password")
                dbname = db_secret.get("dbname")
                
                if all([host, user, password, dbname]):
                    print(f"[DB INIT] Using database credentials from Secrets Manager")
                    return f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
        except Exception as e:
            print(f"[DB INIT] Failed to get credentials from Secrets Manager: {e}")
    
    # Load .env from backend/.env for local development
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)

    db_url = os.getenv("DATABASE_URL")
    if db_url:
        return db_url
    
    # Fallback construction
    host = os.getenv("PGHOST", "localhost")
    port = os.getenv("PGPORT", "5432")
    user = os.getenv("PGUSER", "postgres")
    password = os.getenv("PGPASSWORD", "Postgres")
    dbname = os.getenv("PGDATABASE", "anchor")
    return f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

def _ensure_database_exists():
    """
    Ensure the target database exists by connecting to the 'postgres' admin DB.
    """
    db_url = _get_database_url()
    p = urlparse(db_url)
    target_db = (p.path or "/anchor").lstrip("/") or "anchor"

    admin_url = f"postgresql://{p.username or 'postgres'}:{p.password or 'Postgres'}@{p.hostname or 'localhost'}:{p.port or 5432}/postgres"
    print(f"[DB INIT] Ensuring database exists: {target_db}")

    try:
        conn = psycopg2.connect(admin_url)
        try:
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM pg_database WHERE datname=%s;", (target_db,))
                if cur.fetchone() is None:
                    print(f"[DB INIT] Creating database '{target_db}'")
                    cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(target_db)))
        finally:
            conn.close()
    except Exception as e:
        print(f"[DB INIT] Database check error: {e}")

def _apply_schema():
    """
    Apply backend/db/schema.sql on startup (idempotent DDL).
    """
    schema_path = Path(__file__).resolve().parents[1] / "db" / "schema.sql"
    if not schema_path.exists():
        print(f"[DB INIT] schema.sql not found at {schema_path}")
        return

    db_url = _get_database_url()
    p = urlparse(db_url)
    safe_dsn = f"postgresql://{p.hostname or 'localhost'}:{p.port or 5432}/{(p.path or '/anchor').lstrip('/')}"
    print(f"[DB INIT] Connecting to: {safe_dsn}")

    try:
        conn = psycopg2.connect(db_url)
        try:
            conn.autocommit = True
            with conn.cursor() as cur:
                sql_text = schema_path.read_text(encoding="utf-8")
                cur.execute(sql_text)
            print("[DB INIT] Schema applied successfully")
        finally:
            conn.close()
    except Exception as e:
        print(f"[DB INIT] Schema application error: {e}")

# Configure CORS - Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Expo dev server
        "http://localhost:19006",  # Expo web
        "exp://localhost:19000",  # Expo app
        "*"  # For development - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(tiktok_router, prefix="/api/tiktok", tags=["TikTok Analysis"])

@app.on_event("startup")
def init_db_on_startup():
    """Initialize database on application startup"""
    try:
        _ensure_database_exists()
        _apply_schema()
    except Exception as e:
        print(f"[DB INIT] Skipped due to error: {e}")

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Anchor Content Verification API",
        "version": "1.0.0",
        "status": "operational",
        "content_type": "All POST/PUT/PATCH endpoints require application/json content-type",
        "endpoints": {
            "authentication": "/auth",
            "tiktok_analysis": "/api/tiktok",
            "documentation": "/docs"
        }
    }

@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        status="healthy",
        database="connected",
        services={
            "auth": "operational",
            "tiktok_analysis": "operational"
        }
    )

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

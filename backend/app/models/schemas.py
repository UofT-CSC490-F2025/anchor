"""
Consolidated Pydantic Models for Anchor Backend

This module contains all the Pydantic models used across the backend API.
Models are organized by feature area for better maintainability.
"""

from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, Dict, Any, List


# =============================================================================
# AUTHENTICATION MODELS
# =============================================================================

class LoginRequest(BaseModel):
    """Request model for user login"""
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    """Request model for user signup"""
    email: EmailStr
    password: str
    firstName: str
    lastName: str


class OAuthRequest(BaseModel):
    """Request model for OAuth authentication"""
    provider: str  # 'google', 'facebook', 'twitter'
    accessToken: str


class RefreshRequest(BaseModel):
    """Request model for token refresh"""
    refreshToken: str


class UserResponse(BaseModel):
    """Response model for user data"""
    id: str
    email: str
    display_name: str
    created_at: str
    updated_at: str
    is_active: bool
    locale: str
    metadata: Dict[str, Any]


class AuthResponse(BaseModel):
    """Response model for authentication operations"""
    success: bool
    user: Optional[UserResponse] = None
    token: Optional[str] = None
    refreshToken: Optional[str] = None
    tokenExpiresAt: Optional[str] = None
    refreshTokenExpiresAt: Optional[str] = None
    isNewUser: bool = False
    error: Optional[str] = None


# =============================================================================
# TIKTOK ANALYSIS MODELS
# =============================================================================

class TikTokPredictRequest(BaseModel):
    """Request model for TikTok video analysis"""
    url: HttpUrl


class DeepfakeCheckResult(BaseModel):
    """Model for deepfake detection results"""
    status: str
    confidence: Optional[float] = None
    message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class FactCheckResult(BaseModel):
    """Model for fact-checking results"""
    status: str
    claims: Optional[List[Dict[str, Any]]] = None
    confidence: Optional[float] = None
    message: Optional[str] = None
    source: Optional[str] = None


class TikTokPredictResponse(BaseModel):
    """Response model for TikTok video analysis"""
    file_name: str
    deepfake_check: DeepfakeCheckResult
    fact_check_results: FactCheckResult


# =============================================================================
# ETL PIPELINE MODELS
# =============================================================================

class ETLRunRequest(BaseModel):
    """Request model for ETL pipeline execution"""
    dataset_name: str
    data_dir: str
    transform_args: Optional[Dict[str, Any]] = {}
    load_args: Optional[Dict[str, Any]] = {}


class ETLRunResponse(BaseModel):
    """Response model for ETL pipeline execution"""
    status: str
    dataset_name: str
    records_processed: Optional[int] = None
    execution_time: Optional[float] = None
    errors: Optional[List[str]] = None


# =============================================================================
# COMMON RESPONSE MODELS
# =============================================================================

class ApiResponse(BaseModel):
    """Generic API response model"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None


class HealthCheckResponse(BaseModel):
    """Health check response model"""
    status: str
    database: Optional[str] = None
    services: Optional[Dict[str, str]] = None
    timestamp: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None


# =============================================================================
# DATABASE MODELS (Future use)
# =============================================================================

class UserAccount(BaseModel):
    """Model for user social media accounts"""
    user_id: str
    platform: str
    platform_user_id: str
    oauth_token: Optional[str] = None
    scopes: List[str] = []
    is_active: bool = True


class ContentAnalysis(BaseModel):
    """Model for content analysis results"""
    id: str
    user_id: str
    content_url: str
    content_type: str
    analysis_results: Dict[str, Any]
    confidence_score: Optional[float] = None
    created_at: str
    updated_at: str


class FeedbackEntry(BaseModel):
    """Model for user feedback"""
    id: str
    user_id: str
    content_analysis_id: str
    feedback_type: str  # 'like', 'dislike', 'report', etc.
    feedback_data: Dict[str, Any]
    created_at: str
"""
Models package for Anchor Backend

This package contains all Pydantic models and database schemas.
Import all models from the main schemas module.
"""

from .schemas import (
    # Authentication models
    LoginRequest,
    SignupRequest,
    OAuthRequest,
    RefreshRequest,
    UserResponse,
    AuthResponse,
    
    # TikTok Analysis models
    TikTokPredictRequest,
    TikTokPredictResponse,
    DeepfakeCheckResult,
    FactCheckResult,
    
    # ETL Pipeline models
    ETLRunRequest,
    ETLRunResponse,
    
    # Common response models
    ApiResponse,
    HealthCheckResponse,
    ErrorResponse,
    
    # Database models (future use)
    UserAccount,
    ContentAnalysis,
    FeedbackEntry,
)

__all__ = [
    # Authentication
    "LoginRequest",
    "SignupRequest", 
    "OAuthRequest",
    "RefreshRequest",
    "UserResponse",
    "AuthResponse",
    
    # TikTok Analysis
    "TikTokPredictRequest",
    "TikTokPredictResponse",
    "DeepfakeCheckResult",
    "FactCheckResult",
    
    # ETL Pipeline
    "ETLRunRequest",
    "ETLRunResponse",
    
    # Common
    "ApiResponse",
    "HealthCheckResponse",
    "ErrorResponse",
    
    # Database
    "UserAccount",
    "ContentAnalysis", 
    "FeedbackEntry",
]
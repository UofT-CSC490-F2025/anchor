"""
Configuration settings for cloud storage and ETL pipeline.
"""

import os
from typing import Dict, Any

# AWS Configuration
AWS_CONFIG = {
    "region_name": os.getenv("AWS_REGION", "us-east-1"),
    "dynamodb_table": os.getenv("DYNAMODB_TABLE", "deepfake-dataset-metadata"),
    "s3_bucket": os.getenv("S3_BUCKET", "deepfake-detection-data"),
}

# ETL Configuration
ETL_CONFIG = {
    "batch_size": int(os.getenv("ETL_BATCH_SIZE", "100")),
    "max_retries": int(os.getenv("ETL_MAX_RETRIES", "3")),
    "upload_timeout": int(os.getenv("UPLOAD_TIMEOUT", "300")),  # seconds
    "supported_video_formats": [".mp4", ".avi", ".mov", ".mkv"],
    "supported_image_formats": [".jpg", ".jpeg", ".png", ".webp"],
}

# Dataset Configuration
DATASET_CONFIG = {
    "faceforensicspp": {
        "compression_levels": ["c0", "c23", "c40"],
        "manipulation_methods": ["deepfakes", "face2face", "faceswap", "neural_textures", "deepfake_detection"],
        "original_sources": ["youtube", "actors"]
    },
    "celebdfpp": {
        "real_sources": ["celeb_real", "youtube_real"],
        "synthesis_categories": ["face_swap", "face_reenact", "talking_face"],
        "face_swap_methods": ["celeb_df", "blend_face", "ghost", "hifi_face", "in_swapper", 
                             "mobile_face_swap", "sim_swap", "uni_face"],
        "face_reenact_methods": ["da_gan", "fsrt", "hyper_reenact", "lia", "live_portrait", 
                                "mcnet", "tpsmm"],
        "talking_face_methods": ["ani_talker", "echo_mimic", "ed_talk", "float", "ip_lap", 
                                "real3d_portrait", "sad_talker"]
    }
}

# Processing Configuration
PROCESSING_CONFIG = {
    "face_detection": {
        "target_size": (224, 224),
        "num_frames_per_video": 10,
        "confidence_threshold": 0.9
    },
    "xception_preprocessing": {
        "target_size": (299, 299),
        "rescale": True
    },
    "storage": {
        "image_format": "webp",
        "image_quality": 85,
        "video_compression": "h264"
    }
}

def get_aws_config() -> Dict[str, Any]:
    """Get AWS configuration settings."""
    return AWS_CONFIG.copy()

def get_etl_config() -> Dict[str, Any]:
    """Get ETL configuration settings.""" 
    return ETL_CONFIG.copy()

def get_dataset_config(dataset_name: str = None) -> Dict[str, Any]:
    """Get dataset configuration settings."""
    if dataset_name:
        return DATASET_CONFIG.get(dataset_name, {})
    return DATASET_CONFIG.copy()

def get_processing_config() -> Dict[str, Any]:
    """Get processing configuration settings."""
    return PROCESSING_CONFIG.copy()

def validate_config() -> bool:
    """Validate that all required configuration is present."""
    required_env_vars = [
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY"
    ]
    
    missing_vars = []
    for var in required_env_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"Missing required environment variables: {missing_vars}")
        print("Please set these variables before running the ETL pipeline.")
        return False
    
    return True
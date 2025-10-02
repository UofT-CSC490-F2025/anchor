from typing import Any, Dict
import os
import pickle
import logging
from .storage_manager import DatasetStorageManager

logger = logging.getLogger(__name__)

def save_to_disk(data: Dict[str, Any], output_dir: str = "./processed_data"):
    """
    Saves processed data to disk as a pickle file.
    Args:
        data (Dict): Data to save.
        output_dir (str): Directory to save data.
    """
    os.makedirs(output_dir, exist_ok=True)
    dataset_name = data.get('dataset', 'unknown')
    out_path = os.path.join(output_dir, f"{dataset_name}_processed.pkl")
    with open(out_path, 'wb') as f:
        pickle.dump(data, f)
    print(f"Saved processed data to {out_path}")

def load_to_cloud_storage(data: Dict[str, Any], storage_manager: DatasetStorageManager, 
                         dataset_type: str, upload_files: bool = False):
    """
    Loads dataset metadata to DynamoDB and optionally uploads files to S3.
    
    Args:
        data: Dataset metadata from importers
        storage_manager: Configured DatasetStorageManager instance
        dataset_type: Type of dataset ("faceforensicspp" or "celebdfpp")
        upload_files: Whether to upload actual files to S3
    """
    try:
        logger.info(f"Loading {dataset_type} metadata to cloud storage")
        
        # Ensure DynamoDB table exists
        storage_manager.create_table_if_not_exists()
        
        # Store metadata in DynamoDB
        storage_manager.store_dataset_metadata(data, dataset_type)
        
        if upload_files:
            logger.info("Starting file upload to S3...")
            _upload_dataset_files(data, storage_manager, dataset_type)
        
        logger.info(f"Successfully loaded {dataset_type} to cloud storage")
        
    except Exception as e:
        logger.error(f"Failed to load dataset to cloud storage: {e}")
        raise

def _upload_dataset_files(data: Dict[str, Any], storage_manager: DatasetStorageManager, 
                         dataset_type: str):
    """Helper function to upload all dataset files to S3."""
    
    files_to_upload = []
    
    if dataset_type == "faceforensicspp":
        # Collect all FaceForensics++ files
        files_to_upload.extend(data.get("downloaded_videos", []))
        
        youtube_data = data.get("original_sequences", {}).get("youtube", {})
        for videos in youtube_data.values():
            files_to_upload.extend(videos)
        
        files_to_upload.extend(data.get("original_sequences", {}).get("actors", []))
        
        for videos in data.get("manipulated_sequences", {}).values():
            files_to_upload.extend(videos)
    
    elif dataset_type == "celebdfpp":
        # Collect all Celeb-DF++ files
        for videos in data.get("real_videos", {}).values():
            files_to_upload.extend(videos)
        
        for category in data.get("synthetic_videos", {}).values():
            for videos in category.values():
                files_to_upload.extend(videos)
    
    # Upload files to S3
    successful_uploads = 0
    total_files = len(files_to_upload)
    
    logger.info(f"Uploading {total_files} files to S3...")
    
    for file_path in files_to_upload:
        if os.path.exists(file_path):
            if storage_manager.upload_to_s3(file_path):
                successful_uploads += 1
        else:
            logger.warning(f"File not found: {file_path}")
    
    logger.info(f"Successfully uploaded {successful_uploads}/{total_files} files to S3")


def default_loader(data: Any, **kwargs):
    print(f"Loaded dataset: {data}")

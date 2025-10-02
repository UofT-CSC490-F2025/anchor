"""
Example usage of the cloud-enabled ETL pipeline for deepfake datasets.
"""

import logging
from etl.pipeline import ETLPipeline
from etl.importers import import_faceforensicspp, import_celebdfpp
from etl.transformers import extract_frames, default_transformer
from etl.loaders import save_to_disk, default_loader

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    """Example usage of the cloud ETL pipeline."""
    
    # Initialize pipeline
    pipeline = ETLPipeline()
    
    # Configure cloud storage (replace with your AWS resources)
    pipeline.configure_cloud_storage(
        dynamodb_table="deepfake-dataset-metadata",
        s3_bucket="deepfake-detection-data",
        region_name="us-east-1"
    )
    
    # Register importers
    pipeline.register_importer("faceforensicspp", import_faceforensicspp)
    pipeline.register_importer("celebdfpp", import_celebdfpp)
    
    # Register transformers (optional)
    pipeline.register_transformer("extract_frames", extract_frames)
    pipeline.register_transformer("default", default_transformer)
    
    # Register loaders (optional for cloud ETL)
    pipeline.register_loader("save_to_disk", save_to_disk)
    pipeline.register_loader("default", default_loader)
    
    # Example 1: Run cloud ETL for FaceForensics++ dataset
    logger.info("Running FaceForensics++ cloud ETL...")
    try:
        ff_data = pipeline.run_cloud_etl(
            dataset_name="faceforensicspp",
            data_dir="/path/to/faceforensicspp/dataset",
            dataset_type="faceforensicspp",
            upload_files=True,  # Set to True to upload files to S3
            transform_args={"frame_rate": 1}
        )
        logger.info(f"FaceForensics++ ETL completed. Processed {len(ff_data.get('downloaded_videos', []))} downloaded videos.")
    except Exception as e:
        logger.error(f"FaceForensics++ ETL failed: {e}")
    
    # Example 2: Run cloud ETL for Celeb-DF++ dataset
    logger.info("Running Celeb-DF++ cloud ETL...")
    try:
        celebdf_data = pipeline.run_cloud_etl(
            dataset_name="celebdfpp",
            data_dir="/path/to/celebdfpp/dataset",
            dataset_type="celebdfpp",
            upload_files=False,  # Only store metadata, don't upload files
            transform_args={}
        )
        logger.info(f"Celeb-DF++ ETL completed. Processed real videos: {len(celebdf_data.get('real_videos', {}))}")
    except Exception as e:
        logger.error(f"Celeb-DF++ ETL failed: {e}")
    
    # Example 3: Query dataset metadata
    logger.info("Querying dataset metadata...")
    try:
        # Query all fake videos from FaceForensics++
        fake_videos = pipeline.query_dataset_metadata(
            dataset_name="FaceForensics++",
            is_fake=True
        )
        logger.info(f"Found {len(fake_videos)} fake videos in FaceForensics++")
        
        # Query all deepfakes videos
        deepfakes = pipeline.query_dataset_metadata(
            manipulation_method="deepfakes"
        )
        logger.info(f"Found {len(deepfakes)} deepfakes videos across all datasets")
        
    except Exception as e:
        logger.error(f"Metadata query failed: {e}")
    
    # Example 4: Download dataset from S3
    logger.info("Downloading dataset from S3...")
    try:
        download_result = pipeline.download_from_cloud(
            s3_prefix="datasets/faceforensicspp/",
            local_dir="./downloaded_data"
        )
        logger.info(f"Downloaded {download_result['successful_downloads']} files to {download_result['local_directory']}")
    except Exception as e:
        logger.error(f"S3 download failed: {e}")

def run_traditional_etl():
    """Example of running traditional ETL without cloud storage."""
    
    pipeline = ETLPipeline()
    
    # Register components
    pipeline.register_importer("faceforensicspp", import_faceforensicspp)
    pipeline.register_transformer("extract_frames", extract_frames)
    pipeline.register_loader("save_to_disk", save_to_disk)
    
    # Run traditional ETL
    try:
        pipeline.run(
            dataset_name="faceforensicspp",
            import_args={"data_dir": "/path/to/faceforensicspp/dataset"},
            transform_args={"frame_rate": 1},
            load_args={"output_dir": "./processed_data"}
        )
        logger.info("Traditional ETL completed successfully")
    except Exception as e:
        logger.error(f"Traditional ETL failed: {e}")

if __name__ == "__main__":
    # Run cloud ETL examples
    main()
    
    # Uncomment to run traditional ETL
    # run_traditional_etl()
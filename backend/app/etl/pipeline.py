from typing import Callable, Dict, Any, Optional, List
import logging
from .storage_manager import DatasetStorageManager
from .loaders import load_to_cloud_storage

logger = logging.getLogger(__name__)

class ETLPipeline:
    def __init__(self, storage_manager: Optional[DatasetStorageManager] = None):
        self.importers = {}
        self.transformers = {}
        self.loaders = {}
        self.storage_manager = storage_manager

    def configure_cloud_storage(self, dynamodb_table: str, s3_bucket: str, region_name: str = 'us-east-1'):
        """Configure cloud storage for the pipeline."""
        self.storage_manager = DatasetStorageManager(dynamodb_table, s3_bucket, region_name)
        logger.info(f"Configured cloud storage: DynamoDB table '{dynamodb_table}', S3 bucket '{s3_bucket}'")

    def register_importer(self, name: str, importer: Callable):
        self.importers[name] = importer

    def register_transformer(self, name: str, transformer: Callable):
        self.transformers[name] = transformer

    def register_loader(self, name: str, loader: Callable):
        self.loaders[name] = loader

    def run(self, dataset_name: str, import_args: Dict[str, Any], 
            transform_args: Dict[str, Any] = None, load_args: Dict[str, Any] = None):
        """
        Run the ETL pipeline for a dataset.
        
        Args:
            dataset_name: Name of the dataset/importer to use
            import_args: Arguments for the importer
            transform_args: Arguments for transformers
            load_args: Arguments for loaders
        """
        if dataset_name not in self.importers:
            raise ValueError(f"No importer registered for {dataset_name}")
        
        transform_args = transform_args or {}
        load_args = load_args or {}
        
        logger.info(f"Starting ETL pipeline for dataset: {dataset_name}")
        
        # Import data
        logger.info("Step 1: Importing data...")
        data = self.importers[dataset_name](**import_args)
        
        # Transform data
        logger.info("Step 2: Transforming data...")
        for t_name, t_func in self.transformers.items():
            logger.info(f"Applying transformer: {t_name}")
            data = t_func(data, **transform_args)
        
        # Load data
        logger.info("Step 3: Loading data...")
        for l_name, l_func in self.loaders.items():
            logger.info(f"Applying loader: {l_name}")
            l_func(data, **load_args)
        
        logger.info("ETL pipeline completed successfully")
        return True

    def run_cloud_etl(self, dataset_name: str, data_dir: str, dataset_type: str, 
                     upload_files: bool = False, transform_args: Dict[str, Any] = None):
        """
        Run ETL pipeline with cloud storage integration.
        
        Args:
            dataset_name: Name of the dataset/importer to use
            data_dir: Local directory containing dataset
            dataset_type: Type of dataset ("faceforensicspp" or "celebdfpp")
            upload_files: Whether to upload files to S3
            transform_args: Arguments for transformers
        """
        if not self.storage_manager:
            raise ValueError("Cloud storage not configured. Call configure_cloud_storage() first.")
        
        transform_args = transform_args or {}
        
        logger.info(f"Starting cloud ETL pipeline for dataset: {dataset_name}")
        
        # Import data
        logger.info("Step 1: Importing dataset metadata...")
        data = self.importers[dataset_name](data_dir)
        
        # Transform data (if any transformers are registered)
        if self.transformers:
            logger.info("Step 2: Transforming data...")
            for t_name, t_func in self.transformers.items():
                logger.info(f"Applying transformer: {t_name}")
                data = t_func(data, **transform_args)
        
        # Load to cloud storage
        logger.info("Step 3: Loading to cloud storage...")
        load_to_cloud_storage(
            data=data,
            storage_manager=self.storage_manager,
            dataset_type=dataset_type,
            upload_files=upload_files
        )
        
        logger.info("Cloud ETL pipeline completed successfully")
        return data

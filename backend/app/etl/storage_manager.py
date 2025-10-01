import boto3
import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from botocore.exceptions import NoCredentialsError, ClientError
import logging

logger = logging.getLogger(__name__)

class DatasetStorageManager:
    """Manages storage of dataset metadata in DynamoDB and files in S3."""
    
    def __init__(self, dynamodb_table: str, s3_bucket: str, region_name: str = 'us-east-1'):
        """
        Initialize the storage manager.
        
        Args:
            dynamodb_table: Name of the DynamoDB table for metadata
            s3_bucket: Name of the S3 bucket for file storage
            region_name: AWS region name
        """
        try:
            self.dynamodb = boto3.resource('dynamodb', region_name=region_name)
            self.s3 = boto3.client('s3', region_name=region_name)
            self.table = self.dynamodb.Table(dynamodb_table)
            self.bucket = s3_bucket
            self.region = region_name
        except NoCredentialsError:
            logger.error("AWS credentials not found. Please configure your credentials.")
            raise
    
    def create_table_if_not_exists(self):
        """Create DynamoDB table if it doesn't exist."""
        try:
            # Check if table exists
            self.table.load()
            logger.info(f"Table {self.table.name} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Create table
                table = self.dynamodb.create_table(
                    TableName=self.table.name,
                    KeySchema=[
                        {
                            'AttributeName': 'dataset_id',
                            'KeyType': 'HASH'  # Partition key
                        },
                        {
                            'AttributeName': 'item_type',
                            'KeyType': 'RANGE'  # Sort key
                        }
                    ],
                    AttributeDefinitions=[
                        {
                            'AttributeName': 'dataset_id',
                            'AttributeType': 'S'
                        },
                        {
                            'AttributeName': 'item_type',
                            'AttributeType': 'S'
                        }
                    ],
                    BillingMode='PAY_PER_REQUEST'
                )
                # Wait for table to be created
                table.wait_until_exists()
                logger.info(f"Created table {self.table.name}")
            else:
                raise
    
    def store_dataset_metadata(self, dataset_result: Dict[str, Any], dataset_type: str):
        """
        Store dataset metadata from importers into DynamoDB.
        
        Args:
            dataset_result: Output from import_faceforensicspp or import_celebdfpp
            dataset_type: "faceforensicspp" or "celebdfpp"
        """
        if dataset_type == "faceforensicspp":
            self._store_faceforensicspp_metadata(dataset_result)
        elif dataset_type == "celebdfpp":
            self._store_celebdfpp_metadata(dataset_result)
        else:
            logger.warning(f"Unknown dataset type: {dataset_type}")
    
    def _store_faceforensicspp_metadata(self, data: Dict[str, Any]):
        """Store FaceForensics++ metadata in DynamoDB."""
        logger.info("Storing FaceForensics++ metadata in DynamoDB")
        
        # Store downloaded videos
        for video_path in data.get("downloaded_videos", []):
            self._store_video_item(
                video_path=video_path,
                dataset_name="FaceForensics++",
                item_type="downloaded_video",
                manipulation_method="original",
                is_fake=False,
                tags={"downloaded"}
            )
        
        # Store original sequences metadata
        youtube_data = data.get("original_sequences", {}).get("youtube", {})
        for compression_level, videos in youtube_data.items():
            for video_path in videos:
                self._store_video_item(
                    video_path=video_path,
                    dataset_name="FaceForensics++",
                    item_type="original_video",
                    manipulation_method="original",
                    compression_level=compression_level.replace("_", ""),
                    is_fake=False,
                    tags={"original", "youtube", compression_level}
                )
        
        # Store actors data
        for video_path in data.get("original_sequences", {}).get("actors", []):
            self._store_video_item(
                video_path=video_path,
                dataset_name="FaceForensics++",
                item_type="original_video",
                manipulation_method="original",
                is_fake=False,
                tags={"original", "actors"}
            )
        
        # Store manipulated sequences metadata
        for method, videos in data.get("manipulated_sequences", {}).items():
            for video_path in videos:
                self._store_video_item(
                    video_path=video_path,
                    dataset_name="FaceForensics++",
                    item_type="manipulated_video",
                    manipulation_method=method,
                    is_fake=True,
                    tags={"manipulated", method}
                )
    
    def _store_celebdfpp_metadata(self, data: Dict[str, Any]):
        """Store Celeb-DF++ metadata in DynamoDB."""
        logger.info("Storing Celeb-DF++ metadata in DynamoDB")
        
        # Store real videos
        for source_type, videos in data.get("real_videos", {}).items():
            for video_path in videos:
                self._store_video_item(
                    video_path=video_path,
                    dataset_name="Celeb-DF++",
                    item_type="real_video",
                    manipulation_method="original",
                    source_type=source_type,
                    is_fake=False,
                    tags={"real", source_type}
                )
        
        # Store synthetic videos
        for category, methods in data.get("synthetic_videos", {}).items():
            for method, videos in methods.items():
                for video_path in videos:
                    self._store_video_item(
                        video_path=video_path,
                        dataset_name="Celeb-DF++",
                        item_type="synthetic_video",
                        manipulation_method=method,
                        synthesis_category=category,
                        is_fake=True,
                        tags={"synthetic", category, method}
                    )
        
        # Store testing list
        if data.get("testing_list"):
            testing_item = {
                "dataset_id": "celebdf++_testing_list",
                "item_type": "metadata",
                "dataset_name": "Celeb-DF++",
                "testing_videos": data["testing_list"],
                "created_at": datetime.utcnow().isoformat(),
                "tags": {"testing", "metadata"}
            }
            self.table.put_item(Item=testing_item)
    
    def _store_video_item(self, video_path: str, dataset_name: str, item_type: str, 
                         manipulation_method: str, is_fake: bool, tags: set, **kwargs):
        """Helper method to store individual video metadata."""
        video_id = self._extract_video_id(video_path)
        
        item = {
            "dataset_id": f"{dataset_name.lower().replace('++', 'pp').replace('-', '')}_{video_id}",
            "item_type": item_type,
            "dataset_name": dataset_name,
            "manipulation_method": manipulation_method,
            "is_fake": is_fake,
            "local_path": video_path,
            "s3_path": self._generate_s3_path(video_path, dataset_name),
            "processing_status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "tags": list(tags),
            "file_size": self._get_file_size(video_path)
        }
        
        # Add any additional kwargs
        item.update(kwargs)
        
        try:
            self.table.put_item(Item=item)
            logger.debug(f"Stored metadata for {video_id}")
        except Exception as e:
            logger.error(f"Failed to store metadata for {video_id}: {e}")
    
    def upload_to_s3(self, local_path: str, s3_key: str = None) -> bool:
        """Upload file to S3 and update DynamoDB status."""
        if not s3_key:
            s3_key = self._generate_s3_path(local_path, "unknown")
        
        try:
            self.s3.upload_file(local_path, self.bucket, s3_key)
            logger.info(f"Uploaded {local_path} to s3://{self.bucket}/{s3_key}")
            
            # Update processing status in DynamoDB
            video_id = self._extract_video_id(local_path)
            self._update_processing_status(video_id, "uploaded")
            
            return True
        except Exception as e:
            logger.error(f"Failed to upload {local_path}: {e}")
            self._update_processing_status(self._extract_video_id(local_path), "upload_failed")
            return False
    
    def download_from_s3(self, s3_key: str, local_path: str) -> bool:
        """Download file from S3 to local path."""
        try:
            self.s3.download_file(self.bucket, s3_key, local_path)
            logger.info(f"Downloaded s3://{self.bucket}/{s3_key} to {local_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to download {s3_key}: {e}")
            return False
    
    def list_s3_objects(self, prefix: str = "") -> List[str]:
        """List objects in S3 bucket with given prefix."""
        try:
            response = self.s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
            return [obj['Key'] for obj in response.get('Contents', [])]
        except Exception as e:
            logger.error(f"Failed to list S3 objects: {e}")
            return []
    
    def query_dataset(self, dataset_name: str = None, is_fake: bool = None, 
                     manipulation_method: str = None) -> List[Dict]:
        """Query dataset metadata from DynamoDB."""
        try:
            # This is a simple scan - for production, consider using GSI for better performance
            scan_kwargs = {}
            filter_expressions = []
            
            if dataset_name:
                filter_expressions.append("dataset_name = :dataset_name")
                scan_kwargs[':dataset_name'] = dataset_name
            
            if is_fake is not None:
                filter_expressions.append("is_fake = :is_fake")
                scan_kwargs[':is_fake'] = is_fake
            
            if manipulation_method:
                filter_expressions.append("manipulation_method = :method")
                scan_kwargs[':method'] = manipulation_method
            
            if filter_expressions:
                scan_kwargs['FilterExpression'] = ' AND '.join(filter_expressions)
                scan_kwargs['ExpressionAttributeValues'] = scan_kwargs
            
            response = self.table.scan(**scan_kwargs)
            return response.get('Items', [])
        except Exception as e:
            logger.error(f"Failed to query dataset: {e}")
            return []
    
    def get_video_metadata(self, dataset_id: str, item_type: str = "video") -> Optional[Dict]:
        """Get specific video metadata from DynamoDB."""
        try:
            response = self.table.get_item(
                Key={
                    'dataset_id': dataset_id,
                    'item_type': item_type
                }
            )
            return response.get('Item')
        except Exception as e:
            logger.error(f"Failed to get video metadata: {e}")
            return None
    
    def _update_processing_status(self, video_id: str, status: str):
        """Update processing status for a video."""
        try:
            # This is simplified - in practice you'd need to handle multiple item_types
            self.table.update_item(
                Key={'dataset_id': video_id, 'item_type': 'video'},
                UpdateExpression='SET processing_status = :status, updated_at = :updated',
                ExpressionAttributeValues={
                    ':status': status,
                    ':updated': datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Failed to update status for {video_id}: {e}")
    
    def _extract_video_id(self, video_path: str) -> str:
        """Extract unique video ID from file path."""
        return os.path.basename(video_path).split('.')[0]
    
    def _generate_s3_path(self, local_path: str, dataset: str) -> str:
        """Generate S3 object key from local path."""
        filename = os.path.basename(local_path)
        dataset_clean = dataset.lower().replace('++', 'pp').replace('-', '').replace(' ', '')
        return f"datasets/{dataset_clean}/raw/{filename}"
    
    def _get_file_size(self, file_path: str) -> int:
        """Get file size in bytes."""
        try:
            return os.path.getsize(file_path)
        except OSError:
            return 0
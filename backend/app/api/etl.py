from fastapi import APIRouter, Depends
from app.api.auth import get_current_user
from app.etl.pipeline import ETLPipeline
from app.etl.importers import import_faceforensicspp
from app.etl.transformers import default_transformer
from app.etl.loaders import default_loader

router = APIRouter()

etl_pipeline = ETLPipeline()
etl_pipeline.register_importer("FaceForensics++", import_faceforensicspp)
etl_pipeline.register_transformer("default", default_transformer)
etl_pipeline.register_loader("default", default_loader)

@router.post("/run")
async def run_etl(dataset_name: str, data_dir: str, current_user: dict = Depends(get_current_user)):
    etl_pipeline.run(
        dataset_name,
        import_args={"data_dir": data_dir},
        transform_args={},
        load_args={}
    )
    return {"status": "ETL completed for " + dataset_name}

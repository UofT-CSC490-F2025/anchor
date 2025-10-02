from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.etl import router as etl_router

app = FastAPI()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(etl_router, prefix="/etl", tags=["etl"])

@app.get("/")
async def read_root():
    return {"message": "Anchor backend is running."}

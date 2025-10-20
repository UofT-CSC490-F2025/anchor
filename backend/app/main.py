from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.api.tiktok_scrapper import router as tiktok_router

app = FastAPI(title="TikTok Fact Checker API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your router
app.include_router(tiktok_router, prefix="/api/tiktok", tags=["tiktok"])

@app.get("/")
async def root():
    return {"message": "Welcome to the TikTok Fact Checker API"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

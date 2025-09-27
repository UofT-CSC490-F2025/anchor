# Anchor Backend

This directory contains the FastAPI backend, ETL pipeline, ML model integrations, and feedback loop logic.

## Structure
- `app/api/`: FastAPI route definitions
- `app/models/`: Pydantic models and DB schemas
- `app/services/`: ML model wrappers and business logic
- `app/etl/`: TikTok ETL pipeline and cron jobs
- `app/feedback/`: User feedback loop logic
- `app/utils/`: Utility functions

## Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Run the server: `uvicorn app.main:app --reload`

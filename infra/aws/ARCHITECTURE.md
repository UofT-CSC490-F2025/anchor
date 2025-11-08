# Anchor AWS Infrastructure - Simplified Architecture

## Application Flow

```
Frontend (React Native) 
    ↓
    POST /auth/login → Backend (ECS Fargate) → PostgreSQL RDS
    ↓
    POST /api/tiktok/predict → Backend → Video Analysis
```

## Deployed AWS Services

### Core Infrastructure
1. **ECS Fargate** - Runs FastAPI backend containers (2-10 auto-scaling tasks)
2. **RDS PostgreSQL** - Database for users, videos, analysis results
3. **Application Load Balancer** - Public HTTP endpoint for API
4. **ECR** - Docker image registry

### Supporting Services
- **VPC** with public/private subnets
- **NAT Gateway** for private subnet internet access
- **Secrets Manager** for database credentials and JWT secrets
- **CloudWatch** for logs and monitoring
- **Auto Scaling** for ECS tasks based on CPU/memory

## Removed Components

The following services were **removed** as they were only needed for the ETL pipeline (which is no longer part of the project):

- ❌ **S3 buckets** (for video storage and datasets)
- ❌ **DynamoDB** (for dataset metadata)
- ❌ **CloudFront CDN**
- ❌ **WAF Web ACL**

## Architecture Simplification

**Before** (with ETL):
```
Frontend → CloudFront → ALB → ECS → RDS
                               ↓
                        S3 + DynamoDB
```

**After** (Auth + Analysis only):
```
Frontend → ALB → ECS → RDS
```

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication  
- `POST /auth/refresh` - Refresh tokens
- `POST /auth/logout` - Logout
- `GET /auth/validate` - Validate token

### TikTok Analysis (`/api/tiktok`)
- `POST /api/tiktok/predict` - Analyze TikTok video for deepfakes and fact-check

### Health
- `GET /health` - Service health check
- `GET /` - API information
- `GET /docs` - Swagger documentation

## Cost Estimate

| Service | Monthly Cost |
|---------|-------------|
| ECS Fargate (2 tasks) | ~$60 |
| RDS PostgreSQL | ~$60 |
| ALB | ~$20 |
| NAT Gateway | ~$33 |
| Other (Logs, Secrets) | ~$6 |
| **Total** | **~$179/month** |

**Savings from simplification**: ~$15-20/month (no S3 lifecycle, DynamoDB, CloudFront)

## Quick Deploy

```bash
# 1. Configure variables
cd infra/aws/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your passwords

# 2. Deploy infrastructure
terraform init
terraform apply

# 3. Build and push Docker image
ECR_REPO=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REPO
docker build -t $ECR_REPO:latest -f backend/Dockerfile ./backend
docker push $ECR_REPO:latest

# 4. Apply database schema
RDS_HOST=$(terraform output -raw rds_address)
psql -h $RDS_HOST -U anchoradmin -d anchor -f ../../backend/db/schema.sql
```

## CI/CD Pipeline

**GitHub Actions** automatically:
1. Builds Docker image on push to `main`
2. Pushes to ECR
3. Updates ECS service with new image

**Setup**: Add AWS credentials to GitHub Secrets
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Monitoring

```bash
# View API health
curl http://<alb-dns>/health

# View logs
aws logs tail /ecs/anchor-prod --follow

# Check ECS status
aws ecs describe-services --cluster anchor-cluster-prod --services anchor-service-prod
```

## What Changed from Original Design

### Removed Files
- `infra/aws/terraform/s3.tf` ❌
- `infra/aws/terraform/dynamodb.tf` ❌  
- `infra/aws/terraform/cloudfront.tf` ❌
- `backend/app/api/etl.py` router ❌

### Updated Files
- `backend/app/main.py` - Removed ETL router, still has AWS Secrets Manager support
- `infra/aws/terraform/ecs.tf` - Removed S3/DynamoDB environment variables
- `infra/aws/terraform/security.tf` - Removed S3/DynamoDB IAM policies, removed WAF
- `infra/aws/terraform/outputs.tf` - Removed S3/DynamoDB/CloudFront outputs
- `infra/aws/terraform/variables.tf` - Removed S3/DynamoDB/CloudFront variables
- `.github/workflows/deploy.yml` - Removed CloudFront cache invalidation

### Application Flow
**Frontend** → Makes HTTP requests to ALB  
**ALB** → Routes to ECS Fargate tasks  
**ECS** → Runs FastAPI backend  
**Backend** → Connects to RDS PostgreSQL  

**Analysis Flow**:
1. User submits TikTok URL via frontend
2. Frontend calls `POST /api/tiktok/predict`
3. Backend downloads video, extracts frames
4. Performs OCR (Tesseract), speech-to-text
5. Summarizes with BART model
6. Fact-checks with ClaimBuster API
7. Returns results to frontend

No S3 storage - videos processed in-memory and discarded.

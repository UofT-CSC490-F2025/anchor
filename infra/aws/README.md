# AWS Deployment Guide

This directory contains the infrastructure-as-code and deployment scripts for deploying Anchor to AWS.

## Architecture Overview

The application is deployed using the following AWS services:

- **ECS Fargate**: Serverless container orchestration for the FastAPI backend
- **RDS PostgreSQL**: Managed database service
- **Application Load Balancer**: Load balancing for ECS tasks
- **Secrets Manager**: Secure storage for sensitive configuration
- **ECR**: Container registry for Docker images
- **CloudWatch**: Logging and monitoring

## Prerequisites

### Required Tools

1. **Terraform** (>= 1.0)
   ```bash
   # Install on macOS
   brew install terraform
   
   # Install on Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

2. **AWS CLI** (>= 2.0)
   ```bash
   # Install on macOS
   brew install awscli
   
   # Install on Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

3. **Docker**
   - Install from https://docs.docker.com/get-docker/

4. **Git**
   - For versioning and deployment

### AWS Account Setup

1. **Create an AWS Account** if you don't have one

2. **Configure AWS Credentials**
   ```bash
   aws configure
   ```
   
   You'll need:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format (e.g., `json`)

## Deployment Steps

### 1. Configure Variables

Copy the example terraform variables file:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and update the following required values:

```hcl
# Database password (REQUIRED - use a strong password)
db_password = "YOUR_STRONG_PASSWORD_HERE"

# JWT secret key (REQUIRED - use a random string)
jwt_secret_key = "YOUR_RANDOM_SECRET_KEY_HERE"

# Optional: adjust resource sizing
ecs_task_cpu = 2048
ecs_task_memory = 4096
db_instance_class = "db.t3.medium"
```

**Generate Strong Secrets:**

```bash
# Generate a strong database password
openssl rand -base64 32

# Generate a JWT secret key
openssl rand -hex 64
```

### 2. Deploy Infrastructure

You can deploy using either the automated script or manual commands:

#### Option A: Automated Deployment (Recommended)

```bash
# From the root of the repository
chmod +x infra/aws/deploy.sh
./infra/aws/deploy.sh
```

This script will:
1. Check prerequisites
2. Initialize Terraform
3. Create infrastructure
4. Build and push Docker image
5. Deploy to ECS

#### Option B: Manual Deployment

```bash
# 1. Initialize Terraform
cd terraform
terraform init

# 2. Review the plan
terraform plan

# 3. Apply the infrastructure
terraform apply

# 4. Build and push Docker image
cd ../../..
ECR_REPOSITORY=$(cd infra/aws/terraform && terraform output -raw ecr_repository_url)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REPOSITORY
docker build -t anchor-app:latest -f backend/Dockerfile ./backend
docker tag anchor-app:latest $ECR_REPOSITORY:latest
docker push $ECR_REPOSITORY:latest

# 5. Force new ECS deployment
ECS_CLUSTER=$(cd infra/aws/terraform && terraform output -raw ecs_cluster_name)
ECS_SERVICE=$(cd infra/aws/terraform && terraform output -raw ecs_service_name)
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment
```

### 3. Apply Database Schema

After infrastructure is deployed, apply the database schema:

```bash
# Get RDS endpoint
cd terraform
RDS_ENDPOINT=$(terraform output -raw rds_address)
DB_PASSWORD="your_db_password"

# Apply schema (from a machine with network access to RDS)
psql -h $RDS_ENDPOINT -U anchoradmin -d anchor -f ../../backend/db/schema.sql
```

**Note:** If you can't access RDS directly, you may need to:
1. Create a temporary EC2 instance in the same VPC
2. SSH into the instance
3. Install PostgreSQL client: `sudo apt-get install postgresql-client`
4. Run the schema from there

### 4. Verify Deployment

Check the deployment status:

```bash
# View ECS service status
aws ecs describe-services --cluster anchor-cluster-prod --services anchor-service-prod

# View CloudWatch logs
aws logs tail /ecs/anchor-prod --follow

# Test the API
ALB_URL=$(cd terraform && terraform output -raw alb_url)
curl $ALB_URL/health
```

## CI/CD Pipeline

The repository includes a GitHub Actions workflow for automated deployments.

### Setup GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. `AWS_ACCESS_KEY_ID` - Your AWS access key
2. `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

### Trigger Deployment

The pipeline automatically deploys when you push to the `main` or `develop` branch:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

## Monitoring and Troubleshooting

### CloudWatch Logs

View application logs:

```bash
aws logs tail /ecs/anchor-prod --follow --region us-east-1
```

### CloudWatch Alarms

The deployment creates alarms for:
- ECS CPU utilization
- ECS memory utilization
- RDS CPU, memory, storage, connections


View alarms:

```bash
aws cloudwatch describe-alarms --region us-east-1
```

#### High Costs

Monitor costs:
1. Go to AWS Cost Explorer
2. Check ECS Fargate, RDS, and data transfer costs
3. Consider:
   - Reducing ECS task size or count
   - Using RDS instance savings plans
   - Implementing S3 lifecycle policies

## Scaling

### Auto-Scaling Configuration

The deployment includes auto-scaling for:

**ECS Tasks:**
- Min: 2 tasks
- Max: 10 tasks
- Target CPU: 70%
- Target Memory: 80%

**RDS:**
- Storage auto-scaling up to 500GB

### Manual Scaling

Adjust scaling in `terraform.tfvars`:

```hcl
# Increase ECS capacity
ecs_min_capacity = 3
ecs_max_capacity = 20

# Upgrade RDS instance
db_instance_class = "db.m5.large"
```

Apply changes:
```bash
cd terraform
terraform apply
```

## Cleanup

To destroy all infrastructure (be careful!):

```bash
cd terraform
terraform destroy
```

This will:
- Delete all ECS services and tasks
- Remove RDS database (with final snapshot)
- Delete S3 buckets (must be empty first)
- Remove all other AWS resources

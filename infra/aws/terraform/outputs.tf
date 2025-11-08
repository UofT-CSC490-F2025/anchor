# Outputs for important resource information

# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of IDs of private subnets"
  value       = aws_subnet.private[*].id
}

# RDS Outputs
output "rds_endpoint" {
  description = "The connection endpoint for the RDS instance"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "The hostname of the RDS instance"
  value       = aws_db_instance.postgres.address
}

output "rds_port" {
  description = "The port the RDS instance is listening on"
  value       = aws_db_instance.postgres.port
}

output "database_url" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${var.db_name}"
  sensitive   = true
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "The ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "The name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "The name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "The ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "api_url" {
  description = "The public API URL"
  value       = "http://${aws_lb.main.dns_name}"
}

# Secrets Manager Outputs
output "db_credentials_secret_arn" {
  description = "The ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = true
}

output "jwt_secret_arn" {
  description = "The ARN of the JWT secret"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "The ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_tasks_security_group_id" {
  description = "The ID of the ECS tasks security group"
  value       = aws_security_group.ecs_tasks.id
}

output "rds_security_group_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.rds.id
}

# IAM Role Outputs
output "ecs_task_execution_role_arn" {
  description = "The ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "The ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

# CloudWatch Outputs
output "ecs_log_group_name" {
  description = "The name of the CloudWatch log group for ECS"
  value       = aws_cloudwatch_log_group.ecs.name
}

# Summary Output
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    environment     = var.environment
    region          = var.aws_region
    api_endpoint    = "http://${aws_lb.main.dns_name}"
    docs_endpoint   = "http://${aws_lb.main.dns_name}/docs"
    ecr_repository  = aws_ecr_repository.app.repository_url
    rds_endpoint    = aws_db_instance.postgres.endpoint
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "anchor"
}

# Database Variables
variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "anchor"
}

variable "db_username" {
  description = "PostgreSQL master username"
  type        = string
  default     = "anchoradmin"
  sensitive   = true
}

variable "db_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS in GB"
  type        = number
  default     = 500
}

# ECS Variables
variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1024 = 1 vCPU)"
  type        = number
  default     = 2048
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 4096
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks for autoscaling"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks for autoscaling"
  type        = number
  default     = 10
}

variable "container_port" {
  description = "Port exposed by the container"
  type        = number
  default     = 8000
}

# Application Variables
variable "jwt_secret_key" {
  description = "JWT secret key for authentication"
  type        = string
  sensitive   = true
}

variable "jwt_algorithm" {
  description = "JWT algorithm"
  type        = string
  default     = "HS256"
}

variable "access_token_expire_minutes" {
  description = "Access token expiration time in minutes"
  type        = number
  default     = 30
}

variable "refresh_token_expire_days" {
  description = "Refresh token expiration time in days"
  type        = number
  default     = 7
}

# Monitoring Variables
variable "enable_enhanced_monitoring" {
  description = "Enable enhanced RDS monitoring"
  type        = bool
  default     = true
}

variable "monitoring_interval" {
  description = "RDS monitoring interval in seconds"
  type        = number
  default     = 60
}

# Tags
variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}

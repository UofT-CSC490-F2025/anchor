# RDS Subnet Group
resource "aws_db_subnet_group" "postgres" {
  name       = "anchor-db-subnet-group-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "anchor-db-subnet-group-${var.environment}"
  }
}

# RDS Parameter Group
resource "aws_db_parameter_group" "postgres" {
  name   = "anchor-postgres-params-${var.environment}"
  family = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_duration"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }

  tags = {
    Name = "anchor-postgres-params-${var.environment}"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier = "anchor-db-${var.environment}"

  # Engine
  engine               = "postgres"
  engine_version       = "16.1"
  instance_class       = var.db_instance_class
  
  # Storage
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  
  # Database
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432
  
  # Network
  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # Backup
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"
  skip_final_snapshot     = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "anchor-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  monitoring_interval             = var.enable_enhanced_monitoring ? var.monitoring_interval : 0
  monitoring_role_arn             = var.enable_enhanced_monitoring ? aws_iam_role.rds_monitoring[0].arn : null
  performance_insights_enabled    = true
  performance_insights_retention_period = 7
  
  # Parameters
  parameter_group_name = aws_db_parameter_group.postgres.name
  
  # Protection
  deletion_protection = var.environment == "prod" ? true : false
  
  # Auto minor version upgrade
  auto_minor_version_upgrade = true
  
  tags = {
    Name = "anchor-db-${var.environment}"
  }
}

# IAM Role for Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  count = var.enable_enhanced_monitoring ? 1 : 0
  name  = "anchor-rds-monitoring-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "anchor-rds-monitoring-${var.environment}"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count      = var.enable_enhanced_monitoring ? 1 : 0
  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# CloudWatch Alarms for RDS
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "anchor-db-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
}

resource "aws_cloudwatch_metric_alarm" "database_memory" {
  alarm_name          = "anchor-db-memory-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000000000" # 1GB in bytes
  alarm_description   = "This metric monitors RDS freeable memory"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
}

resource "aws_cloudwatch_metric_alarm" "database_storage" {
  alarm_name          = "anchor-db-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10000000000" # 10GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "anchor-db-connections-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS database connections"
  alarm_actions       = []

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.postgres.id
  }
}

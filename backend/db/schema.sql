-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE social_platform AS ENUM ('twitter','facebook','instagram','tiktok','youtube');
CREATE TYPE detection_status AS ENUM ('pending','processing','completed','failed');
CREATE TYPE risk_level AS ENUM ('low','medium','high','critical');
CREATE TYPE job_status AS ENUM ('queued','processing','completed','failed','cancelled');
CREATE TYPE analysis_status AS ENUM ('pending','running','completed','failed');
CREATE TYPE report_status AS ENUM ('open','under_review','resolved','dismissed');
CREATE TYPE notification_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE notification_status AS ENUM ('scheduled','sent','delivered','failed');
CREATE TYPE content_type AS ENUM (
  'misinformation','hate_speech','spam','inappropriate','violence','adult_content',
  'harassment','self_harm','terrorism','child_safety'
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  locale TEXT NOT NULL DEFAULT 'en',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Privacy consents
CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  granted_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL
);

-- User accounts (social)
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  platform_user_id TEXT NOT NULL,
  oauth_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  refresh_token TEXT,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, platform_user_id),
  UNIQUE (user_id, platform)
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL,
  push_token TEXT,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uploads
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  file_path TEXT NOT NULL,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  etag TEXT NOT NULL
);

-- Ingestion jobs
CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  user_account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  error JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  platform_video_id TEXT NOT NULL,
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  ingestion_job_id UUID REFERENCES ingestion_jobs(id) ON DELETE SET NULL,
  url TEXT,
  title TEXT,
  description TEXT,
  detection_status detection_status NOT NULL DEFAULT 'pending',
  confidence_score DOUBLE PRECISION,
  risk_level risk_level,
  view_count BIGINT,
  captions TEXT,
  posted_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  resolution JSONB,
  thumbnail_path TEXT,
  s3_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, platform_video_id)
);
CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(detection_status);

-- Content categories
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  detection_priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Models (versions tracked as rows)
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  model_type TEXT NOT NULL,
  source TEXT NOT NULL,
  version TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name, version)
);

-- Analysis runs
CREATE TABLE IF NOT EXISTS analysis_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  initiated_by_uuid UUID REFERENCES users(id) ON DELETE SET NULL,
  model_version_id UUID NOT NULL REFERENCES models(id) ON DELETE RESTRICT,
  analysis_type TEXT NOT NULL,
  status analysis_status NOT NULL DEFAULT 'pending',
  result JSONB,
  score DOUBLE PRECISION,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analysis_video ON analysis_runs(video_id);
CREATE INDEX IF NOT EXISTS idx_analysis_model ON analysis_runs(model_version_id);

-- Detection labels
CREATE TABLE IF NOT EXISTS detection_labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  confidence DOUBLE PRECISION NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_labels_run ON detection_labels(analysis_run_id);

-- Audio transcripts
CREATE TABLE IF NOT EXISTS audio_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  transcript TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  model_version_id UUID NOT NULL REFERENCES models(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (video_id, segment_index)
);

-- User trust scores
CREATE TABLE IF NOT EXISTS user_trust_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  current_score DOUBLE PRECISION NOT NULL DEFAULT 0,
  score_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  factors JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Content reports
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_reports_video ON content_reports(video_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status);

-- Exposure summaries
CREATE TABLE IF NOT EXISTS exposure_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  summary_text TEXT,
  summary_struct JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_version_id UUID NOT NULL REFERENCES models(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analysis_run_id UUID NOT NULL REFERENCES analysis_runs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, analysis_run_id)
);

-- Real-time alerts
CREATE TABLE IF NOT EXISTS real_time_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  threshold_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority_level notification_priority NOT NULL DEFAULT 'medium',
  notification_channel TEXT NOT NULL,
  action_required BOOLEAN NOT NULL DEFAULT FALSE,
  relation_analysis_id UUID REFERENCES analysis_runs(id) ON DELETE SET NULL,
  status notification_status NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
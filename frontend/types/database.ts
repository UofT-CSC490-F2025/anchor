/**
 * Database Schema Types
 * TypeScript interfaces matching the database schema for type safety
 */

// Base types
export type UUID = string;
export type Timestamptz = string; // ISO 8601 timestamp string

// User Management
export interface User {
  id: UUID;
  email: string;
  display_name: string;
  created_at: Timestamptz;
  updated_at: Timestamptz;
  is_active: boolean;
  locale: string;
  metadata: Record<string, any>;
}

export interface PrivacyConsent {
  id: UUID;
  user_id: UUID;
  consent_type: string;
  consent_value: Record<string, any>;
  granted_at: Timestamptz;
  revoked_at?: Timestamptz;
  ip_address: string;
  user_agent: string;
}

export interface UserAccount {
  id: UUID;
  user_id: UUID;
  platform: SocialPlatform;
  platform_user_id: string;
  oauth_token: string;
  token_expires_at?: Timestamptz;
  refresh_token?: string;
  scopes: string[];
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

export interface Device {
  id: UUID;
  user_id: UUID;
  device_type: string;
  push_token?: string;
  last_seen: Timestamptz;
  created_at: Timestamptz;
}

// Content and Media
export interface Upload {
  id: UUID;
  user_id: UUID;
  source: string;
  file_path: string;
  manifest: Record<string, any>;
  uploaded_at: Timestamptz;
  processed: boolean;
  processed_at?: Timestamptz;
  size_bytes: number;
  etag: string;
}

export interface IngestionJob {
  id: UUID;
  upload_id?: UUID;
  user_account_id?: UUID;
  job_type: string;
  status: JobStatus;
  started_at?: Timestamptz;
  finished_at?: Timestamptz;
  error?: Record<string, any>;
  created_at: Timestamptz;
}

export interface Video {
  id: UUID;
  user_id: UUID;
  platform: SocialPlatform;
  platform_video_id: string;
  upload_id?: UUID;
  ingestion_job_id?: UUID;
  url?: string;
  title?: string;
  description?: string;
  detection_status: DetectionStatus;
  confidence_score?: number;
  risk_level?: RiskLevel;
  view_count?: number;
  captions?: string;
  posted_at?: Timestamptz;
  duration_seconds?: number;
  resolution?: Record<string, any>;
  thumbnail_path?: string;
  s3_path?: string;
  metadata: Record<string, any>;
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

// Content Analysis
export interface ContentCategory {
  id: UUID;
  name: string;
  description?: string;
  detection_priority: number;
  created_at: Timestamptz;
}

export interface Model {
  id: UUID;
  name: string;
  model_type: string;
  source: string;
  version: string;
  config: Record<string, any>;
  created_at: Timestamptz;
}

export interface AnalysisRun {
  id: UUID;
  video_id: UUID;
  initiated_by_uuid?: UUID;
  model_version_id: UUID;
  analysis_type: string;
  status: AnalysisStatus;
  result?: Record<string, any>;
  score?: number;
  started_at?: Timestamptz;
  finished_at?: Timestamptz;
  created_at: Timestamptz;
}

export interface DetectionLabel {
  id: UUID;
  analysis_run_id: UUID;
  label: string;
  category_id?: UUID;
  confidence: number;
  details?: Record<string, any>;
  created_at: Timestamptz;
}

export interface AudioTranscript {
  id: UUID;
  video_id: UUID;
  segment_index: number;
  start_ms: number;
  end_ms: number;
  transcript: string;
  confidence: number;
  model_version_id: UUID;
  created_at: Timestamptz;
}

// User Trust and Scoring
export interface UserTrustScore {
  id: UUID;
  user_id: UUID;
  current_score: number;
  score_history: Record<string, any>;
  last_updated: Timestamptz;
  factors: Record<string, any>;
}

export interface ContentReport {
  id: UUID;
  reporter_id: UUID;
  video_id: UUID;
  report_type: string;
  description?: string;
  status: ReportStatus;
  reviewed_by?: UUID;
  created_at: Timestamptz;
  resolved_at?: Timestamptz;
}

// Summaries and Insights
export interface ExposureSummary {
  id: UUID;
  user_id: UUID;
  period_start: Timestamptz;
  period_end: Timestamptz;
  summary_text?: string;
  summary_struct: Record<string, any>;
  model_version_id: UUID;
  created_at: Timestamptz;
}

export interface Feedback {
  id: UUID;
  user_id: UUID;
  analysis_run_id: UUID;
  rating: number;
  reason?: string;
  metadata?: Record<string, any>;
  created_at: Timestamptz;
}

// Notifications and Alerts
export interface RealTimeAlert {
  id: UUID;
  user_id: UUID;
  alert_type: string;
  threshold_config: Record<string, any>;
  is_active: boolean;
  created_at: Timestamptz;
}

export interface Notification {
  id: UUID;
  user_id: UUID;
  device_id?: UUID;
  trigger_type: string;
  payload: Record<string, any>;
  priority_level: NotificationPriority;
  notification_channel: string;
  action_required: boolean;
  relation_analysis_id?: UUID;
  status: NotificationStatus;
  scheduled_at?: Timestamptz;
  sent_at?: Timestamptz;
  created_at: Timestamptz;
}

// Audit and Logging
export interface Log {
  id: UUID;
  actor_id?: UUID;
  actor_type?: string;
  action: string;
  target_type?: string;
  target_id?: UUID;
  details?: Record<string, any>;
  created_at: Timestamptz;
}

// Enums and Union Types
export type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';

export type DetectionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type AnalysisStatus = 'pending' | 'running' | 'completed' | 'failed';

export type ReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'scheduled' | 'sent' | 'delivered' | 'failed';

// Content Types for Classification
export type ContentType = 
  | 'misinformation' 
  | 'hate_speech' 
  | 'spam' 
  | 'inappropriate' 
  | 'violence' 
  | 'adult_content' 
  | 'harassment' 
  | 'self_harm' 
  | 'terrorism' 
  | 'child_safety';

// Extended API Response Types for Frontend
export interface VideoWithAnalysis extends Video {
  analysis_runs?: AnalysisRun[];
  detection_labels?: DetectionLabel[];
  transcripts?: AudioTranscript[];
  reports?: ContentReport[];
  user_feedback?: Feedback[];
}

export interface DashboardMetrics {
  user_id: UUID;
  total_videos: number;
  flagged_videos: number;
  high_risk_videos: number;
  pending_reviews: number;
  accuracy_rate: number;
  trust_score: number;
  time_range: string;
  platform_breakdown: Record<SocialPlatform, number>;
  risk_breakdown: Record<RiskLevel, number>;
  content_type_breakdown: Record<ContentType, number>;
}

export interface UserProfile extends User {
  user_accounts: UserAccount[];
  devices: Device[];
  trust_score?: UserTrustScore;
  privacy_consents: PrivacyConsent[];
  real_time_alerts: RealTimeAlert[];
}

export interface ContentAnalytics {
  period_start: Timestamptz;
  period_end: Timestamptz;
  engagement_data: Array<{
    date: string;
    videos_analyzed: number;
    flagged_count: number;
    platforms: Record<SocialPlatform, number>;
    risk_levels: Record<RiskLevel, number>;
  }>;
  trends: {
    content_types: Array<{
      type: ContentType;
      count: number;
      change_percent: number;
    }>;
    platforms: Array<{
      platform: SocialPlatform;
      count: number;
      change_percent: number;
    }>;
  };
}
export type HealthStatus =
  | "ONLINE"
  | "DEGRADED"
  | "OFFLINE"
  | "UNKNOWN"
  | "PROBATION"
  | "VERIFIED_CANDIDATE";

export type FailureReason =
  | "GEO_BLOCKED_OR_UNREACHABLE"
  | "TIMEOUT"
  | "AUTH_REQUIRED"
  | "INVALID_MANIFEST"
  | "NO_SEGMENTS"
  | "CODEC_UNSUPPORTED"
  | "SSRF_BLOCKED"
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export type TamilCategory =
  | "Entertainment"
  | "News"
  | "Movies"
  | "Music"
  | "Religious"
  | "Kids"
  | "Sports"
  | "Culture"
  | "General"
  | "Other";

export interface TamilChannel {
  id: string;
  source_channel_id: string;
  tvg_id: string | null;
  name: string;
  normalized_name: string;
  logo_url: string | null;
  group_title: string | null;
  language: string;
  country: string | null;
  category: TamilCategory;
  source_url: string;
  active: boolean;
  verified: boolean;
  health_status: HealthStatus;
  health_score: number;
  last_checked_at: number | null;
  last_success_at: number | null;
  consecutive_failures: number;
  consecutive_successes: number;
  latency_ms: number | null;
  stream_type: "hls" | "mp4" | "dash" | "unknown";
  resolution: string | null;
  bitrate: number | null;
  failure_reason: FailureReason | null;
  created_at: number;
  updated_at: number;
  primary_stream_id?: string;
  streams?: TamilStream[];
}

export interface TamilStream {
  id: string;
  channel_id: string;
  stream_url: string;
  source: string;
  protocol: "https" | "http";
  active: boolean;
  health_status: HealthStatus;
  health_score: number;
  last_checked_at: number | null;
  last_success_at: number | null;
  consecutive_failures: number;
  consecutive_successes: number;
  latency_ms: number | null;
  http_status: number | null;
  content_type: string | null;
  failure_reason: FailureReason | null;
  resolution: string | null;
  bitrate: number | null;
  created_at: number;
  updated_at: number;
}

export interface HealthCheckRecord {
  id: string;
  stream_id: string;
  channel_id: string;
  checked_at: number;
  status: HealthStatus;
  http_status: number | null;
  latency_ms: number;
  startup_time_ms: number | null;
  manifest_valid: boolean;
  segment_available: boolean;
  content_detected: boolean;
  error_code: string | null;
  error_message: string | null;
}

export interface TamilSyncStats {
  total_source_channels: number;
  unique_channels: number;
  duplicate_channels: number;
  verified_channels: number;
  degraded_channels: number;
  offline_channels: number;
  skipped_channels: number;
  total_streams: number;
  verified_streams: number;
  last_sync_at: number | null;
  last_health_scan_at: number | null;
  sync_duration_ms: number;
  health_scan_duration_ms: number;
  average_latency_ms: number;
  p95_latency_ms: number;
  availability_rate: number;
  is_syncing: boolean;
  is_scanning: boolean;
  last_sync_status: "success" | "failed" | "partial" | "idle";
  last_sync_error: string | null;
}

export interface ParsedM3UEntry {
  rawName: string;
  cleanName: string;
  streamUrl: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  country?: string;
  language?: string;
  httpReferrer?: string;
  userAgent?: string;
  resolution?: string;
  isGeoBlockedNote?: boolean;
}

export interface HealthProbeResult {
  streamId: string;
  status: HealthStatus;
  httpStatus: number | null;
  latencyMs: number;
  startupTimeMs: number | null;
  manifestValid: boolean;
  segmentAvailable: boolean;
  contentDetected: boolean;
  resolution: string | null;
  bitrate: number | null;
  failureReason: FailureReason | null;
  errorMessage: string | null;
  score: number;
}

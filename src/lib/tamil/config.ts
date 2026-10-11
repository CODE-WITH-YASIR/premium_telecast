export const TAMIL_CONFIG = {
  SOURCE_URL:
    process.env.TAMIL_IPTV_SOURCE_URL || "https://iptv-org.github.io/iptv/languages/tam.m3u",
  SYNC_INTERVAL_HOURS: Number(process.env.TAMIL_PLAYLIST_SYNC_INTERVAL_HOURS || "3"),
  CONCURRENCY: Number(process.env.HEALTH_CHECK_CONCURRENCY || "5"),
  CONNECT_TIMEOUT_MS: Number(process.env.TAMIL_CONNECT_TIMEOUT_MS || "5000"),
  READ_TIMEOUT_MS: Number(process.env.TAMIL_READ_TIMEOUT_MS || "10000"),
  MAX_PROBE_BYTES: 256 * 1024, // 256KB max segment probe
  
  // Stability consecutive check thresholds
  THRESHOLDS: {
    CONSECUTIVE_SUCCESS_PROBATION: 1,
    CONSECUTIVE_SUCCESS_CANDIDATE: 2,
    CONSECUTIVE_SUCCESS_ONLINE: 3,
    CONSECUTIVE_FAIL_TEMP: 1,
    CONSECUTIVE_FAIL_DEGRADED: 2,
    CONSECUTIVE_FAIL_OFFLINE: 3,
    CONSECUTIVE_FAIL_DISABLE: 5,
  },

  // Scoring algorithm weights (Sum = 1.00)
  WEIGHTS: {
    AVAILABILITY: 0.30,
    RECENT_SUCCESS: 0.20,
    STARTUP_LATENCY: 0.15,
    STREAM_STABILITY: 0.15,
    QUALITY_RESOLUTION: 0.10,
    RECENCY_CHECK: 0.10,
  },

  // Cache configuration
  PUBLIC_CACHE_TTL_MS: 10 * 60 * 1000, // 10 minutes
  ADMIN_ACTION_COOLDOWN_MS: 30 * 1000, // 30s cooldown for manual full sync
};

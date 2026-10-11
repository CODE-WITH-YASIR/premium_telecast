import { TAMIL_CONFIG } from "./config";
import type { TamilChannel, TamilStream } from "./types";

/**
 * Calculates a composite health & quality score (0 - 100) for a Tamil stream.
 * Weights:
 * - 30% Availability
 * - 20% Recent Success Rate
 * - 15% Latency / Startup Time
 * - 15% Stability / Consecutive Track Record
 * - 10% Resolution / Bitrate Quality
 * - 10% Recency of Check
 */
export function calculateStreamScore(stream: Partial<TamilStream>): number {
  const { WEIGHTS } = TAMIL_CONFIG;

  // 1. Availability (30%)
  let availabilityScore = 0;
  if (stream.health_status === "ONLINE") availabilityScore = 100;
  else if (stream.health_status === "VERIFIED_CANDIDATE") availabilityScore = 80;
  else if (stream.health_status === "PROBATION") availabilityScore = 60;
  else if (stream.health_status === "DEGRADED") availabilityScore = 35;
  else availabilityScore = 0;

  // 2. Recent Success Rate (20%)
  const consecutiveSuccesses = stream.consecutive_successes || 0;
  const consecutiveFailures = stream.consecutive_failures || 0;
  let successRateScore = 0;
  if (consecutiveSuccesses > 0) {
    successRateScore = Math.min(100, consecutiveSuccesses * 35);
  } else if (consecutiveFailures > 0) {
    successRateScore = Math.max(0, 100 - consecutiveFailures * 30);
  }

  // 3. Latency (15%)
  const latency = stream.latency_ms ?? 1500;
  let latencyScore = 0;
  if (latency <= 300) latencyScore = 100;
  else if (latency <= 600) latencyScore = 85;
  else if (latency <= 1200) latencyScore = 70;
  else if (latency <= 2500) latencyScore = 50;
  else if (latency <= 5000) latencyScore = 25;
  else latencyScore = 10;

  // 4. Stability (15%)
  const stabilityScore = Math.min(100, consecutiveSuccesses * 25);

  // 5. Resolution / Quality (10%)
  const res = (stream.resolution || "").toLowerCase();
  let qualityScore = 70; // baseline
  if (res.includes("2160") || res.includes("4k")) qualityScore = 100;
  else if (res.includes("1080")) qualityScore = 95;
  else if (res.includes("720")) qualityScore = 85;
  else if (res.includes("576")) qualityScore = 75;
  else if (res.includes("480")) qualityScore = 65;
  else if (res.includes("396") || res.includes("360")) qualityScore = 50;

  // 6. Recency of check (10%)
  const lastChecked = stream.last_checked_at || 0;
  const ageMs = Date.now() - lastChecked;
  let recencyScore = 0;
  if (ageMs <= 15 * 60 * 1000) recencyScore = 100; // < 15 mins
  else if (ageMs <= 60 * 60 * 1000) recencyScore = 85; // < 1 hr
  else if (ageMs <= 4 * 3600 * 1000) recencyScore = 65; // < 4 hrs
  else if (ageMs <= 24 * 3600 * 1000) recencyScore = 40; // < 24 hrs
  else recencyScore = 20;

  const totalScore =
    availabilityScore * WEIGHTS.AVAILABILITY +
    successRateScore * WEIGHTS.RECENT_SUCCESS +
    latencyScore * WEIGHTS.STARTUP_LATENCY +
    stabilityScore * WEIGHTS.STREAM_STABILITY +
    qualityScore * WEIGHTS.QUALITY_RESOLUTION +
    recencyScore * WEIGHTS.RECENCY_CHECK;

  return Math.round(Math.max(0, Math.min(100, totalScore)));
}

/**
 * Ranks streams for a channel and selects the best primary stream.
 * Automatically sets failover order (Primary, Backup 1, Backup 2...).
 */
export function rankChannelStreams(streams: TamilStream[]): {
  rankedStreams: TamilStream[];
  primaryStream: TamilStream | null;
  channelHealthScore: number;
} {
  if (!streams || streams.length === 0) {
    return { rankedStreams: [], primaryStream: null, channelHealthScore: 0 };
  }

  // Sort streams:
  // 1. ONLINE > VERIFIED_CANDIDATE > PROBATION > DEGRADED > OFFLINE
  // 2. Health Score descending
  // 3. Lower latency
  const statusRank: Record<string, number> = {
    ONLINE: 5,
    VERIFIED_CANDIDATE: 4,
    PROBATION: 3,
    DEGRADED: 2,
    UNKNOWN: 1,
    OFFLINE: 0,
  };

  const ranked = [...streams].sort((a, b) => {
    const rankA = statusRank[a.health_status] ?? 0;
    const rankB = statusRank[b.health_status] ?? 0;
    if (rankB !== rankA) return rankB - rankA;

    if (b.health_score !== a.health_score) return b.health_score - a.health_score;

    const latA = a.latency_ms ?? 9999;
    const latB = b.latency_ms ?? 9999;
    return latA - latB;
  });

  const primary = ranked[0] || null;
  const channelHealthScore = primary ? primary.health_score : 0;

  return {
    rankedStreams: ranked,
    primaryStream: primary,
    channelHealthScore,
  };
}

/**
 * Determines whether a channel is verified for public viewing according to health policy.
 */
export function isChannelPubliclyPlayable(channel: TamilChannel, streams: TamilStream[]): boolean {
  if (!channel.active) return false;

  // The channel must have at least ONE stream that is ONLINE or VERIFIED_CANDIDATE or PROBATION with score > 40
  const hasPlayableStream = streams.some(
    (s) =>
      s.active &&
      (s.health_status === "ONLINE" ||
        s.health_status === "VERIFIED_CANDIDATE" ||
        (s.health_status === "PROBATION" && s.health_score >= 50))
  );

  return hasPlayableStream;
}

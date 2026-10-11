import fs from "node:fs";
import path from "node:path";
import { isChannelPubliclyPlayable, rankChannelStreams } from "./scorer";
import type {
  HealthCheckRecord,
  HealthProbeResult,
  TamilChannel,
  TamilStream,
  TamilSyncStats,
} from "./types";

interface StorageData {
  version: number;
  channels: TamilChannel[];
  streams: TamilStream[];
  healthChecks: HealthCheckRecord[];
  stats: TamilSyncStats;
  lastPersistedAt: number;
}

const DEFAULT_STATS: TamilSyncStats = {
  total_source_channels: 0,
  unique_channels: 0,
  duplicate_channels: 0,
  verified_channels: 0,
  degraded_channels: 0,
  offline_channels: 0,
  skipped_channels: 0,
  total_streams: 0,
  verified_streams: 0,
  last_sync_at: null,
  last_health_scan_at: null,
  sync_duration_ms: 0,
  health_scan_duration_ms: 0,
  average_latency_ms: 0,
  p95_latency_ms: 0,
  availability_rate: 0,
  is_syncing: false,
  is_scanning: false,
  last_sync_status: "idle",
  last_sync_error: null,
};

// Global singleton in memory
const globalForTamilStore = globalThis as unknown as {
  __tamilStorageData?: StorageData;
};

function getStorageFilePath(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // Ignore if cannot create
    }
  }
  return path.join(dataDir, "tamil-health-store.json");
}

function readFromDisk(): StorageData | null {
  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as StorageData;
      if (parsed && Array.isArray(parsed.channels)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[Tamil Store] Could not read disk store:", err);
  }
  return null;
}

function loadInitialData(): StorageData {
  const diskData = readFromDisk();
  if (diskData) {
    globalForTamilStore.__tamilStorageData = diskData;
    return diskData;
  }

  if (globalForTamilStore.__tamilStorageData) {
    return globalForTamilStore.__tamilStorageData;
  }

  const initial: StorageData = {
    version: 1,
    channels: [],
    streams: [],
    healthChecks: [],
    stats: { ...DEFAULT_STATS },
    lastPersistedAt: Date.now(),
  };

  globalForTamilStore.__tamilStorageData = initial;
  return initial;
}

function persistData(data: StorageData): void {
  const filePath = getStorageFilePath();
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  try {
    data.lastPersistedAt = Date.now();
    const payload = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempPath, payload, "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    // If running in environment without filesystem write access, memory store continues safely
    console.warn("[Tamil Store] Notice: File persistence fallback (using memory store):", err);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch {
      // ignore
    }
  }
}

export class TamilHealthStore {
  private data: StorageData;

  constructor() {
    this.data = loadInitialData();
    this.recomputeStats();
  }

  reloadFromDisk(): void {
    const diskData = readFromDisk();
    if (diskData) {
      this.data = diskData;
      globalForTamilStore.__tamilStorageData = diskData;
      this.recomputeStats();
    }
  }

  /**
   * Retrieves all channels, optionally filtered for verified playable streams only.
   */
  getAllChannels(verifiedOnly = false): TamilChannel[] {
    const streamsByChannel = this.getStreamsMap();

    const result = this.data.channels
      .map((ch) => {
        const streams = streamsByChannel.get(ch.id) || [];
        const { rankedStreams, primaryStream, channelHealthScore } = rankChannelStreams(streams);
        const isPlayable = isChannelPubliclyPlayable(ch, rankedStreams);

        return {
          ...ch,
          verified: isPlayable,
          health_score: channelHealthScore,
          primary_stream_id: primaryStream?.id,
          source_url: primaryStream?.stream_url || ch.source_url,
          streams: rankedStreams,
        };
      })
      .filter((ch) => (verifiedOnly ? ch.active && ch.verified : true));

    // Sort verified channels by health score descending, then name
    return result.sort((a, b) => {
      if (b.health_score !== a.health_score) return b.health_score - a.health_score;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  getChannelById(id: string): TamilChannel | null {
    const channel = this.data.channels.find((c) => c.id === id);
    if (!channel) return null;

    const streams = this.getStreamsForChannel(id);
    const { rankedStreams, primaryStream, channelHealthScore } = rankChannelStreams(streams);
    const isPlayable = isChannelPubliclyPlayable(channel, rankedStreams);

    return {
      ...channel,
      verified: isPlayable,
      health_score: channelHealthScore,
      primary_stream_id: primaryStream?.id,
      source_url: primaryStream?.stream_url || channel.source_url,
      streams: rankedStreams,
    };
  }

  getStreamsForChannel(channelId: string): TamilStream[] {
    return this.data.streams.filter((s) => s.channel_id === channelId);
  }

  getStreamById(streamId: string): TamilStream | null {
    return this.data.streams.find((s) => s.id === streamId) || null;
  }

  getAllStreams(): TamilStream[] {
    return [...this.data.streams];
  }

  getHealthChecks(streamId?: string, limit = 50): HealthCheckRecord[] {
    let checks = this.data.healthChecks;
    if (streamId) {
      checks = checks.filter((c) => c.stream_id === streamId);
    }
    return checks.slice(-limit).reverse();
  }

  getSyncStats(): TamilSyncStats {
    this.recomputeStats();
    return { ...this.data.stats };
  }

  setSyncing(isSyncing: boolean): void {
    this.data.stats.is_syncing = isSyncing;
  }

  setScanning(isScanning: boolean): void {
    this.data.stats.is_scanning = isScanning;
  }

  recordSyncError(error: string): void {
    this.data.stats.is_syncing = false;
    this.data.stats.last_sync_status = "failed";
    this.data.stats.last_sync_error = error;
    persistData(this.data);
  }

  /**
   * Transactionally saves freshly synced channels and streams while preserving
   * historical health stats and previous verified working streams.
   */
  saveSyncedChannelsAndStreams(
    channels: TamilChannel[],
    streams: TamilStream[],
    skippedCount: number,
    duplicateCount: number,
    durationMs: number
  ): void {
    const existingChannelMap = new Map(this.data.channels.map((c) => [c.id, c]));
    const existingStreamMap = new Map(this.data.streams.map((s) => [s.id, s]));

    // Merge channels preserving historical stats
    const mergedChannels: TamilChannel[] = channels.map((newCh) => {
      const prev = existingChannelMap.get(newCh.id);
      if (prev) {
        return {
          ...newCh,
          created_at: prev.created_at,
          updated_at: Date.now(),
          health_status: prev.health_status,
          health_score: prev.health_score,
          verified: prev.verified,
          last_checked_at: prev.last_checked_at,
          last_success_at: prev.last_success_at,
          consecutive_failures: prev.consecutive_failures,
          consecutive_successes: prev.consecutive_successes,
          latency_ms: prev.latency_ms,
          resolution: newCh.resolution || prev.resolution,
          failure_reason: prev.failure_reason,
        };
      }
      return newCh;
    });

    // Merge streams preserving probe data
    const mergedStreams: TamilStream[] = streams.map((newSt) => {
      const prev = existingStreamMap.get(newSt.id);
      if (prev) {
        return {
          ...newSt,
          created_at: prev.created_at,
          updated_at: Date.now(),
          health_status: prev.health_status,
          health_score: prev.health_score,
          last_checked_at: prev.last_checked_at,
          last_success_at: prev.last_success_at,
          consecutive_failures: prev.consecutive_failures,
          consecutive_successes: prev.consecutive_successes,
          latency_ms: prev.latency_ms,
          http_status: prev.http_status,
          content_type: prev.content_type,
          failure_reason: prev.failure_reason,
          resolution: newSt.resolution || prev.resolution,
        };
      }
      return newSt;
    });

    this.data.channels = mergedChannels;
    this.data.streams = mergedStreams;

    // Update sync stats
    this.data.stats.total_source_channels = channels.length + duplicateCount + skippedCount;
    this.data.stats.unique_channels = channels.length;
    this.data.stats.duplicate_channels = duplicateCount;
    this.data.stats.skipped_channels = skippedCount;
    this.data.stats.total_streams = streams.length;
    this.data.stats.last_sync_at = Date.now();
    this.data.stats.sync_duration_ms = durationMs;
    this.data.stats.last_sync_status = "success";
    this.data.stats.last_sync_error = null;
    this.data.stats.is_syncing = false;

    this.recomputeStats();
    persistData(this.data);
  }

  /**
   * Updates health probe result for a single stream and its parent channel.
   */
  updateStreamHealth(result: HealthProbeResult): void {
    const stream = this.data.streams.find((s) => s.id === result.streamId);
    if (!stream) return;

    const now = Date.now();
    const isSuccess = result.status === "ONLINE" || result.status === "VERIFIED_CANDIDATE";

    stream.health_status = result.status;
    stream.health_score = result.score;
    stream.last_checked_at = now;
    if (isSuccess) stream.last_success_at = now;
    stream.consecutive_successes = isSuccess ? stream.consecutive_successes + 1 : 0;
    stream.consecutive_failures = isSuccess ? 0 : stream.consecutive_failures + 1;
    stream.latency_ms = result.latencyMs;
    stream.http_status = result.httpStatus;
    stream.failure_reason = result.failureReason;
    if (result.resolution) stream.resolution = result.resolution;
    if (result.bitrate) stream.bitrate = result.bitrate;
    stream.updated_at = now;

    // Record health check history (keep last 500 checks)
    const checkRecord: HealthCheckRecord = {
      id: `chk_${now}_${Math.random().toString(36).substring(2, 7)}`,
      stream_id: stream.id,
      channel_id: stream.channel_id,
      checked_at: now,
      status: result.status,
      http_status: result.httpStatus,
      latency_ms: result.latencyMs,
      startup_time_ms: result.startupTimeMs,
      manifest_valid: result.manifestValid,
      segment_available: result.segmentAvailable,
      content_detected: result.contentDetected,
      error_code: result.failureReason,
      error_message: result.errorMessage,
    };

    this.data.healthChecks.push(checkRecord);
    if (this.data.healthChecks.length > 500) {
      this.data.healthChecks = this.data.healthChecks.slice(-500);
    }

    // Update parent channel status
    const channel = this.data.channels.find((c) => c.id === stream.channel_id);
    if (channel) {
      const channelStreams = this.getStreamsForChannel(channel.id);
      const { rankedStreams, primaryStream, channelHealthScore } = rankChannelStreams(channelStreams);
      const isPlayable = isChannelPubliclyPlayable(channel, rankedStreams);

      channel.verified = isPlayable;
      channel.health_score = channelHealthScore;
      channel.health_status = primaryStream?.health_status || result.status;
      channel.last_checked_at = now;
      if (isSuccess) channel.last_success_at = now;
      channel.latency_ms = primaryStream?.latency_ms || result.latencyMs;
      channel.primary_stream_id = primaryStream?.id;
      channel.failure_reason = isPlayable ? null : result.failureReason;
      channel.updated_at = now;
    }

    this.recomputeStats();
    persistData(this.data);
  }

  toggleChannelActive(id: string, active: boolean): boolean {
    const channel = this.data.channels.find((c) => c.id === id);
    if (!channel) return false;
    channel.active = active;
    channel.updated_at = Date.now();
    this.recomputeStats();
    persistData(this.data);
    return true;
  }

  toggleStreamActive(id: string, active: boolean): boolean {
    const stream = this.data.streams.find((s) => s.id === id);
    if (!stream) return false;
    stream.active = active;
    stream.updated_at = Date.now();
    this.recomputeStats();
    persistData(this.data);
    return true;
  }

  private getStreamsMap(): Map<string, TamilStream[]> {
    const map = new Map<string, TamilStream[]>();
    for (const stream of this.data.streams) {
      const list = map.get(stream.channel_id) || [];
      list.push(stream);
      map.set(stream.channel_id, list);
    }
    return map;
  }

  private recomputeStats(): void {
    const channels = this.data.channels;
    const streams = this.data.streams;

    let verifiedCount = 0;
    let degradedCount = 0;
    let offlineCount = 0;
    let verifiedStreamsCount = 0;

    const latencies: number[] = [];

    const streamsMap = this.getStreamsMap();

    for (const ch of channels) {
      const chStreams = streamsMap.get(ch.id) || [];
      const isPlayable = isChannelPubliclyPlayable(ch, chStreams);

      if (isPlayable) {
        verifiedCount++;
      } else if (ch.health_status === "DEGRADED") {
        degradedCount++;
      } else {
        offlineCount++;
      }

      if (ch.latency_ms && ch.latency_ms > 0) {
        latencies.push(ch.latency_ms);
      }
    }

    for (const st of streams) {
      if (st.health_status === "ONLINE" || st.health_status === "VERIFIED_CANDIDATE") {
        verifiedStreamsCount++;
      }
    }

    latencies.sort((a, b) => a - b);
    const avgLatency =
      latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const p95Idx = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies.length > 0 ? latencies[p95Idx] ?? 0 : 0;

    const totalActive = channels.length;
    const availabilityRate =
      totalActive > 0 ? Math.round((verifiedCount / totalActive) * 1000) / 10 : 0;

    this.data.stats.verified_channels = verifiedCount;
    this.data.stats.degraded_channels = degradedCount;
    this.data.stats.offline_channels = offlineCount;
    this.data.stats.verified_streams = verifiedStreamsCount;
    this.data.stats.average_latency_ms = avgLatency;
    this.data.stats.p95_latency_ms = p95Latency;
    this.data.stats.availability_rate = availabilityRate;
  }
}

export const tamilStore = new TamilHealthStore();

import { TAMIL_CONFIG } from "./config";
import { parseTamilM3U } from "./parser";
import {
  generateTamilChannelId,
  generateTamilStreamId,
  mapCategory,
  normalizeChannelName,
  normalizeStreamUrl,
} from "./normalizer";
import { probeStreamHealth } from "./checker";
import { calculateStreamScore } from "./scorer";
import { tamilStore } from "./store";
import type {
  HealthProbeResult,
  ParsedM3UEntry,
  TamilChannel,
  TamilStream,
  TamilSyncStats,
} from "./types";

let inFlightSync: Promise<TamilSyncStats> | null = null;
let inFlightScan: Promise<TamilSyncStats> | null = null;
let backgroundTimer: NodeJS.Timeout | null = null;
let lastSyncTriggerTime = 0;

/**
 * Worker pool helper for bounded concurrency execution.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIdx = index++;
      const item = items[currentIdx];
      if (item !== undefined) {
        try {
          const res = await fn(item);
          results[currentIdx] = res;
        } catch {
          // Worker handles error inside fn
        }
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export class TamilHealthEngine {
  /**
   * Main synchronization pipeline:
   * 1. Downloads upstream source M3U
   * 2. Parses and normalizes
   * 3. Deduplicates and groups into channels + streams
   * 4. Transactionally merges with store
   * 5. Spawns bounded health check scan
   */
  static async syncPlaylist(options: { forceScan?: boolean } = {}): Promise<TamilSyncStats> {
    if (inFlightSync) {
      return inFlightSync;
    }

    const now = Date.now();
    if (now - lastSyncTriggerTime < TAMIL_CONFIG.ADMIN_ACTION_COOLDOWN_MS && !options.forceScan) {
      return tamilStore.getSyncStats();
    }
    lastSyncTriggerTime = now;

    inFlightSync = (async () => {
      const syncStartTime = Date.now();
      tamilStore.setSyncing(true);

      console.log(`[TAMIL_SYNC] Starting sync from source: ${TAMIL_CONFIG.SOURCE_URL}`);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(TAMIL_CONFIG.SOURCE_URL, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "*/*",
          },
          cache: "no-store",
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Upstream source returned HTTP ${res.status} ${res.statusText}`);
        }

        const m3uText = await res.text();
        const { entries, skippedCount } = parseTamilM3U(m3uText);

        console.log(`[TAMIL_SYNC] Source fetch success. Parsed ${entries.length} raw entries.`);

        // Ingestion & Grouping
        const channelMap = new Map<string, TamilChannel>();
        const streamList: TamilStream[] = [];
        let duplicateCount = 0;

        const seenStreamUrls = new Set<string>();

        for (const entry of entries) {
          const normalizedUrl = normalizeStreamUrl(entry.streamUrl);
          const urlKey = normalizedUrl.toLowerCase();

          if (seenStreamUrls.has(urlKey)) {
            duplicateCount++;
            continue;
          }
          seenStreamUrls.add(urlKey);

          const channelId = generateTamilChannelId(entry);
          const streamId = generateTamilStreamId(channelId, normalizedUrl);
          const normalizedName = normalizeChannelName(entry.cleanName || entry.rawName);
          const category = mapCategory(entry.groupTitle, entry.cleanName);

          // Build or get existing channel
          let channel = channelMap.get(channelId);
          if (!channel) {
            channel = {
              id: channelId,
              source_channel_id: entry.tvgId || channelId,
              tvg_id: entry.tvgId || null,
              name: entry.cleanName || entry.rawName,
              normalized_name: normalizedName,
              logo_url: entry.tvgLogo || null,
              group_title: entry.groupTitle || null,
              language: "Tamil",
              country: entry.country || "IN",
              category,
              source_url: normalizedUrl,
              active: true,
              verified: false,
              health_status: "UNKNOWN",
              health_score: 0,
              last_checked_at: null,
              last_success_at: null,
              consecutive_failures: 0,
              consecutive_successes: 0,
              latency_ms: null,
              stream_type: normalizedUrl.includes(".m3u8") ? "hls" : "unknown",
              resolution: entry.resolution || null,
              bitrate: null,
              failure_reason: null,
              created_at: now,
              updated_at: now,
            };
            channelMap.set(channelId, channel);
          } else {
            // Already have a stream for this channel -> duplicate channel entry merged!
            duplicateCount++;
            if (!channel.logo_url && entry.tvgLogo) {
              channel.logo_url = entry.tvgLogo;
            }
          }

          const stream: TamilStream = {
            id: streamId,
            channel_id: channelId,
            stream_url: normalizedUrl,
            source: entry.tvgName || channel.name,
            protocol: normalizedUrl.startsWith("https") ? "https" : "http",
            active: true,
            health_status: "UNKNOWN",
            health_score: 0,
            last_checked_at: null,
            last_success_at: null,
            consecutive_failures: 0,
            consecutive_successes: 0,
            latency_ms: null,
            http_status: null,
            content_type: null,
            failure_reason: null,
            resolution: entry.resolution || null,
            bitrate: null,
            created_at: now,
            updated_at: now,
          };

          streamList.push(stream);
        }

        const channelList = Array.from(channelMap.values());
        const syncDurationMs = Date.now() - syncStartTime;

        tamilStore.saveSyncedChannelsAndStreams(
          channelList,
          streamList,
          skippedCount,
          duplicateCount,
          syncDurationMs
        );

        console.log(
          `[TAMIL_SYNC] Successfully ingested ${channelList.length} unique channels and ${streamList.length} streams.`
        );

        // Run Health Check Scan on all imported streams
        void TamilHealthEngine.runHealthScan();

        return tamilStore.getSyncStats();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Sync failed";
        console.error(`[TAMIL_SYNC] Error during synchronization: ${errorMsg}`);
        tamilStore.recordSyncError(errorMsg);
        return tamilStore.getSyncStats();
      } finally {
        inFlightSync = null;
      }
    })();

    return inFlightSync;
  }

  /**
   * Health Scan Engine:
   * Uses bounded worker pool to probe streams concurrently.
   */
  static async runHealthScan(options?: {
    streamId?: string;
    channelId?: string;
  }): Promise<TamilSyncStats> {
    if (inFlightScan) {
      return inFlightScan;
    }

    inFlightScan = (async () => {
      const scanStartTime = Date.now();
      tamilStore.setScanning(true);

      console.log(`[TAMIL_HEALTH] Starting stream health scan (Concurrency: ${TAMIL_CONFIG.CONCURRENCY})`);

      try {
        let streams = tamilStore.getAllStreams();

        if (options?.streamId) {
          streams = streams.filter((s) => s.id === options.streamId);
        } else if (options?.channelId) {
          streams = streams.filter((s) => s.channel_id === options.channelId);
        }

        const probeResults = await runWithConcurrency(
          streams,
          TAMIL_CONFIG.CONCURRENCY,
          async (stream) => {
            const probe = await probeStreamHealth(stream.id, stream.stream_url);

            // Compute composite health score
            const score = calculateStreamScore({
              health_status: probe.status,
              consecutive_successes: probe.status === "ONLINE" ? stream.consecutive_successes + 1 : 0,
              consecutive_failures: probe.status !== "ONLINE" ? stream.consecutive_failures + 1 : 0,
              latency_ms: probe.latencyMs,
              resolution: probe.resolution || stream.resolution,
              last_checked_at: Date.now(),
            });

            const enrichedResult: HealthProbeResult = {
              ...probe,
              score,
            };

            tamilStore.updateStreamHealth(enrichedResult);

            if (probe.status === "ONLINE" || probe.status === "VERIFIED_CANDIDATE") {
              console.log(
                `[TAMIL_HEALTH] channel_stream="${stream.id}" status=${probe.status} latency=${probe.latencyMs}ms score=${score}`
              );
            } else {
              console.log(
                `[TAMIL_HEALTH] channel_stream="${stream.id}" status=${probe.status} reason="${probe.failureReason}" error="${probe.errorMessage}"`
              );
            }

            return enrichedResult;
          }
        );

        const durationMs = Date.now() - scanStartTime;
        console.log(
          `[TAMIL_HEALTH] Health scan completed for ${probeResults.length} streams in ${durationMs}ms.`
        );

        return tamilStore.getSyncStats();
      } catch (err: unknown) {
        console.error("[TAMIL_HEALTH] Health scan error:", err);
        return tamilStore.getSyncStats();
      } finally {
        tamilStore.setScanning(false);
        inFlightScan = null;
      }
    })();

    return inFlightScan;
  }

  /**
   * Initializes background periodic sync worker.
   */
  static startBackgroundScheduler(): void {
    if (backgroundTimer) return;

    const intervalMs = TAMIL_CONFIG.SYNC_INTERVAL_HOURS * 60 * 60 * 1000;
    console.log(
      `[TAMIL_SYNC] Scheduler initialized. Interval: every ${TAMIL_CONFIG.SYNC_INTERVAL_HOURS} hours.`
    );

    // Initial sync if store is empty
    const currentStats = tamilStore.getSyncStats();
    if (currentStats.unique_channels === 0) {
      void TamilHealthEngine.syncPlaylist();
    }

    backgroundTimer = setInterval(() => {
      console.log("[TAMIL_SYNC] Background scheduled sync triggered.");
      void TamilHealthEngine.syncPlaylist();
    }, intervalMs);
  }

  static stopBackgroundScheduler(): void {
    if (backgroundTimer) {
      clearInterval(backgroundTimer);
      backgroundTimer = null;
    }
  }
}

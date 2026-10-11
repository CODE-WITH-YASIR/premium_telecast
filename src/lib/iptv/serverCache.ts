import "server-only";
import { fetchAllChannels } from "./service";
import { CACHE_TTL_MS } from "./config";
import type { FetchChannelsResult } from "./types";

/**
 * Server-side playlist cache: the actual IPTV playlist is fetched from the
 * upstream provider AT MOST once per CACHE_TTL_MS, by this process, no
 * matter how many concurrent clients hit /api/channels. This is the crux of
 * the "1000 clients, not 1000 playlist downloads" requirement — without it,
 * every browser would fetch the M3U directly from the IPTV provider.
 *
 * Scope note: this is a module-level in-memory cache, so it is per-process.
 * On a single long-running Node.js server this is exactly what's wanted. On
 * a multi-instance or serverless/edge deployment, each instance keeps its
 * own copy — still a large reduction vs. per-client fetching, but not a
 * single shared cache. If you deploy with multiple instances behind a load
 * balancer, replace this module's storage with Redis (or similar) using the
 * same get/refresh shape; nothing above this module needs to change.
 */

let cachedResult: FetchChannelsResult | null = null;
let cachedAt = 0;
let inFlight: Promise<FetchChannelsResult> | null = null;

async function fetchFresh(): Promise<FetchChannelsResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const result = await fetchAllChannels(controller.signal);

    if (result.totalFailure && cachedResult) {
      // Upstream is down but we have prior good data — keep serving it
      // rather than propagating the outage to every client. Refresh the
      // timestamp minimally so we don't hammer a downed provider every
      // request, but don't overwrite good channels with an empty result.
      cachedAt = Date.now();
      return cachedResult;
    }

    if (!result.totalFailure) {
      cachedResult = result;
      cachedAt = Date.now();
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Returns the current cached playlist, refreshing it if stale. Concurrent
 * callers during a refresh share the same in-flight request instead of each
 * triggering their own upstream fetch (request deduplication).
 */
export async function getCachedChannels(options: { force?: boolean } = {}): Promise<FetchChannelsResult> {
  const isFresh = cachedResult !== null && Date.now() - cachedAt < CACHE_TTL_MS;
  if (isFresh && !options.force) {
    return cachedResult as FetchChannelsResult;
  }

  if (inFlight) return inFlight;

  inFlight = fetchFresh().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** For the health check — reports cache state without triggering a fetch. */
export function getCacheStatus() {
  return {
    hasData: cachedResult !== null,
    channelCount: cachedResult?.channels.length ?? 0,
    lastFetchedAt: cachedResult?.fetchedAt ?? null,
    ageMs: cachedResult ? Date.now() - cachedAt : null,
  };
}

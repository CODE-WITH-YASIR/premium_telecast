import { PLAYLIST_SOURCES, FETCH_TIMEOUT_MS } from "./config";
import { parseM3U } from "./parser";
import type { Channel, FetchChannelsResult, SourceResult } from "./types";

/** Fetches and parses a single playlist source. Never throws — failures are captured in the result. */
async function fetchSource(
  source: (typeof PLAYLIST_SOURCES)[number],
  signal: AbortSignal
): Promise<SourceResult> {
  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  signal.addEventListener("abort", onParentAbort);

  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      // Playlists are static files; let the browser/CDN cache do its job,
      // our own service-level cache layer (cache.ts) handles app-level TTL.
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        sourceId: source.id,
        channels: [],
        skippedEntries: 0,
        error: `HTTP ${res.status} ${res.statusText}`,
      };
    }

    const text = await res.text();
    const { channels, skippedEntries } = parseM3U(text, source.id);

    return { sourceId: source.id, channels, skippedEntries, error: null };
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === "AbortError"
        ? "Request timed out"
        : err instanceof Error
          ? err.message
          : "Unknown network error";
    return { sourceId: source.id, channels: [], skippedEntries: 0, error: message };
  } finally {
    clearTimeout(timeoutId);
    signal.removeEventListener("abort", onParentAbort);
  }
}

/**
 * Fetches every configured playlist source in parallel and merges the results.
 *
 * Isolation guarantee: if source A fails or times out, channels successfully
 * parsed from source B/C/... are still returned. The caller can inspect
 * `sourceResults` to surface which sources failed without losing the
 * channels that did load.
 */
export async function fetchAllChannels(signal: AbortSignal): Promise<FetchChannelsResult> {
  const sourceResults = await Promise.all(
    PLAYLIST_SOURCES.map((source) => fetchSource(source, signal))
  );

  // Merge + cross-source dedupe by stream URL, preserving first-seen order
  // (source order in config, then playlist order within a source).
  const seen = new Set<string>();
  const channels: Channel[] = [];
  for (const result of sourceResults) {
    for (const channel of result.channels) {
      const key = channel.streamUrl.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      channels.push(channel);
    }
  }

  // Stable sort by name for deterministic, predictable ordering across refreshes.
  channels.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const totalFailure = sourceResults.length > 0 && sourceResults.every((r) => r.error !== null);

  return {
    channels,
    sourceResults,
    fetchedAt: Date.now(),
    totalFailure,
  };
}

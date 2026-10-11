import type { PlaylistSource } from "./types";

/**
 * Configured M3U/M3U8 playlist sources.
 *
 * Defaults to the public iptv-org index playlist (real, publicly listed
 * channels — https://github.com/iptv-org/iptv). Override with the
 * IPTV_PLAYLIST_SOURCES env var: a comma-separated list of "id:label:url"
 * triplets, e.g.
 *
 *   IPTV_PLAYLIST_SOURCES="in:India:https://iptv-org.github.io/iptv/countries/in.m3u,us:United States:https://iptv-org.github.io/iptv/countries/us.m3u"
 *
 * This is intentionally server-only (no NEXT_PUBLIC_ prefix): the playlist is
 * fetched once, server-side, and cached — see lib/iptv/serverCache.ts — and
 * served to clients via /api/channels rather than every browser fetching the
 * raw M3U source directly. Multiple sources are fetched independently and
 * merged — one source failing or timing out never drops channels
 * successfully loaded from another.
 */
function parseSourcesFromEnv(raw: string | undefined): PlaylistSource[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, label, ...urlParts] = entry.split(":");
      const url = urlParts.join(":"); // rejoin in case the URL itself contains ':'
      return { id: id ?? "", label: label ?? id ?? "", url };
    })
    .filter((s) => s.id && s.url);
}

const DEFAULT_SOURCES: PlaylistSource[] = [
  {
    id: "iptv-org-index",
    label: "IPTV-Org — All Channels",
    url: "https://iptv-org.github.io/iptv/index.m3u",
  },
];

const envSources = parseSourcesFromEnv(process.env.IPTV_PLAYLIST_SOURCES);
export const PLAYLIST_SOURCES: PlaylistSource[] = envSources.length > 0 ? envSources : DEFAULT_SOURCES;

/**
 * Optional EPG (XMLTV) source. Left unset by default — see lib/epg.
 * NEXT_PUBLIC_-prefixed deliberately: the guide page (a client component)
 * reads this directly to decide whether to render "guide unavailable" — it's
 * a UI-only presence check, not a secret, unlike PLAYLIST_SOURCES above.
 */
export const EPG_SOURCE_URL = process.env.NEXT_PUBLIC_EPG_URL || "";

export const FETCH_TIMEOUT_MS = 12_000;
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const AUTO_REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds
export const HISTORY_LIMIT = 50;

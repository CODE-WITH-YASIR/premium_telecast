import type { ParsedM3UEntry, TamilCategory } from "./types";

/**
 * Normalizes channel names for intelligent comparison and deduplication.
 * Strips whitespace, special punctuation, casing differences, and standard HD/SD/4K/FHD suffixes.
 */
export function normalizeChannelName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(hd|sd|fhd|uhd|4k|2k|hevc|h264|h265|1080p|720p|576p|480p|360p)\b/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9\u0B80-\u0BFF]/gi, "") // preserve alphanumeric and Tamil unicode block
    .trim();
}

/**
 * Normalizes stream URLs by stripping non-essential tracking queries where safe
 * while preserving mandatory tokens/paths.
 */
export function normalizeStreamUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    // Strip common transient/ad tracking params
    const safeParams = new URLSearchParams();
    for (const [k, v] of parsed.searchParams.entries()) {
      const lower = k.toLowerCase();
      if (!lower.startsWith("utm_") && lower !== "fbclid" && lower !== "gclid" && lower !== "_t") {
        safeParams.append(k, v);
      }
    }
    parsed.search = safeParams.toString() ? `?${safeParams.toString()}` : "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

/**
 * Maps raw group-title or category strings into standardized TamilCategory.
 */
export function mapCategory(groupTitle?: string, channelName?: string): TamilCategory {
  const combined = `${groupTitle || ""} ${channelName || ""}`.toLowerCase();

  if (combined.includes("news") || combined.includes("seithigal") || combined.includes("samachar")) {
    return "News";
  }
  if (combined.includes("music") || combined.includes("isai") || combined.includes("song") || combined.includes("dhool")) {
    return "Music";
  }
  if (
    combined.includes("religious") ||
    combined.includes("bakthi") ||
    combined.includes("devotional") ||
    combined.includes("prayer") ||
    combined.includes("gospel") ||
    combined.includes("jesus") ||
    combined.includes("hindu") ||
    combined.includes("christian") ||
    combined.includes("islam") ||
    combined.includes("god")
  ) {
    return "Religious";
  }
  if (combined.includes("kid") || combined.includes("chithiram") || combined.includes("hungama") || combined.includes("disney") || combined.includes("bal bharat") || combined.includes("cartoon")) {
    return "Kids";
  }
  if (combined.includes("sport") || combined.includes("cricket") || combined.includes("football") || combined.includes("dd sports")) {
    return "Sports";
  }
  if (combined.includes("movie") || combined.includes("cinema") || combined.includes("film") || combined.includes("murasu") || combined.includes("ktv")) {
    return "Movies";
  }
  if (combined.includes("culture") || combined.includes("documentary") || combined.includes("history")) {
    return "Culture";
  }
  if (combined.includes("general") || combined.includes("family")) {
    return "General";
  }
  if (combined.includes("entertainment") || combined.includes("tv") || combined.includes("tamil")) {
    return "Entertainment";
  }

  return "Other";
}

/**
 * Generates a stable, deterministic Channel ID.
 * Priority: Base tvg-id (without @quality suffix) -> Normalized Channel Name hash.
 */
export function generateTamilChannelId(entry: ParsedM3UEntry): string {
  if (entry.tvgId) {
    // e.g. "ColorsTamil.in@HD" -> "tamil_colorstamil_in"
    const baseTvg = entry.tvgId.split("@")[0] || entry.tvgId;
    const cleanTvg = baseTvg.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (cleanTvg.length > 2) {
      return `tam_${cleanTvg}`;
    }
  }

  const normalized = normalizeChannelName(entry.cleanName || entry.rawName);
  const hash = fnv1a(normalized || entry.streamUrl);
  return `tam_${(normalized.slice(0, 16) || "channel")}_${hash}`;
}

/**
 * Generates a stable Stream ID from channel ID + stream URL.
 */
export function generateTamilStreamId(channelId: string, streamUrl: string): string {
  const hash = fnv1a(streamUrl.toLowerCase());
  return `${channelId}_st_${hash}`;
}

function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

import { sanitizeMetadata } from "./ssrf";
import type { ParsedM3UEntry } from "./types";

/**
 * Robust, fault-tolerant M3U parser tailored for Tamil IPTV feeds.
 * Correctly parses Unicode (Tamil script, English), EXTINF metadata attributes,
 * resolution tags, and stream directives.
 */
export function parseTamilM3U(m3uContent: string): {
  entries: ParsedM3UEntry[];
  skippedCount: number;
} {
  if (!m3uContent || typeof m3uContent !== "string") {
    return { entries: [], skippedCount: 0 };
  }

  const lines = m3uContent.split(/\r?\n/);
  const entries: ParsedM3UEntry[] = [];
  let skippedCount = 0;

  let currentExtInf: string | null = null;
  let currentReferrer: string | undefined = undefined;
  let currentUserAgent: string | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]?.trim() || "";
    if (!rawLine) continue;

    if (rawLine.startsWith("#EXTM3U")) {
      continue;
    }

    if (rawLine.startsWith("#EXTINF:")) {
      currentExtInf = rawLine;
      currentReferrer = undefined;
      currentUserAgent = undefined;
      continue;
    }

    if (rawLine.startsWith("#EXTVLCOPT:") || rawLine.startsWith("#EXTHTTP:")) {
      if (rawLine.toLowerCase().includes("http-referrer=")) {
        const match = rawLine.match(/http-referrer=([^\s]+)/i);
        if (match && match[1]) currentReferrer = match[1];
      }
      if (rawLine.toLowerCase().includes("http-user-agent=")) {
        const match = rawLine.match(/http-user-agent=([^\s]+)/i);
        if (match && match[1]) currentUserAgent = match[1];
      }
      continue;
    }

    if (rawLine.startsWith("#")) {
      // Other directive or comment
      continue;
    }

    // This is a stream URL line
    const streamUrl = rawLine;
    if (currentExtInf && (streamUrl.startsWith("http://") || streamUrl.startsWith("https://"))) {
      const parsed = parseExtInfLine(currentExtInf, streamUrl, currentReferrer, currentUserAgent);
      if (parsed) {
        entries.push(parsed);
      } else {
        skippedCount++;
      }
    } else {
      skippedCount++;
    }

    currentExtInf = null;
    currentReferrer = undefined;
    currentUserAgent = undefined;
  }

  return { entries, skippedCount };
}

function parseExtInfLine(
  extInf: string,
  streamUrl: string,
  httpReferrer?: string,
  userAgent?: string
): ParsedM3UEntry | null {
  // Extract attributes: tvg-id="...", tvg-logo="...", group-title="...", etc.
  const tvgId = extractAttribute(extInf, "tvg-id");
  const tvgName = extractAttribute(extInf, "tvg-name");
  const tvgLogo = extractAttribute(extInf, "tvg-logo");
  const groupTitle = extractAttribute(extInf, "group-title");
  const country = extractAttribute(extInf, "tvg-country");
  const language = extractAttribute(extInf, "tvg-language") || "Tamil";
  const inlineReferrer = extractAttribute(extInf, "http-referrer");
  const inlineUserAgent = extractAttribute(extInf, "http-user-agent");

  // Extract raw channel name after comma
  const commaIdx = extInf.indexOf(",");
  const rawName = commaIdx !== -1 ? extInf.substring(commaIdx + 1).trim() : "Tamil Channel";

  if (!rawName) return null;

  // Detect resolution tags like (1080p), (720p), (576p), (480p), (396p), (576i), [HD], [SD]
  let resolution: string | undefined = undefined;
  const resMatch = rawName.match(/\((\d{3,4}[pi])\)/i) || rawName.match(/\[(\d{3,4}[pi])\]/i);
  if (resMatch && resMatch[1]) {
    resolution = resMatch[1].toLowerCase();
  } else if (/\bHD\b/i.test(rawName) || /@HD\b/i.test(tvgId || "")) {
    resolution = "720p";
  } else if (/\bSD\b/i.test(rawName) || /@SD\b/i.test(tvgId || "")) {
    resolution = "576p";
  } else if (/\b4K\b/i.test(rawName) || /\bUHD\b/i.test(rawName)) {
    resolution = "2160p";
  }

  const isGeoBlockedNote = /\[geo-blocked\]/i.test(rawName) || /\[geo-restricted\]/i.test(rawName);

  // Clean channel name by stripping technical badges like (1080p), [Geo-blocked], [Not 24/7]
  const cleanName = sanitizeMetadata(
    rawName
      .replace(/\(\d{3,4}[pi]\)/gi, "")
      .replace(/\[\d{3,4}[pi]\]/gi, "")
      .replace(/\[geo-blocked\]/gi, "")
      .replace(/\[geo-restricted\]/gi, "")
      .replace(/\[not 24\/7\]/gi, "")
      .replace(/\s+/g, " ")
      .trim()
  );

  return {
    rawName: sanitizeMetadata(rawName),
    cleanName: cleanName || sanitizeMetadata(rawName),
    streamUrl: streamUrl.trim(),
    tvgId: tvgId ? sanitizeMetadata(tvgId) : undefined,
    tvgName: tvgName ? sanitizeMetadata(tvgName) : undefined,
    tvgLogo: tvgLogo ? tvgLogo.trim() : undefined,
    groupTitle: groupTitle ? sanitizeMetadata(groupTitle) : undefined,
    country: country ? sanitizeMetadata(country) : undefined,
    language: language ? sanitizeMetadata(language) : "Tamil",
    httpReferrer: inlineReferrer || httpReferrer,
    userAgent: inlineUserAgent || userAgent,
    resolution,
    isGeoBlockedNote,
  };
}

function extractAttribute(line: string, attr: string): string | undefined {
  const regex = new RegExp(`${attr}="([^"]*)"`, "i");
  const match = line.match(regex);
  return match && match[1] !== undefined ? match[1] : undefined;
}

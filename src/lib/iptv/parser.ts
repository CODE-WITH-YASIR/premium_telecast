import { generateChannelId } from "./id";
import type { Channel } from "./types";

interface ParseResult {
  channels: Channel[];
  skippedEntries: number;
}

/** Extracts a quoted or unquoted attribute value from an #EXTINF line. */
function extractAttr(line: string, attr: string): string | undefined {
  const quoted = new RegExp(`${attr}="([^"]*)"`, "i").exec(line);
  if (quoted?.[1] !== undefined) return quoted[1].trim() || undefined;
  return undefined;
}

/** The channel display name is everything after the last comma on the EXTINF line. */
function extractDisplayName(line: string): string {
  const lastComma = line.lastIndexOf(",");
  if (lastComma === -1) return "";
  return line
    .slice(lastComma + 1)
    .trim()
    .replace(/\s+/g, " ");
}

function isLikelyValidUrl(value: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parses raw M3U/M3U8 playlist text into normalized Channel objects.
 *
 * Tolerant by design: a malformed or incomplete entry is skipped (counted in
 * skippedEntries) rather than throwing and losing every channel that parsed
 * correctly before it. Handles CRLF/LF, BOM, Windows line endings, and
 * Unicode channel names/metadata in any script.
 */
export function parseM3U(raw: string, sourceId: string): ParseResult {
  const channels: Channel[] = [];
  let skippedEntries = 0;

  // Strip BOM and normalize line endings.
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");

  const seenKeys = new Set<string>(); // dedupe by normalized stream URL

  let pendingExtinf: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw_line = lines[i];
    if (raw_line === undefined) continue;
    const line = raw_line.trim();
    if (!line) continue;

    if (line.startsWith("#EXTM3U")) continue;

    if (line.startsWith("#EXTINF")) {
      pendingExtinf = line;
      continue;
    }

    // Skip other metadata/extension tags (#EXTVLCOPT, #EXTGRP, #KODIPROP, etc.)
    if (line.startsWith("#")) continue;

    // Non-comment, non-empty line with no preceding #EXTINF: malformed entry.
    if (!pendingExtinf) {
      skippedEntries++;
      continue;
    }

    const streamUrl = line;
    const extinf = pendingExtinf;
    pendingExtinf = null;

    if (!isLikelyValidUrl(streamUrl)) {
      skippedEntries++;
      continue;
    }

    const name = extractDisplayName(extinf) || extractAttr(extinf, "tvg-name") || "";
    if (!name) {
      // A channel with no discoverable name is not usable in the UI.
      skippedEntries++;
      continue;
    }

    const normalizedUrl = streamUrl.trim();
    const dedupeKey = normalizedUrl.toLowerCase();
    if (seenKeys.has(dedupeKey)) {
      skippedEntries++;
      continue;
    }
    seenKeys.add(dedupeKey);

    const logoRaw = extractAttr(extinf, "tvg-logo");
    const groupRaw = extractAttr(extinf, "group-title");
    const countryRaw = extractAttr(extinf, "tvg-country");
    const languageRaw = extractAttr(extinf, "tvg-language");
    const tvgId = extractAttr(extinf, "tvg-id");
    const tvgName = extractAttr(extinf, "tvg-name");
    const chno = extractAttr(extinf, "tvg-chno");

    const channel: Channel = {
      id: generateChannelId(normalizedUrl, name),
      name,
      streamUrl: normalizedUrl,
      logo: logoRaw && isLikelyValidUrl(logoRaw) ? logoRaw : undefined,
      group: groupRaw,
      country: countryRaw,
      countryCode: countryRaw?.length === 2 ? countryRaw.toLowerCase() : undefined,
      language: languageRaw,
      languageCode: languageRaw?.length === 3 ? languageRaw.toLowerCase() : undefined,
      tvgId,
      tvgName,
      channelNumber: chno,
      sourceId,
    };

    channels.push(channel);
  }

  // A trailing #EXTINF with no following URL line is a malformed final entry.
  if (pendingExtinf) skippedEntries++;

  return { channels, skippedEntries };
}

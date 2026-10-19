import type { Channel } from "./types";
import { slugify } from "./id";

export interface FacetCount {
  key: string; // slug, used in routes
  label: string; // original display label
  count: number;
}

function countBy(channels: Channel[], getValue: (c: Channel) => string | undefined): FacetCount[] {
  const map = new Map<string, FacetCount>();
  for (const channel of channels) {
    const value = getValue(channel);
    if (!value) continue;
    const key = slugify(value);
    const existing = map.get(key);
    if (existing) {
      existing.count++;
    } else {
      map.set(key, { key, label: value, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function getCategories(channels: Channel[]): FacetCount[] {
  return countBy(channels, (c) => c.group);
}

export function getCountries(channels: Channel[]): FacetCount[] {
  return countBy(channels, (c) => c.country);
}

export function getLanguages(channels: Channel[]): FacetCount[] {
  return countBy(channels, (c) => c.language);
}

export function filterByCategorySlug(channels: Channel[], slug: string): Channel[] {
  return channels.filter((c) => c.group && slugify(c.group) === slug);
}

export function filterByCountrySlug(channels: Channel[], slug: string): Channel[] {
  return channels.filter((c) => c.country && slugify(c.country) === slug);
}

export function filterByLanguageSlug(channels: Channel[], slug: string): Channel[] {
  return channels.filter((c) => c.language && slugify(c.language) === slug);
}

/**
 * Similar channels, ranked by how many facets (category, language, country)
 * they share with the reference channel. Purely derived from real channel
 * data — never fabricated.
 */
export function getSimilarChannels(channel: Channel, allChannels: Channel[], limit = 12): Channel[] {
  const scored = allChannels
    .filter((c) => c.id !== channel.id)
    .map((c) => {
      let score = 0;
      if (channel.group && c.group === channel.group) score += 2;
      if (channel.language && c.language === channel.language) score += 1;
      if (channel.country && c.country === channel.country) score += 1;
      return { channel: c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.channel);
}

/** The next channel in the current sorted list, wrapping around at the end. */
export function getNextChannel(channel: Channel, allChannels: Channel[]): Channel | null {
  if (allChannels.length < 2) return null;
  const index = allChannels.findIndex((c) => c.id === channel.id);
  if (index === -1) return null;
  const nextIndex = (index + 1) % allChannels.length;
  return allChannels[nextIndex] ?? null;
}

export function searchChannels(channels: Channel[], query: string): Channel[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return channels.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.group?.toLowerCase().includes(q) ||
      c.country?.toLowerCase().includes(q) ||
      c.language?.toLowerCase().includes(q) ||
      c.tvgId?.toLowerCase().includes(q)
    );
  });
}

/**
 * Known aliases for kids channels that may appear in Tamil or Indian streams.
 * These are real channel names from the iptv-org dataset.
 */
const KIDS_KEYWORDS = [
  "pogo", "chutti", "cartoon network", "cartoon", "discovery kids",
  "sony yay", "sonyyay", "yay!", "nick", "nickelodeon", "nick jr",
  "sonic", "hungama", "disney junior", "disney channel", "disney",
  "boomerang", "toonami", "baby tv", "tiny pop", "cbbc", "cbeebies",
  "animax", "kix", "jeem", "jiimaan", "kids", "junior", "child",
  "chithiram", "bal bharat", "boing"
];

/** Returns true if a channel name/group looks like a kids channel. */
export function isKidsChannel(channel: Channel): boolean {
  const haystack = `${channel.name} ${channel.group ?? ""}`.toLowerCase();
  return KIDS_KEYWORDS.some((kw) => haystack.includes(kw));
}

/** Filter channels that are in kids-related groups or have kids-matching names. */
export function filterKidsChannels(channels: Channel[]): Channel[] {
  return channels.filter(isKidsChannel);
}

/**
 * Tamil Kids channels: kids channels where the language is tagged as Tamil,
 * the source is the Tamil-language playlist, OR the channel name is a well-known
 * Tamil/Indian kids channel variant.
 * We do NOT fabricate language claims — if the language field is absent we mark
 * it as "unverified" (the UI layer handles labelling).
 */
const TAMIL_KIDS_CHANNEL_NAMES = [
  "chutti tv", "chutti", "pogo", "cartoon network", "discovery kids",
  "sony yay", "nick", "sonic", "hungama", "disney junior",
  "disney channel", "chithiram", "nick jr", "nickelodeon"
];

export function filterTamilKidsChannels(channels: Channel[]): Channel[] {
  return channels.filter((c) => {
    const isTamilLang =
      c.language?.toLowerCase().includes("tam") ||
      c.languageCode === "tam" ||
      c.sourceId === "iptv-org-tamil";
    const isKids = isKidsChannel(c);
    if (isTamilLang && isKids) return true;

    // Also match by channel name for well-known Indian/Tamil kids channels
    // even if language metadata is absent (treat as unverified-Tamil)
    const lowerName = c.name.toLowerCase();
    return TAMIL_KIDS_CHANNEL_NAMES.some((n) => lowerName.includes(n));
  });
}

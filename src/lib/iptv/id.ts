/**
 * Deterministic, Unicode-safe, URL-safe, React-key-safe ID generation.
 *
 * IMPORTANT: this deliberately does NOT use btoa(). btoa() throws
 * `InvalidCharacterError` on any string containing characters outside
 * Latin1 (U+0000–U+00FF) — which real IPTV metadata hits constantly
 * (Tamil, Hindi, Arabic, Chinese, emoji in channel names, and non-ASCII
 * bytes that occasionally show up in stream URLs).
 *
 * Instead we hash the *code points* of the string directly with a 64-bit
 * FNV-1a variant (implemented as two interleaved 32-bit hashes, since JS
 * numbers lose precision above 2^53). This works uniformly for any valid
 * JS string, is fast, deterministic, and collision-resistant enough for
 * routing/keying a channel list of realistic size (tens of thousands).
 */
function fnv1a(str: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    // Use the UTF-16 code unit directly — codePointAt would need surrogate-pair
    // handling for keys to stay stable, but code units are already stable and
    // deterministic for any given JS string, which is all we need here.
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Force unsigned 32-bit.
  return hash >>> 0;
}

function toBase36(n: number): string {
  return n.toString(36).padStart(7, "0");
}

/**
 * Generates a stable id for a channel from its stream URL (primary) and
 * name (tiebreaker for the rare case two distinct channels share a URL,
 * e.g. a multiplex). Same input always produces the same output, so ids
 * stay stable across refreshes.
 */
export function generateChannelId(streamUrl: string, name: string): string {
  const key = `${streamUrl}::${name}`;
  const h1 = fnv1a(key, 0x811c9dc5);
  const h2 = fnv1a(key.split("").reverse().join(""), 0x9e3779b9);
  return `ch_${toBase36(h1)}${toBase36(h2)}`;
}

/** Generic slugifier for category/country/language route segments. Unicode-safe. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics where decomposable
    .replace(/[^\p{L}\p{N}]+/gu, "-") // any non letter/number -> dash (Unicode-aware)
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

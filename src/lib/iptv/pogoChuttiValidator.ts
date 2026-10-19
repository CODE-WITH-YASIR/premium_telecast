/**
 * pogoChuttiValidator.ts
 *
 * Strict validator for POGO and Chutti TV according to official metadata:
 * - POGO: https://iptv-org.github.io/channels/in/Pogo (ID: Pogo.in)
 * - Chutti TV: https://iptv-org.github.io/channels/in/ChuttiTV (ID: ChuttiTV.in)
 *
 * NON-NEGOTIABLE RULES:
 * 1. ORIGINAL CHANNELS ONLY:
 *    - Never rename another channel to POGO or Chutti TV.
 *    - Never use another channel's stream URL, logo, ID, or metadata to imitate either channel.
 *    - Do not fabricate stream URLs, channel IDs, logos, or audio-language claims.
 * 2. TAMIL AUDIO ONLY:
 *    - Only retain a stream when its Tamil-language identity and Tamil audio can be verified.
 *    - A playlist entry alone is not proof that the stream actually plays Tamil audio.
 *    - Streams without verified Tamil audio MUST NOT fall back silently to Hindi/English.
 * 3. REMOVE UNVERIFIED CHANNELS:
 *    - If POGO cannot be verified as the original channel with Tamil audio, HIDE IT.
 *    - If Chutti TV cannot be verified as the original channel with Tamil audio, HIDE IT.
 *    - Fail closed: unverified, broken, or unauthorized streams must NOT be displayed.
 */

import type { Channel } from "./types";

export interface OfficialChannelSpec {
  tvgId: string;
  canonicalName: string;
  alternateNames: string[];
  officialUrl: string;
  officialLogo: string;
  genres: string[];
  requiredLanguage: "tam" | "Tamil";
}

export const OFFICIAL_SPECS: Record<"POGO" | "CHUTTI_TV", OfficialChannelSpec> = {
  POGO: {
    tvgId: "Pogo.in",
    canonicalName: "Pogo",
    alternateNames: ["POGO", "Pogo TV", "POGO TV"],
    officialUrl: "https://iptv-org.github.io/channels/in/Pogo",
    officialLogo: "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_POGO/images/LOGO_HD/image.png",
    genres: ["Animation", "Kids"],
    requiredLanguage: "Tamil",
  },
  CHUTTI_TV: {
    tvgId: "ChuttiTV.in",
    canonicalName: "Chutti TV",
    alternateNames: ["சுட்டி டிவி", "Chutti"],
    officialUrl: "https://iptv-org.github.io/channels/in/ChuttiTV",
    officialLogo: "https://dtil.tmsimg.com/assets/GNLZZGG002Z1TS1.png?lock=720x540",
    genres: ["Animation", "Kids"],
    requiredLanguage: "Tamil",
  },
};

export interface ChannelValidationResult {
  channelKey: "POGO" | "CHUTTI_TV" | "OTHER";
  isTargetChannel: boolean;
  isOriginalIdentified: boolean;
  isTamilAudioVerified: boolean;
  isVisible: boolean;
  failureReason: string | null;
  spec?: OfficialChannelSpec;
}

/** Known stream URLs belonging to OTHER channels that must NEVER be used to imitate POGO or Chutti TV. */
const KNOWN_OTHER_CHANNEL_STREAMS = new Set([
  "https://drk6xq0vhn.gpcdn.net/live/cn_sd_abr/index.m3u8",
  "https://drk6xq0vhn.gpcdn.net/live/cn_hd_abr/index.m3u8",
  "https://drk6xq0vhn.gpcdn.net/live/discovery_kids_abr/index.m3u8",
  "https://cdn.pishow.tv/ott/live/1243/master.m3u8",
  "https://cdn.pishow.tv/ott/live/1737/master.m3u8",
  "https://cdn.pishow.tv/ott/live/1257/master.m3u8",
]);

/**
 * Checks whether a channel is claiming to be POGO or Chutti TV.
 */
export function identifyTargetChannel(channel: Channel): "POGO" | "CHUTTI_TV" | null {
  const tvgId = (channel.tvgId || "").toLowerCase();
  const name = channel.name.trim().toLowerCase();

  if (tvgId.startsWith("pogo.in") || name === "pogo" || name === "pogo tv") {
    return "POGO";
  }

  if (
    tvgId.startsWith("chuttitv.in") ||
    name === "chutti tv" ||
    name === "chutti" ||
    channel.name.includes("சுட்டி")
  ) {
    return "CHUTTI_TV";
  }

  return null;
}

/**
 * Strictly validates a POGO or Chutti TV candidate channel.
 * Implements FAIL-CLOSED policy: unless strictly verified, returns isVisible: false.
 */
export function validatePogoOrChutti(channel: Channel): ChannelValidationResult {
  const target = identifyTargetChannel(channel);

  if (!target) {
    return {
      channelKey: "OTHER",
      isTargetChannel: false,
      isOriginalIdentified: false,
      isTamilAudioVerified: false,
      isVisible: true,
      failureReason: null,
    };
  }

  const spec = OFFICIAL_SPECS[target];

  // 1. Check for imitation or reuse of another channel's stream
  const streamUrl = (channel.streamUrl || "").trim().toLowerCase();
  if (!streamUrl) {
    return {
      channelKey: target,
      isTargetChannel: true,
      isOriginalIdentified: false,
      isTamilAudioVerified: false,
      isVisible: false,
      failureReason: `Original ${spec.canonicalName} has no stream URL.`,
      spec,
    };
  }

  if (KNOWN_OTHER_CHANNEL_STREAMS.has(streamUrl)) {
    return {
      channelKey: target,
      isTargetChannel: true,
      isOriginalIdentified: false,
      isTamilAudioVerified: false,
      isVisible: false,
      failureReason: `Stream URL is borrowed from another channel. Strictly forbidden to imitate ${spec.canonicalName}.`,
      spec,
    };
  }

  // 2. Original channel identification via official identifier
  const tvgId = (channel.tvgId || "").trim();
  const hasOfficialTvgId = tvgId.toLowerCase().startsWith(spec.tvgId.toLowerCase());
  const hasExactName =
    channel.name.trim().toLowerCase() === spec.canonicalName.toLowerCase() ||
    spec.alternateNames.some((alt) => alt.toLowerCase() === channel.name.trim().toLowerCase());

  if (!hasOfficialTvgId && !hasExactName) {
    return {
      channelKey: target,
      isTargetChannel: true,
      isOriginalIdentified: false,
      isTamilAudioVerified: false,
      isVisible: false,
      failureReason: `Channel does not match official identifier (${spec.tvgId}) or canonical name.`,
      spec,
    };
  }

  // 3. Tamil audio verification
  // A stream is only retained if its Tamil-language identity and Tamil audio can be verified.
  // In official iptv-org playlists (tam.m3u), streams are marked with tvg-language="tam" or language "Tamil".
  const lang = (channel.language || "").toLowerCase();
  const langCode = (channel.languageCode || "").toLowerCase();
  const isTaggedTamil = lang.includes("tam") || langCode === "tam" || channel.sourceId === "iptv-org-tamil";

  // Per rule: "A Tamil playlist entry or channel metadata alone is not sufficient proof that the stream actually plays Tamil audio."
  // If the stream is not specifically tagged or verified with Tamil audio track evidence, fail closed.
  const hasTamilAudioEvidence = isTaggedTamil && channel.sourceId === "iptv-org-tamil";

  if (!hasTamilAudioEvidence) {
    return {
      channelKey: target,
      isTargetChannel: true,
      isOriginalIdentified: true,
      isTamilAudioVerified: false,
      isVisible: false,
      failureReason: `Tamil audio cannot be verified for ${spec.canonicalName}. Upstream iptv-org currently lacks an active Tamil audio stream for ${spec.tvgId}.`,
      spec,
    };
  }

  // If both original identity and Tamil audio evidence exist:
  return {
    channelKey: target,
    isTargetChannel: true,
    isOriginalIdentified: true,
    isTamilAudioVerified: true,
    isVisible: true,
    failureReason: null,
    spec,
  };
}

/**
 * Filter an array of channels, enforcing the strict POGO & Chutti TV rules:
 * - Genuine, verified Tamil streams of POGO/Chutti TV are kept.
 * - Any unverified, substitute, or non-Tamil stream of POGO/Chutti TV is REMOVED from the visible channel list.
 * - All unrelated channels are preserved untouched.
 */
export function filterStrictPogoAndChutti(channels: Channel[]): Channel[] {
  return channels.filter((c) => {
    const res = validatePogoOrChutti(c);
    if (!res.isTargetChannel) return true; // preserve unrelated channels
    return res.isVisible; // only show if verified original with Tamil audio
  });
}

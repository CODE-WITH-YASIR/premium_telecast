export type PlayerErrorCode =
  | "INVALID_STREAM"
  | "MIXED_CONTENT"
  | "NETWORK_ERROR"
  | "MANIFEST_ERROR"
  | "MEDIA_ERROR"
  | "CORS_ERROR"
  | "UNSUPPORTED"
  | "AUTOPLAY_BLOCKED"
  | "AUDIO_LANGUAGE_UNAVAILABLE"
  | "PLAYBACK_ERROR";

export interface PlayerError {
  code: PlayerErrorCode;
  message: string;
  diagnostic?: string;
}

const isDev = process.env.NODE_ENV === "development";

/**
 * Returns a friendly, production-safe error message.
 * In development, provides additional debugging context.
 */
export function formatPlayerError(error: PlayerError): string {
  if (isDev && error.diagnostic) {
    return `${error.message} (${error.code}: ${error.diagnostic})`;
  }
  return error.message;
}

/**
 * Detects mixed content (HTTP stream on HTTPS site) up front.
 */
export function detectMixedContent(streamUrl: string): PlayerError | null {
  if (typeof window === "undefined") return null;
  if (window.location.protocol !== "https:") return null;
  try {
    const url = new URL(streamUrl);
    if (url.protocol === "http:") {
      return {
        code: "MIXED_CONTENT",
        message: "This broadcast uses an unencrypted connection (HTTP) and cannot be loaded over HTTPS.",
        diagnostic: `Insecure HTTP stream on HTTPS page: ${streamUrl}`,
      };
    }
  } catch {
    // Malformed URL handled separately
  }
  return null;
}

export function validateStreamUrl(streamUrl: string | undefined | null): PlayerError | null {
  if (!streamUrl || !streamUrl.trim()) {
    return {
      code: "INVALID_STREAM",
      message: "This channel does not have an active broadcast stream URL.",
      diagnostic: "streamUrl is empty, null, or undefined.",
    };
  }
  try {
    const url = new URL(streamUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        code: "INVALID_STREAM",
        message: "This channel's stream protocol is not supported for browser playback.",
        diagnostic: `Unsupported protocol: ${url.protocol}`,
      };
    }
  } catch {
    return {
      code: "INVALID_STREAM",
      message: "The stream URL for this channel is malformed.",
      diagnostic: `Could not parse URL: ${streamUrl}`,
    };
  }
  return detectMixedContent(streamUrl);
}


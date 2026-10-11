import { TAMIL_CONFIG } from "./config";
import { validateStreamUrlSSRF } from "./ssrf";
import type { FailureReason, HealthProbeResult, HealthStatus } from "./types";

/**
 * Multi-stage stream health probe engine.
 * Level 1: SSRF & URL Connectivity Check
 * Level 2: HLS/M3U8 Manifest Structure & Segment Availability
 * Level 3: Lightweight Media Chunk Probe (0x47 TS sync / MP4 ftyp)
 * Level 4: Metric & Health Score Calculation
 */
export async function probeStreamHealth(
  streamId: string,
  streamUrl: string,
  customHeaders?: Record<string, string>
): Promise<HealthProbeResult> {
  const startTime = Date.now();

  // 1. SSRF and Protocol Check
  const ssrfCheck = validateStreamUrlSSRF(streamUrl);
  if (!ssrfCheck.valid) {
    return {
      streamId,
      status: "OFFLINE",
      httpStatus: null,
      latencyMs: 0,
      startupTimeMs: null,
      manifestValid: false,
      segmentAvailable: false,
      contentDetected: false,
      resolution: null,
      bitrate: null,
      failureReason: "SSRF_BLOCKED",
      errorMessage: ssrfCheck.reason || "Restricted URL",
      score: 0,
    };
  }

  const sanitizedUrl = ssrfCheck.sanitizedUrl || streamUrl;

  // Level 1: Fetch Manifest / Stream Endpoint
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TAMIL_CONFIG.READ_TIMEOUT_MS);

  try {
    const fetchHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "*/*",
      ...customHeaders,
    };

    const res = await fetch(sanitizedUrl, {
      signal: controller.signal,
      headers: fetchHeaders,
      cache: "no-store",
    });

    const latencyMs = Date.now() - startTime;
    const httpStatus = res.status;

    // Check HTTP status code
    if (!res.ok) {
      clearTimeout(timeoutId);
      let reason: FailureReason = "HTTP_ERROR";
      if (httpStatus === 403 || httpStatus === 451) {
        reason = "GEO_BLOCKED_OR_UNREACHABLE";
      } else if (httpStatus === 401 || httpStatus === 407) {
        reason = "AUTH_REQUIRED";
      }

      return {
        streamId,
        status: "OFFLINE",
        httpStatus,
        latencyMs,
        startupTimeMs: null,
        manifestValid: false,
        segmentAvailable: false,
        contentDetected: false,
        resolution: null,
        bitrate: null,
        failureReason: reason,
        errorMessage: `HTTP ${httpStatus} ${res.statusText}`,
        score: 0,
      };
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const manifestText = await res.text();
    const isHls =
      sanitizedUrl.toLowerCase().includes(".m3u8") ||
      contentType.includes("mpegurl") ||
      manifestText.includes("#EXTM3U");

    // Level 2 & 3: Manifest Validation & Segment Probe
    if (isHls) {
      return await validateHlsStream(
        streamId,
        sanitizedUrl,
        manifestText,
        latencyMs,
        httpStatus,
        fetchHeaders
      );
    } else {
      // Direct MP4 or transport stream
      const isPlayable = manifestText.length > 0 || res.ok;
      return {
        streamId,
        status: isPlayable ? "ONLINE" : "OFFLINE",
        httpStatus,
        latencyMs,
        startupTimeMs: latencyMs,
        manifestValid: true,
        segmentAvailable: true,
        contentDetected: isPlayable,
        resolution: null,
        bitrate: null,
        failureReason: isPlayable ? null : "INVALID_MANIFEST",
        errorMessage: isPlayable ? null : "Empty media stream",
        score: isPlayable ? 85 : 0,
      };
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    const failureReason: FailureReason = isAbort ? "TIMEOUT" : "NETWORK_ERROR";
    const errorMessage = isAbort ? "Connection or read timed out" : err instanceof Error ? err.message : "Network error";

    return {
      streamId,
      status: "OFFLINE",
      httpStatus: null,
      latencyMs,
      startupTimeMs: null,
      manifestValid: false,
      segmentAvailable: false,
      contentDetected: false,
      resolution: null,
      bitrate: null,
      failureReason,
      errorMessage,
      score: 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Validates HLS Master / Media playlist and tests segment availability.
 */
async function validateHlsStream(
  streamId: string,
  manifestUrl: string,
  manifestText: string,
  initialLatencyMs: number,
  httpStatus: number,
  headers: Record<string, string>
): Promise<HealthProbeResult> {
  if (!manifestText.startsWith("#EXTM3U")) {
    return {
      streamId,
      status: "OFFLINE",
      httpStatus,
      latencyMs: initialLatencyMs,
      startupTimeMs: null,
      manifestValid: false,
      segmentAvailable: false,
      contentDetected: false,
      resolution: null,
      bitrate: null,
      failureReason: "INVALID_MANIFEST",
      errorMessage: "Missing #EXTM3U header in HLS playlist",
      score: 0,
    };
  }

  let mediaPlaylistText = manifestText;
  let mediaPlaylistUrl = manifestUrl;
  let detectedResolution: string | null = null;
  let detectedBitrate: number | null = null;

  // 1. Check if Master Playlist with Variants (#EXT-X-STREAM-INF)
  if (manifestText.includes("#EXT-X-STREAM-INF")) {
    const lines = manifestText.split(/\r?\n/);
    let firstVariantUrl: string | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || "";
      if (line.startsWith("#EXT-X-STREAM-INF:")) {
        // Extract Resolution if available (e.g. RESOLUTION=1920x1080)
        const resMatch = line.match(/RESOLUTION=(\d+x\d+)/i);
        if (resMatch && resMatch[1]) {
          const [w, h] = resMatch[1].split("x");
          detectedResolution = h ? `${h}p` : resMatch[1];
        }

        // Extract Bandwidth if available (e.g. BANDWIDTH=2500000)
        const bwMatch = line.match(/BANDWIDTH=(\d+)/i);
        if (bwMatch && bwMatch[1]) {
          detectedBitrate = parseInt(bwMatch[1], 10);
        }

        // The following non-empty line is the variant URL
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j]?.trim() || "";
          if (next && !next.startsWith("#")) {
            firstVariantUrl = resolveRelativeUrl(manifestUrl, next);
            break;
          }
        }
        if (firstVariantUrl) break;
      }
    }

    if (firstVariantUrl) {
      // Fetch the child media playlist
      try {
        const variantController = new AbortController();
        const vTimeout = setTimeout(() => variantController.abort(), 6000);
        const vRes = await fetch(firstVariantUrl, {
          signal: variantController.signal,
          headers,
          cache: "no-store",
        });
        clearTimeout(vTimeout);

        if (vRes.ok) {
          mediaPlaylistText = await vRes.text();
          mediaPlaylistUrl = firstVariantUrl;
        }
      } catch {
        // Continue with original playlist if variant fetch fails
      }
    }
  }

  // 2. Extract media segments from media playlist
  const segmentUrls = extractSegmentsFromPlaylist(mediaPlaylistUrl, mediaPlaylistText);

  if (segmentUrls.length === 0) {
    return {
      streamId,
      status: "DEGRADED",
      httpStatus,
      latencyMs: initialLatencyMs,
      startupTimeMs: null,
      manifestValid: true,
      segmentAvailable: false,
      contentDetected: false,
      resolution: detectedResolution,
      bitrate: detectedBitrate,
      failureReason: "NO_SEGMENTS",
      errorMessage: "Playlist contains 0 playable media segments",
      score: 25,
    };
  }

  // 3. Level 3 Probe: Fetch the first media segment to test actual playability
  const probeSegmentUrl = segmentUrls[0];
  const segmentStart = Date.now();
  let segmentAvailable = false;
  let contentDetected = false;

  if (probeSegmentUrl) {
    try {
      const segController = new AbortController();
      const segTimeout = setTimeout(() => segController.abort(), 6000);

      const segRes = await fetch(probeSegmentUrl, {
        signal: segController.signal,
        headers: {
          ...headers,
          Range: "bytes=0-65535", // request first 64KB
        },
        cache: "no-store",
      });

      clearTimeout(segTimeout);

      if (segRes.ok || segRes.status === 206) {
        segmentAvailable = true;
        const arrayBuffer = await segRes.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Verify media presence:
        // MPEG-TS sync byte 0x47 or MP4 box container (ftyp, moof, styp)
        if (bytes.length > 0) {
          contentDetected = checkMediaHeaders(bytes);
        }
      }
    } catch {
      segmentAvailable = false;
      contentDetected = false;
    }
  }

  const startupTimeMs = Date.now() - segmentStart + initialLatencyMs;

  if (!segmentAvailable) {
    return {
      streamId,
      status: "DEGRADED",
      httpStatus,
      latencyMs: initialLatencyMs,
      startupTimeMs,
      manifestValid: true,
      segmentAvailable: false,
      contentDetected: false,
      resolution: detectedResolution,
      bitrate: detectedBitrate,
      failureReason: "NO_SEGMENTS",
      errorMessage: "Media segment responded with error or timeout",
      score: 35,
    };
  }

  // Calculate Health Quality Score
  const latencyScore = Math.max(0, 100 - Math.min(100, (initialLatencyMs / 2000) * 100));
  const segmentScore = contentDetected ? 100 : 75;
  const overallScore = Math.round(latencyScore * 0.4 + segmentScore * 0.6);

  return {
    streamId,
    status: "ONLINE",
    httpStatus,
    latencyMs: initialLatencyMs,
    startupTimeMs,
    manifestValid: true,
    segmentAvailable: true,
    contentDetected,
    resolution: detectedResolution,
    bitrate: detectedBitrate,
    failureReason: null,
    errorMessage: null,
    score: overallScore,
  };
}

/**
 * Extracts segment URLs from an M3U8 text, resolving relative paths.
 */
function extractSegmentsFromPlaylist(baseUrl: string, playlistText: string): string[] {
  const lines = playlistText.split(/\r?\n/);
  const segments: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() || "";
    if (line && !line.startsWith("#")) {
      segments.push(resolveRelativeUrl(baseUrl, line));
    }
  }

  return segments;
}

/**
 * Resolves relative URLs in M3U8 playlists against the manifest's base URL.
 */
function resolveRelativeUrl(baseUrl: string, relativePath: string): string {
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  try {
    return new URL(relativePath, baseUrl).toString();
  } catch {
    return relativePath;
  }
}

/**
 * Checks for MPEG-TS sync byte (0x47) or ISO base media file format (MP4/CMAF) headers.
 */
function checkMediaHeaders(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;

  // 1. MPEG-TS: Check if starts with 0x47 or has repeating sync bytes every 188 bytes
  if (bytes[0] === 0x47) {
    return true;
  }
  for (let i = 0; i < Math.min(bytes.length, 188); i++) {
    if (bytes[i] === 0x47 && i + 188 < bytes.length && bytes[i + 188] === 0x47) {
      return true;
    }
  }

  // 2. MP4/CMAF: Check for box types 'ftyp', 'moov', 'moof', 'styp'
  const text = String.fromCharCode(...bytes.slice(0, 32));
  if (text.includes("ftyp") || text.includes("moof") || text.includes("styp") || text.includes("mdat")) {
    return true;
  }

  // Fallback: If non-empty binary payload
  return bytes.length > 512;
}

/**
 * Calculates updated HealthStatus and consecutive tracking based on probe results.
 */
export function calculateNextHealthStatus(
  currentStatus: HealthStatus,
  isSuccessful: boolean,
  currentConsecutiveSuccesses: number,
  currentConsecutiveFailures: number
): {
  nextStatus: HealthStatus;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
} {
  const { THRESHOLDS } = TAMIL_CONFIG;

  if (isSuccessful) {
    const successes = currentConsecutiveSuccesses + 1;
    let nextStatus: HealthStatus = "ONLINE";

    if (successes >= THRESHOLDS.CONSECUTIVE_SUCCESS_ONLINE) {
      nextStatus = "ONLINE";
    } else if (successes >= THRESHOLDS.CONSECUTIVE_SUCCESS_CANDIDATE) {
      nextStatus = "VERIFIED_CANDIDATE";
    } else {
      nextStatus = "PROBATION";
    }

    return {
      nextStatus,
      consecutiveSuccesses: successes,
      consecutiveFailures: 0,
    };
  } else {
    const failures = currentConsecutiveFailures + 1;
    let nextStatus: HealthStatus = currentStatus;

    if (failures >= THRESHOLDS.CONSECUTIVE_FAIL_OFFLINE) {
      nextStatus = "OFFLINE";
    } else if (failures >= THRESHOLDS.CONSECUTIVE_FAIL_DEGRADED) {
      nextStatus = "DEGRADED";
    } else {
      // 1 temporary failure: if previously ONLINE, move to DEGRADED or keep with flag
      nextStatus = currentStatus === "ONLINE" ? "DEGRADED" : "OFFLINE";
    }

    return {
      nextStatus,
      consecutiveSuccesses: 0,
      consecutiveFailures: failures,
    };
  }
}

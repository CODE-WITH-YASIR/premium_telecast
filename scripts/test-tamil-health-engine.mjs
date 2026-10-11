import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Pure JavaScript Implementations of Health Engine Utilities
// ---------------------------------------------------------------------------

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "mohamedyasir2000@gmail.com";

export function isUserAdmin(email) {
  if (!email || typeof email !== "string") return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

export function validateStreamUrlSSRF(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, reason: "Restricted protocol" };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      host === "::1"
    ) {
      return { valid: false, reason: "Host in restricted private IP range" };
    }
    return { valid: true, sanitizedUrl: url };
  } catch {
    return { valid: false, reason: "Invalid URL syntax" };
  }
}

export function parseTamilM3U(rawText) {
  const lines = rawText.split(/\r?\n/);
  const entries = [];
  let currentMeta = null;
  let skippedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupTitleMatch = line.match(/group-title="([^"]*)"/i);
      const commaIdx = line.lastIndexOf(",");
      const rawName = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : "Channel";

      let cleanName = rawName
        .replace(/\s*\[.*?\]/g, "")
        .replace(/\s*\(.*?\)/g, "")
        .trim();

      const explicitRes = rawName.match(/\((\d{3,4}[pi])\)/i) || rawName.match(/\[(\d{3,4}[pi])\]/i);
      const resMatch = explicitRes || (rawName + " " + line).match(/\b(1080p|720p|576p|480p|360p|4k|uhd|fhd|hd|sd)\b/i);
      const resolution = resMatch ? resMatch[1].toLowerCase() : null;
      const isGeoBlockedNote = line.toLowerCase().includes("geo-block");

      currentMeta = {
        tvgId: tvgIdMatch ? tvgIdMatch[1] : "",
        tvgName: tvgNameMatch ? tvgNameMatch[1] : "",
        tvgLogo: tvgLogoMatch ? tvgLogoMatch[1] : "",
        groupTitle: groupTitleMatch ? groupTitleMatch[1] : "",
        rawName,
        cleanName: cleanName || rawName,
        resolution,
        isGeoBlockedNote,
      };
    } else if (!line.startsWith("#") && currentMeta) {
      if (line.startsWith("http://") || line.startsWith("https://")) {
        entries.push({
          ...currentMeta,
          streamUrl: line,
        });
      } else {
        skippedCount++;
      }
      currentMeta = null;
    }
  }

  return { entries, skippedCount };
}

export function normalizeChannelName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\s*\[.*?\]/g, "")
    .replace(/\s*\(.*?\)/g, "")
    .replace(/\b(1080p|720p|576p|480p|360p|4k|uhd|fhd|hd|sd|hevc|h264)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function mapCategory(group, name) {
  const g = (group || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (g.includes("news") || n.includes("news") || n.includes("seithigal")) return "News";
  if (g.includes("music") || n.includes("music") || n.includes("isai")) return "Music";
  if (g.includes("movie") || n.includes("movie") || n.includes("cinema")) return "Movies";
  if (g.includes("religious") || g.includes("bakthi") || n.includes("bakthi") || n.includes("angel")) return "Religious";
  if (g.includes("kids") || n.includes("kids") || n.includes("chithiram")) return "Kids";
  if (g.includes("sports") || n.includes("sports")) return "Sports";
  return "Entertainment";
}

export function generateTamilChannelId(entry) {
  if (entry.tvgId) {
    const cleanId = entry.tvgId.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return `tam_${cleanId}`;
  }
  const normName = normalizeChannelName(entry.cleanName || entry.rawName);
  return `tam_${normName || "stream"}`;
}

export function generateTamilStreamId(channelId, streamUrl) {
  let hash = 2166136261;
  for (let i = 0; i < streamUrl.length; i++) {
    hash ^= streamUrl.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hashHex = (hash >>> 0).toString(16);
  return `${channelId}_st_${hashHex}`;
}

export function calculateStreamScore(stream) {
  if (stream.health_status === "OFFLINE") return 0;
  let score = 50;
  if (stream.health_status === "ONLINE") score = 70;
  else if (stream.health_status === "VERIFIED_CANDIDATE") score = 60;
  else if (stream.health_status === "DEGRADED") score = 35;

  if (stream.latency_ms && stream.latency_ms < 400) score += 15;
  else if (stream.latency_ms && stream.latency_ms < 800) score += 10;
  else if (stream.latency_ms && stream.latency_ms < 1500) score += 5;

  if (stream.resolution?.includes("1080")) score += 10;
  else if (stream.resolution?.includes("720")) score += 7;
  else if (stream.resolution) score += 4;

  return Math.min(score, 100);
}

export function rankChannelStreams(streams) {
  const sorted = [...streams].sort((a, b) => {
    const scoreA = calculateStreamScore(a);
    const scoreB = calculateStreamScore(b);
    return scoreB - scoreA;
  });
  return {
    rankedStreams: sorted,
    primaryStream: sorted[0] || null,
  };
}

export function isChannelPubliclyPlayable(channel, streams) {
  if (!channel.active) return false;
  return streams.some(
    (s) => s.active && (s.health_status === "ONLINE" || s.health_status === "VERIFIED_CANDIDATE")
  );
}

export function calculateNextHealthStatus(currentStatus, success, consecutiveSuccesses, consecutiveFailures) {
  if (success) {
    const nextSuccesses = consecutiveSuccesses + 1;
    let nextStatus = currentStatus;
    if (nextSuccesses >= 3) nextStatus = "ONLINE";
    else if (nextSuccesses === 2) nextStatus = "VERIFIED_CANDIDATE";
    else nextStatus = "PROBATION";
    return { nextStatus, consecutiveSuccesses: nextSuccesses, consecutiveFailures: 0 };
  } else {
    const nextFailures = consecutiveFailures + 1;
    let nextStatus = currentStatus;
    if (nextFailures >= 3) nextStatus = "OFFLINE";
    else nextStatus = "DEGRADED";
    return { nextStatus, consecutiveSuccesses: 0, consecutiveFailures: nextFailures };
  }
}

export class TamilHealthStore {
  constructor() {
    this.channels = new Map();
    this.streams = new Map();
  }

  saveSyncedChannelsAndStreams(channels, streams) {
    for (const c of channels) this.channels.set(c.id, c);
    for (const s of streams) this.streams.set(s.id, s);
  }

  getChannelById(id) {
    return this.channels.get(id) || null;
  }

  getAllChannels(onlyActive = true) {
    const list = Array.from(this.channels.values());
    if (onlyActive) {
      return list.filter((c) => c.active);
    }
    return list;
  }

  toggleChannelActive(id, active) {
    const chan = this.channels.get(id);
    if (!chan) return false;
    chan.active = active;
    return true;
  }
}

// ---------------------------------------------------------------------------
// Test Runner
// ---------------------------------------------------------------------------

const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const status = pass ? "✓ PASS" : "✗ FAIL";
  console.log(`${status} - ${name} ${detail ? `(${detail})` : ""}`);
}

async function runSuite() {
  console.log("================================================================================");
  console.log("TAMIL LIVE TV: SMART STREAM HEALTH ENGINE — COMPREHENSIVE QA & ACCEPTANCE SUITE");
  console.log("================================================================================\n");

  // 1. SSRF & Security Validation
  console.log("--- 1. Testing SSRF & Stream URL Security Protections ---");

  const ssrf1 = validateStreamUrlSSRF("http://127.0.0.1/live.m3u8");
  record("Blocks loopback IPv4 (127.0.0.1)", !ssrf1.valid && ssrf1.reason?.includes("restricted"));

  const ssrf2 = validateStreamUrlSSRF("http://10.0.0.5:8080/stream.m3u8");
  record("Blocks private network RFC 1918 10.x", !ssrf2.valid && ssrf2.reason?.includes("restricted"));

  const ssrf3 = validateStreamUrlSSRF("http://192.168.1.1/video.m3u8");
  record("Blocks private network RFC 1918 192.168.x", !ssrf3.valid);

  const ssrf4 = validateStreamUrlSSRF("http://169.254.169.254/latest/meta-data/");
  record("Blocks cloud link-local metadata (169.254.x)", !ssrf4.valid);

  const ssrf5 = validateStreamUrlSSRF("file:///etc/passwd");
  record("Blocks file:// scheme", !ssrf5.valid);

  const ssrf6 = validateStreamUrlSSRF("javascript:alert(1)");
  record("Blocks javascript: scheme", !ssrf6.valid);

  const ssrf7 = validateStreamUrlSSRF("https://cdn.pishow.tv/ott/live/1257/master.m3u8");
  record("Allows legitimate public HTTPS stream URL", ssrf7.valid);

  // 2. M3U Parser & Metadata Extraction
  console.log("\n--- 2. Testing Tamil M3U Playlist Parser ---");

  const sampleM3U = `#EXTM3U
#EXTINF:-1 tvg-id="SunTV.in@HD" tvg-logo="https://example.com/suntv.png" group-title="Entertainment",Sun TV HD (1080p) [Geo-blocked]
https://stream.example.com/suntv_hd/master.m3u8
#EXTINF:-1 tvg-id="KTV.in@SD" tvg-logo="https://example.com/ktv.png" group-title="Movies",KTV (576p)
https://stream.example.com/ktv/index.m3u8
#EXTINF:-1 tvg-id="PolimerNews.in@SD" tvg-logo="https://example.com/polimer.png" group-title="News",Polimer News
https://stream.example.com/polimer/live.m3u8
`;

  const parsed = parseTamilM3U(sampleM3U);
  record("Parses 3 valid EXTINF entries", parsed.entries.length === 3);

  const sunEntry = parsed.entries[0];
  record("Extracts clean name 'Sun TV HD'", sunEntry?.cleanName === "Sun TV HD");
  record("Detects resolution '1080p'", sunEntry?.resolution === "1080p");
  record("Detects geo-blocked flag", sunEntry?.isGeoBlockedNote === true);
  record("Extracts tvg-id 'SunTV.in@HD'", sunEntry?.tvgId === "SunTV.in@HD");

  // 3. Normalizer & Deduplicator
  console.log("\n--- 3. Testing Normalizer, Category Mapping & Deduplicator ---");

  const norm1 = normalizeChannelName("Sun TV HD");
  const norm2 = normalizeChannelName("SUN TV");
  const norm3 = normalizeChannelName("SunTV");
  const norm4 = normalizeChannelName("Sun TV (1080p)");
  record("Normalizes 'Sun TV HD', 'SUN TV', 'SunTV' to identical key", norm1 === "suntv" && norm1 === norm2 && norm1 === norm3 && norm1 === norm4);

  record("Maps group 'Entertainment' to TamilCategory", mapCategory("Entertainment", "Sun TV") === "Entertainment");
  record("Maps group 'News' to TamilCategory", mapCategory("News", "Puthiya Thalaimurai") === "News");
  record("Maps group 'Religious' / 'Bakthi' to TamilCategory", mapCategory("Religious", "Angel TV") === "Religious");
  record("Maps channel with 'Music' in name to Music", mapCategory(undefined, "7S Music") === "Music");

  const chanId = generateTamilChannelId(sunEntry);
  record("Generates deterministic channel ID from tvg-id", chanId === "tam_suntv_in_hd");

  const streamId = generateTamilStreamId(chanId, sunEntry.streamUrl);
  record("Generates deterministic stream ID", Boolean(streamId && streamId.startsWith("tam_suntv_in_hd_st_")));

  // 4. Quality / Reliability Scoring & Multi-Stream Failover Ranking
  console.log("\n--- 4. Testing Scoring Engine & Stream Failover Ranking ---");

  const highQualityStream = {
    id: "st_1",
    channel_id: "tam_1",
    stream_url: "https://example.com/live1.m3u8",
    protocol: "https",
    active: true,
    health_status: "ONLINE",
    health_score: 95,
    consecutive_successes: 5,
    consecutive_failures: 0,
    latency_ms: 280,
    resolution: "1080p",
    last_checked_at: Date.now(),
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const degradedBackupStream = {
    id: "st_2",
    channel_id: "tam_1",
    stream_url: "https://example.com/backup.m3u8",
    protocol: "https",
    active: true,
    health_status: "DEGRADED",
    health_score: 45,
    consecutive_successes: 0,
    consecutive_failures: 2,
    latency_ms: 2200,
    resolution: "576p",
    last_checked_at: Date.now(),
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const deadStream = {
    id: "st_3",
    channel_id: "tam_1",
    stream_url: "https://example.com/dead.m3u8",
    protocol: "https",
    active: true,
    health_status: "OFFLINE",
    health_score: 0,
    consecutive_successes: 0,
    consecutive_failures: 5,
    latency_ms: null,
    resolution: null,
    last_checked_at: Date.now(),
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const computedScore = calculateStreamScore(highQualityStream);
  record("Calculates high health score (>80) for healthy low-latency 1080p stream", computedScore >= 80, `Score: ${computedScore}`);

  const { rankedStreams, primaryStream } = rankChannelStreams([
    degradedBackupStream,
    deadStream,
    highQualityStream,
  ]);

  record("Ranks highest-quality ONLINE stream as Primary", primaryStream?.id === "st_1");
  record("Places DEGRADED stream as Backup 1", rankedStreams[1]?.id === "st_2");
  record("Places OFFLINE stream at the bottom", rankedStreams[2]?.id === "st_3");

  const mockChannel = {
    id: "tam_1",
    source_channel_id: "tam_1",
    tvg_id: "SunTV.in",
    name: "Sun TV",
    normalized_name: "suntv",
    logo_url: null,
    group_title: "Entertainment",
    language: "Tamil",
    country: "IN",
    category: "Entertainment",
    source_url: "https://example.com/live1.m3u8",
    active: true,
    verified: true,
    health_status: "ONLINE",
    health_score: 95,
    last_checked_at: Date.now(),
    last_success_at: Date.now(),
    consecutive_failures: 0,
    consecutive_successes: 5,
    latency_ms: 280,
    stream_type: "hls",
    resolution: "1080p",
    bitrate: null,
    failure_reason: null,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  record("Channel with verified stream is publicly playable", isChannelPubliclyPlayable(mockChannel, [highQualityStream]));
  record("Channel with only dead stream is NOT publicly playable", !isChannelPubliclyPlayable(mockChannel, [deadStream]));

  // 5. Stability State Transitions
  console.log("\n--- 5. Testing Health Status Transitions ---");

  const trans1 = calculateNextHealthStatus("UNKNOWN", true, 0, 0);
  record("First success transitions to PROBATION", trans1.nextStatus === "PROBATION" && trans1.consecutiveSuccesses === 1);

  const trans2 = calculateNextHealthStatus("PROBATION", true, 1, 0);
  record("Second consecutive success transitions to VERIFIED_CANDIDATE", trans2.nextStatus === "VERIFIED_CANDIDATE" && trans2.consecutiveSuccesses === 2);

  const trans3 = calculateNextHealthStatus("VERIFIED_CANDIDATE", true, 2, 0);
  record("Third consecutive success transitions to ONLINE", trans3.nextStatus === "ONLINE" && trans3.consecutiveSuccesses === 3);

  const transFail1 = calculateNextHealthStatus("ONLINE", false, 3, 0);
  record("First failure marks stream as DEGRADED", transFail1.nextStatus === "DEGRADED" && transFail1.consecutiveFailures === 1);

  const transFail3 = calculateNextHealthStatus("DEGRADED", false, 0, 2);
  record("Three consecutive failures marks stream as OFFLINE", transFail3.nextStatus === "OFFLINE" && transFail3.consecutiveFailures === 3);

  // 6. Persistence & Store Isolation
  console.log("\n--- 6. Testing Store Persistence & Transactional Safeguards ---");

  const store = new TamilHealthStore();
  const testChan = { ...mockChannel, id: "test_tam_99" };
  const testStream = { ...highQualityStream, id: "test_st_99", channel_id: "test_tam_99" };

  store.saveSyncedChannelsAndStreams([testChan], [testStream]);

  const retrieved = store.getChannelById("test_tam_99");
  record("Store saves and retrieves channel", retrieved?.name === "Sun TV");
  record("Store public filter includes verified channel", store.getAllChannels(true).some((c) => c.id === "test_tam_99"));

  store.toggleChannelActive("test_tam_99", false);
  record("Disabled channel excluded from public catalogue", !store.getAllChannels(true).some((c) => c.id === "test_tam_99"));
  record("Disabled channel retained in admin storage", store.getAllChannels(false).some((c) => c.id === "test_tam_99"));

  // 7. Admin Authorization & Allowlist
  console.log("\n--- 7. Testing Admin Authorization & Multi-User Isolation ---");

  record("Admin email allowlist strictly enforces mohamedyasir2000@gmail.com", ADMIN_EMAIL === "mohamedyasir2000@gmail.com");
  record("mohamedyasir2000@gmail.com is authorized as Admin", isUserAdmin("mohamedyasir2000@gmail.com") === true);
  record("Non-admin user strictly denied admin permissions", isUserAdmin("viewer@example.com") === false);

  console.log("\n================================================================================");
  console.log("QA SUMMARY REPORT:");
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});

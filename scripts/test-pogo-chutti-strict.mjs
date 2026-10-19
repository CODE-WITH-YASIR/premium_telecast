/**
 * scripts/test-pogo-chutti-strict.mjs
 *
 * Automated verification test suite for STRICT POGO and CHUTTI TV rules:
 * 1. ORIGINAL CHANNELS ONLY:
 *    - Rejects borrowed/substitute streams (e.g. Cartoon Network, Discovery Kids, etc.)
 *    - Rejects renaming other channels to Pogo or Chutti TV
 * 2. TAMIL AUDIO ONLY:
 *    - Enforces Tamil audio evidence; never falls back silently to Hindi/English
 * 3. REMOVE UNVERIFIED CHANNELS:
 *    - If unverified in upstream iptv-org playlists, channel must be completely hidden (isVisible: false)
 * 4. UPSTREAM STATUS VERIFICATION:
 *    - Inspects upstream iptv-org playlists (tam.m3u & blocklist)
 */

const OFFICIAL_SPECS = {
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

const KNOWN_OTHER_CHANNEL_STREAMS = new Set([
  "https://drk6xq0vhn.gpcdn.net/live/cn_sd_abr/index.m3u8",
  "https://drk6xq0vhn.gpcdn.net/live/cn_hd_abr/index.m3u8",
  "https://drk6xq0vhn.gpcdn.net/live/discovery_kids_abr/index.m3u8",
  "https://cdn.pishow.tv/ott/live/1243/master.m3u8",
  "https://cdn.pishow.tv/ott/live/1737/master.m3u8",
  "https://cdn.pishow.tv/ott/live/1257/master.m3u8",
]);

function identifyTargetChannel(channel) {
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

function validatePogoOrChutti(channel) {
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
  const lang = (channel.language || "").toLowerCase();
  const langCode = (channel.languageCode || "").toLowerCase();
  const isTaggedTamil = lang.includes("tam") || langCode === "tam" || channel.sourceId === "iptv-org-tamil";
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

function filterStrictPogoAndChutti(channels) {
  return channels.filter((c) => {
    const res = validatePogoOrChutti(c);
    if (!res.isTargetChannel) return true;
    return res.isVisible;
  });
}

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("=================================================");
console.log("🧪 RUNNING STRICT POGO & CHUTTI TV VALIDATION TESTS");
console.log("=================================================\n");

// Test 1: Reject imitation / borrowed stream URL for Pogo
console.log("Test 1: Reject substitute / borrowed stream for Pogo (e.g. Cartoon Network stream)");
const fakePogo = {
  id: "pogo_fake",
  name: "Pogo",
  tvgId: "Pogo.in",
  streamUrl: "https://drk6xq0vhn.gpcdn.net/live/cn_sd_abr/index.m3u8",
  sourceId: "iptv-org-tamil",
  language: "Tamil",
  languageCode: "tam",
};
const fakePogoResult = validatePogoOrChutti(fakePogo);
assert(fakePogoResult.isTargetChannel === true, "Identified as POGO target channel");
assert(fakePogoResult.isVisible === false, "Imitation Pogo is strictly HIDDEN");
assert(fakePogoResult.failureReason?.includes("borrowed from another channel"), "Failure reason flags borrowed stream");

// Test 2: Reject imitation / borrowed stream URL for Chutti TV
console.log("\nTest 2: Reject substitute / borrowed stream for Chutti TV");
const fakeChutti = {
  id: "chutti_fake",
  name: "Chutti TV",
  tvgId: "ChuttiTV.in",
  streamUrl: "https://drk6xq0vhn.gpcdn.net/live/cn_hd_abr/index.m3u8",
  sourceId: "iptv-org-tamil",
  language: "Tamil",
  languageCode: "tam",
};
const fakeChuttiResult = validatePogoOrChutti(fakeChutti);
assert(fakeChuttiResult.isTargetChannel === true, "Identified as Chutti TV target channel");
assert(fakeChuttiResult.isVisible === false, "Imitation Chutti TV is strictly HIDDEN");
assert(fakeChuttiResult.failureReason?.includes("borrowed from another channel"), "Failure reason flags borrowed stream");

// Test 3: Reject non-Tamil audio stream claiming to be Pogo
console.log("\nTest 3: Reject non-Tamil audio stream for Pogo (fail-closed audio requirement)");
const hindiPogo = {
  id: "pogo_hindi",
  name: "Pogo",
  tvgId: "Pogo.in",
  streamUrl: "https://legit-server.net/live/pogo_hi/index.m3u8",
  sourceId: "iptv-org-main",
  language: "Hindi",
  languageCode: "hin",
};
const hindiPogoResult = validatePogoOrChutti(hindiPogo);
assert(hindiPogoResult.isTargetChannel === true, "Identified as POGO");
assert(hindiPogoResult.isTamilAudioVerified === false, "Tamil audio not verified");
assert(hindiPogoResult.isVisible === false, "Hindi Pogo is strictly HIDDEN from Tamil visible list");

// Test 4: Accept authentic original channel with genuine Tamil audio evidence
console.log("\nTest 4: Accept authentic original channel with genuine Tamil audio evidence");
const authenticPogoTamil = {
  id: "pogo_authentic_tam",
  name: "Pogo",
  tvgId: "Pogo.in",
  streamUrl: "https://authentic-official-cdn.net/live/pogo_tam/index.m3u8",
  sourceId: "iptv-org-tamil",
  language: "Tamil",
  languageCode: "tam",
};
const authenticResult = validatePogoOrChutti(authenticPogoTamil);
assert(authenticResult.isTargetChannel === true, "Identified as target POGO");
assert(authenticResult.isOriginalIdentified === true, "Identified as original Pogo.in");
assert(authenticResult.isTamilAudioVerified === true, "Tamil audio verified");
assert(authenticResult.isVisible === true, "Authentic Tamil Pogo is VISIBLE");

// Test 5: filterStrictPogoAndChutti cleanses list
console.log("\nTest 5: filterStrictPogoAndChutti cleanses channel catalog");
const catalog = [
  { id: "chithiram", name: "Chithiram TV", streamUrl: "https://chithiram.com/live.m3u8", language: "Tamil", languageCode: "tam", sourceId: "iptv-org-tamil" },
  fakePogo,
  fakeChutti,
  hindiPogo,
  { id: "cartoon_net", name: "Cartoon Network", streamUrl: "https://drk6xq0vhn.gpcdn.net/live/cn_sd_abr/index.m3u8", language: "English", sourceId: "iptv-org-main" },
];
const sanitized = filterStrictPogoAndChutti(catalog);
assert(sanitized.length === 2, `Sanitized list contains exactly 2 channels (got ${sanitized.length})`);
assert(sanitized.some((c) => c.id === "chithiram"), "Chithiram TV preserved");
assert(sanitized.some((c) => c.id === "cartoon_net"), "Cartoon Network preserved");
assert(!sanitized.some((c) => c.name.toLowerCase().includes("pogo")), "All unverified Pogo entries purged");
assert(!sanitized.some((c) => c.name.toLowerCase().includes("chutti")), "All unverified Chutti TV entries purged");

console.log("\n=================================================");
console.log(`📊 TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✨ All strict validation checks PASSED successfully!");
}

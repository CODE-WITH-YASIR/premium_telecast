/**
 * test-kids-selectors.mjs
 * Tests for the new Kids/Tamil-Kids selector logic and the expanded M3U category mapper.
 * Run with: node scripts/test-kids-selectors.mjs
 */

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Pure-JS port of the relevant logic (mirrors src/lib/iptv/selectors.ts)
// ---------------------------------------------------------------------------

const KIDS_KEYWORDS = [
  "pogo", "chutti", "cartoon network", "cartoon", "discovery kids",
  "sony yay", "sonyyay", "yay!", "nick", "nickelodeon", "nick jr",
  "sonic", "hungama", "disney junior", "disney channel", "disney",
  "boomerang", "toonami", "baby tv", "tiny pop", "cbbc", "cbeebies",
  "animax", "kix", "jeem", "jiimaan", "kids", "junior", "child",
  "chithiram", "bal bharat", "boing"
];

function isKidsChannel(channel) {
  const haystack = `${channel.name} ${channel.group ?? ""}`.toLowerCase();
  return KIDS_KEYWORDS.some((kw) => haystack.includes(kw));
}

function filterKidsChannels(channels) {
  return channels.filter(isKidsChannel);
}

const TAMIL_KIDS_CHANNEL_NAMES = [
  "chutti tv", "chutti", "pogo", "cartoon network", "discovery kids",
  "sony yay", "nick", "sonic", "hungama", "disney junior",
  "disney channel", "chithiram", "nick jr", "nickelodeon"
];

function filterTamilKidsChannels(channels) {
  return channels.filter((c) => {
    const isTamilLang =
      (c.language ?? "").toLowerCase().includes("tam") ||
      c.languageCode === "tam" ||
      c.sourceId === "iptv-org-tamil";
    const isKids = isKidsChannel(c);
    if (isTamilLang && isKids) return true;

    const lowerName = c.name.toLowerCase();
    return TAMIL_KIDS_CHANNEL_NAMES.some((n) => lowerName.includes(n));
  });
}

// Pure-JS port of normalizer.mapCategory for Kids
function mapCategoryKidsCheck(groupTitle, channelName) {
  const combined = `${groupTitle || ""} ${channelName || ""}`.toLowerCase();
  return (
    combined.includes("kid") ||
    combined.includes("chithiram") ||
    combined.includes("chutti") ||
    combined.includes("hungama") ||
    combined.includes("disney") ||
    combined.includes("bal bharat") ||
    combined.includes("cartoon") ||
    combined.includes("pogo") ||
    combined.includes("nick") ||
    combined.includes("sonic") ||
    combined.includes("discovery kids") ||
    combined.includes("sony yay") ||
    combined.includes("sonyyay") ||
    combined.includes("yay!") ||
    combined.includes("boomerang") ||
    combined.includes("toonami") ||
    combined.includes("baby tv") ||
    combined.includes("tiny pop") ||
    combined.includes("cbbc") ||
    combined.includes("cbeebies") ||
    combined.includes("jiimaan") ||
    combined.includes("jeem") ||
    combined.includes("kix") ||
    combined.includes("animax")
  );
}

// ---------------------------------------------------------------------------
// Test data (realistic but fake stream URLs, not from live services)
// ---------------------------------------------------------------------------

const MOCK_CHANNELS = [
  { id: "1", name: "POGO", group: "Kids", language: "Hindi", languageCode: undefined, sourceId: "iptv-org-kids", streamUrl: "https://example.com/pogo.m3u8" },
  { id: "2", name: "Chutti TV", group: "Tamil Kids", language: "Tamil", languageCode: "tam", sourceId: "iptv-org-tamil", streamUrl: "https://example.com/chutti.m3u8" },
  { id: "3", name: "Cartoon Network", group: "Kids", language: undefined, languageCode: undefined, sourceId: "iptv-org-kids", streamUrl: "https://example.com/cn.m3u8" },
  { id: "4", name: "Discovery Kids", group: "Kids", language: "Hindi", languageCode: undefined, sourceId: "iptv-org-kids", streamUrl: "https://example.com/dkids.m3u8" },
  { id: "5", name: "Sony YAY!", group: "Kids", language: undefined, languageCode: undefined, sourceId: "iptv-org-index", streamUrl: "https://example.com/yay.m3u8" },
  { id: "6", name: "Nick Junior", group: "Kids", language: "English", languageCode: "eng", sourceId: "iptv-org-kids", streamUrl: "https://example.com/nickjr.m3u8" },
  { id: "7", name: "Sonic Channel", group: "Kids", language: undefined, languageCode: undefined, sourceId: "iptv-org-index", streamUrl: "https://example.com/sonic.m3u8" },
  { id: "8", name: "Hungama TV", group: "Entertainment", language: "Hindi", languageCode: undefined, sourceId: "iptv-org-index", streamUrl: "https://example.com/hungama.m3u8" },
  { id: "9", name: "Sun News", group: "News", language: "Tamil", languageCode: "tam", sourceId: "iptv-org-tamil", streamUrl: "https://example.com/sunnews.m3u8" },
  { id: "10", name: "Vijay TV", group: "Entertainment", language: "Tamil", languageCode: "tam", sourceId: "iptv-org-tamil", streamUrl: "https://example.com/vijay.m3u8" },
  { id: "11", name: "Nickelodeon India", group: "Kids", language: "Hindi", languageCode: undefined, sourceId: "iptv-org-kids", streamUrl: "https://example.com/nick.m3u8" },
  { id: "12", name: "BBC World News", group: "News", language: "English", languageCode: "eng", sourceId: "iptv-org-index", streamUrl: "https://example.com/bbc.m3u8" },
  { id: "13", name: "Disney Junior India", group: "Kids", language: "Hindi", languageCode: undefined, sourceId: "iptv-org-kids", streamUrl: "https://example.com/disneyjr.m3u8" },
  { id: "14", name: "Chithiram TV", group: "Tamil Entertainment", language: "Tamil", languageCode: "tam", sourceId: "iptv-org-tamil", streamUrl: "https://example.com/chithiram.m3u8" },
];

// ---------------------------------------------------------------------------
// Test Suite 1: isKidsChannel detection
// ---------------------------------------------------------------------------
console.log("\n--- Test Suite 1: isKidsChannel() ---");

assert(isKidsChannel({ name: "POGO", group: "Kids" }), "POGO detected as kids");
assert(isKidsChannel({ name: "Chutti TV", group: "Tamil" }), "Chutti TV detected as kids");
assert(isKidsChannel({ name: "Cartoon Network", group: "Entertainment" }), "Cartoon Network detected as kids");
assert(isKidsChannel({ name: "Sony YAY!", group: "Entertainment" }), "Sony YAY! detected as kids");
assert(isKidsChannel({ name: "Nickelodeon", group: "" }), "Nickelodeon detected as kids");
assert(isKidsChannel({ name: "Nick Jr", group: "" }), "Nick Jr detected as kids");
assert(isKidsChannel({ name: "Sonic Channel", group: "" }), "Sonic Channel detected as kids");
assert(isKidsChannel({ name: "Hungama TV", group: "Entertainment" }), "Hungama TV detected as kids");
assert(isKidsChannel({ name: "Disney Junior", group: "Family" }), "Disney Junior detected as kids");
assert(isKidsChannel({ name: "Chithiram TV", group: "Tamil" }), "Chithiram TV detected as kids");
assert(!isKidsChannel({ name: "Sun News", group: "News" }), "Sun News NOT detected as kids");
assert(!isKidsChannel({ name: "BBC World", group: "News" }), "BBC World NOT detected as kids");
assert(!isKidsChannel({ name: "Vijay TV", group: "Entertainment" }), "Vijay TV NOT detected as kids");

// ---------------------------------------------------------------------------
// Test Suite 2: filterKidsChannels
// ---------------------------------------------------------------------------
console.log("\n--- Test Suite 2: filterKidsChannels() ---");

const kidsResult = filterKidsChannels(MOCK_CHANNELS);
assert(kidsResult.length > 0, "filterKidsChannels returns non-empty result");
assert(kidsResult.some(c => c.name === "POGO"), "POGO included in kids");
assert(kidsResult.some(c => c.name === "Chutti TV"), "Chutti TV included in kids");
assert(kidsResult.some(c => c.name === "Cartoon Network"), "Cartoon Network included in kids");
assert(kidsResult.some(c => c.name === "Discovery Kids"), "Discovery Kids included in kids");
assert(kidsResult.some(c => c.name === "Sony YAY!"), "Sony YAY! included in kids");
assert(kidsResult.some(c => c.name === "Hungama TV"), "Hungama TV included in kids");
assert(kidsResult.some(c => c.name === "Chithiram TV"), "Chithiram TV included in kids");
assert(!kidsResult.some(c => c.name === "Sun News"), "Sun News excluded from kids");
assert(!kidsResult.some(c => c.name === "BBC World News"), "BBC World excluded from kids");

// ---------------------------------------------------------------------------
// Test Suite 3: filterTamilKidsChannels
// ---------------------------------------------------------------------------
console.log("\n--- Test Suite 3: filterTamilKidsChannels() ---");

const tamilKidsResult = filterTamilKidsChannels(MOCK_CHANNELS);
assert(tamilKidsResult.length > 0, "filterTamilKidsChannels returns non-empty result");
assert(tamilKidsResult.some(c => c.name === "Chutti TV"), "Chutti TV (Tamil-tagged) in Tamil Kids");
assert(tamilKidsResult.some(c => c.name === "Chithiram TV"), "Chithiram TV in Tamil Kids");
// POGO: tagged as from iptv-org-kids source, not Tamil language, but name matches TAMIL_KIDS_CHANNEL_NAMES
assert(tamilKidsResult.some(c => c.name === "POGO"), "POGO included via channel name match");
assert(tamilKidsResult.some(c => c.name === "Cartoon Network"), "Cartoon Network in Tamil Kids via name match");
// Non-kids Tamil channels should NOT appear
assert(!tamilKidsResult.some(c => c.name === "Sun News"), "Sun News (Tamil news) excluded from Tamil Kids");
assert(!tamilKidsResult.some(c => c.name === "Vijay TV"), "Vijay TV excluded from Tamil Kids");
// Non-Tamil, non-kids channels should be excluded
assert(!tamilKidsResult.some(c => c.name === "BBC World News"), "BBC World excluded from Tamil Kids");

// ---------------------------------------------------------------------------
// Test Suite 4: mapCategory Kids detection
// ---------------------------------------------------------------------------
console.log("\n--- Test Suite 4: mapCategory Kids signal ---");

assert(mapCategoryKidsCheck("Kids", "POGO"), "POGO+Kids group -> Kids");
assert(mapCategoryKidsCheck("", "Chutti TV"), "Chutti TV name -> Kids");
assert(mapCategoryKidsCheck("Children", "Cartoon Network"), "Children group -> Kids");
assert(mapCategoryKidsCheck("", "Nickelodeon"), "Nickelodeon -> Kids");
assert(mapCategoryKidsCheck("", "Nick Junior"), "Nick Junior -> Kids");
assert(mapCategoryKidsCheck("", "Sony YAY"), "Sony YAY -> Kids");
assert(mapCategoryKidsCheck("", "Sony YAY!"), "Sony YAY! -> Kids");
assert(mapCategoryKidsCheck("", "Discovery Kids"), "Discovery Kids -> Kids");
assert(mapCategoryKidsCheck("", "Hungama"), "Hungama -> Kids");
assert(mapCategoryKidsCheck("", "Sonic Channel"), "Sonic -> Kids");
assert(mapCategoryKidsCheck("", "Disney Junior"), "Disney Junior -> Kids");
assert(mapCategoryKidsCheck("", "Cartoon Network"), "Cartoon Network -> Kids");
assert(!mapCategoryKidsCheck("News", "Sun TV"), "Sun TV News -> NOT Kids");
assert(!mapCategoryKidsCheck("Entertainment", "Vijay TV"), "Vijay Entertainment -> NOT Kids");

// ---------------------------------------------------------------------------
// Test Suite 5: M3U Parser basics (inline)
// ---------------------------------------------------------------------------
console.log("\n--- Test Suite 5: M3U parser basics ---");

function parseM3U(raw, sourceId) {
  const channels = [];
  let skippedEntries = 0;
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n");
  const seenKeys = new Set();
  let pendingExtinf = null;

  function extractAttr(line, attr) {
    const m = new RegExp(`${attr}="([^"]*)"`, "i").exec(line);
    return m?.[1]?.trim() || undefined;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.startsWith("#EXTM3U")) continue;
    if (line.startsWith("#EXTINF")) { pendingExtinf = line; continue; }
    if (line.startsWith("#")) continue;
    if (!pendingExtinf) { skippedEntries++; continue; }

    const streamUrl = line;
    const extinf = pendingExtinf;
    pendingExtinf = null;

    try { const u = new URL(streamUrl); if (u.protocol !== "http:" && u.protocol !== "https:") { skippedEntries++; continue; } } catch { skippedEntries++; continue; }

    const lastComma = extinf.lastIndexOf(",");
    const name = (lastComma !== -1 ? extinf.slice(lastComma + 1).trim() : "") || extractAttr(extinf, "tvg-name") || "";
    if (!name) { skippedEntries++; continue; }

    const dedupeKey = streamUrl.toLowerCase();
    if (seenKeys.has(dedupeKey)) { skippedEntries++; continue; }
    seenKeys.add(dedupeKey);

    channels.push({
      id: `id_${channels.length}`,
      name,
      streamUrl,
      logo: extractAttr(extinf, "tvg-logo"),
      group: extractAttr(extinf, "group-title"),
      language: extractAttr(extinf, "tvg-language"),
      languageCode: extractAttr(extinf, "tvg-language")?.length === 3 ? extractAttr(extinf, "tvg-language") : undefined,
      sourceId,
    });
  }

  return { channels, skippedEntries };
}

const SAMPLE_M3U = `#EXTM3U
#EXTINF:-1 tvg-id="ChuttiTV.in" tvg-name="Chutti TV" tvg-logo="https://example.com/chutti.png" tvg-language="tam" group-title="Tamil Kids",Chutti TV
https://example.com/chutti.m3u8
#EXTINF:-1 tvg-id="POGO.in" tvg-name="POGO" tvg-logo="https://example.com/pogo.png" tvg-language="hin" group-title="Kids",POGO
https://example.com/pogo.m3u8
#EXTINF:-1 tvg-name="Invalid No URL"
not_a_url
#EXTINF:-1 tvg-name="POGO Duplicate"
https://example.com/pogo.m3u8
#EXTINF:-1 tvg-name="Missing Name Channel"
https://example.com/missing.m3u8
`;

// Override: last entry in sample has no name in EXTINF line, so it should be skipped
// Actually it has a tvg-name, so it will appear. Let's add a no-name test:
const SAMPLE_M3U2 = `#EXTM3U
#EXTINF:-1 group-title="Kids",
https://example.com/noname.m3u8
`;

const { channels: parsed, skippedEntries } = parseM3U(SAMPLE_M3U, "test");
// SAMPLE_M3U has: Chutti TV (valid), POGO (valid), invalid-URL entry (skipped),
// POGO duplicate URL (skipped), "Missing Name Channel" with tvg-name (valid -> 3 total)
assert(parsed.length === 3, `Parser produces 3 unique valid channels (got ${parsed.length})`);
assert(skippedEntries >= 2, `Parser skips invalid/duplicate entries (skipped: ${skippedEntries})`);
assert(parsed[0].name === "Chutti TV", "First channel is Chutti TV");
assert(parsed[0].language === "tam", "Chutti TV has language=tam");
assert(parsed[0].group === "Tamil Kids", "Chutti TV group=Tamil Kids");
assert(parsed[1].name === "POGO", "Second channel is POGO");

const { channels: parsed2 } = parseM3U(SAMPLE_M3U2, "test");
assert(parsed2.length === 0, "Channel with empty display name is skipped");

// ---------------------------------------------------------------------------
// Test Suite 6: Deduplication across sources
// ---------------------------------------------------------------------------
console.log("\n--- Test Suite 6: Cross-source deduplication ---");

function mergeChannels(sourceResults) {
  const seen = new Set();
  const channels = [];
  for (const { channels: src } of sourceResults) {
    for (const ch of src) {
      const key = ch.streamUrl.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      channels.push(ch);
    }
  }
  return channels;
}

const sourceA = [
  { id: "1", name: "POGO", streamUrl: "https://example.com/pogo.m3u8", sourceId: "iptv-org-index" },
];
const sourceB = [
  { id: "2", name: "POGO", streamUrl: "https://example.com/pogo.m3u8", sourceId: "iptv-org-kids" },
  { id: "3", name: "Chutti TV", streamUrl: "https://example.com/chutti.m3u8", sourceId: "iptv-org-tamil" },
];

const merged = mergeChannels([{ channels: sourceA }, { channels: sourceB }]);
assert(merged.length === 2, `Dedup: 2 unique channels from 3 entries (got ${merged.length})`);
assert(merged[0].name === "POGO" && merged[0].sourceId === "iptv-org-index", "First-seen source wins dedup");
assert(merged[1].name === "Chutti TV", "Non-duplicate Chutti TV preserved");

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error("Some tests FAILED.");
  process.exit(1);
} else {
  console.log("All tests PASSED ✅");
}

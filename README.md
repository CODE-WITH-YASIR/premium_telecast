# Premium Live TV

A premium, dark-first IPTV streaming web app built on Next.js 15 (App Router)
+ TypeScript (strict) + Tailwind CSS + HLS.js. Uses real, configurable M3U
playlist sources — no mock channels, no fake EPG, no invented metadata
anywhere in the codebase.

## Getting started

```bash
npm install
npm run dev
```

Open **http://localhost:3000**.

To open from another device on your LAN (e.g. `http://10.15.105.3:3000`),
set `DEV_LAN_ORIGIN=10.15.105.3` in a `.env.local` file first — otherwise
Next.js's dev-mode origin check blocks the HMR websocket. See `.env.example`.

## Validation commands

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run start
```

## Configuring your IPTV source

By default the app uses iptv-org's public playlist
(`https://iptv-org.github.io/iptv/index.m3u`). To point it at different or
multiple sources, set `IPTV_PLAYLIST_SOURCES` (server-only, **not**
`NEXT_PUBLIC_`) in `.env.local` — see `.env.example` for the exact format.
Every configured source is fetched in parallel with its own timeout; one
source failing never drops channels successfully loaded from another
(`src/lib/iptv/service.ts`).

## Architecture

```
M3U source(s) (lib/iptv/config.ts)
  -> fetch + timeout + AbortController (lib/iptv/service.ts)
  -> parse (lib/iptv/parser.ts)               — Unicode-safe, fault-tolerant
  -> normalize + dedupe + sort (service.ts)
  -> SERVER-SIDE cache, TTL + in-flight dedupe (lib/iptv/serverCache.ts)
     — the playlist is fetched from the upstream IPTV provider AT MOST once
     per cache window, no matter how many browser clients are connected
  -> API routes (app/api/channels, /languages, /countries, /categories, /health)
     — CDN/browser-cacheable JSON, rate-limited per IP
  -> client store (lib/iptv/store.ts) — calls /api/channels, never the raw
     playlist URL; browser-side cache + 60s visibility-aware polling +
     in-flight dedupe; never wipes good data on a failed refresh
  -> hooks (hooks/useChannels.ts, useChannel.ts) — every page/component reads
     the same snapshot; only one request is ever in flight per browser tab
  -> pages/components
```

This two-layer cache (server-side playlist cache + client-side API-response
cache) is what keeps ~1000 concurrent users from turning into ~1000 separate
downloads of the upstream M3U playlist — see "Scalability" below.

Channel IDs are generated deterministically from the stream URL + name via
an FNV-1a-based hash (`lib/iptv/id.ts`) — **not** `btoa()`, which throws on
any channel name containing non-Latin1 characters (Tamil, Hindi, Arabic,
Chinese, emoji, etc.). The same input always produces the same id, so ids
stay stable across refreshes and are safe to use as React keys and route
params.

## Filters (language / country / category)

`/live` combines search + category + country + language as AND conditions
in a single memoized pass (`src/app/live/page.tsx`). Selected filters are
synced to the URL query string (`?q=&category=&country=&language=`), so a
page refresh, browser back/forward, or a shared link all preserve the active
filters instead of silently resetting them. The header shows the *filtered*
count (with the total alongside it when a filter is active) so it's visibly
obvious a filter is actually narrowing the list.

**Data reality worth knowing**: `language`/`country` come from the M3U's
`tvg-language`/`tvg-country` attributes. Many public IPTV playlists —
including iptv-org's global `index.m3u` — set these sparsely or not at all
for large portions of the list. If a language/country filter looks like
it's "not working" because selecting it barely changes anything, check
first whether the underlying channels actually carry that attribute in the
source playlist; the filtering logic itself doesn't fabricate or guess at
missing metadata (per the no-fake-data requirement), so a channel with no
`tvg-language` value simply won't match any language filter, correctly.

## Scalability (~1000 concurrent users)

**What this codebase does:**
- The upstream M3U playlist is fetched **server-side only**, cached with a
  TTL, and deduplicated across concurrent requests (`lib/iptv/serverCache.ts`).
  Browsers never fetch the raw playlist URL directly — they call
  `/api/channels`, which is itself CDN/browser-cacheable
  (`Cache-Control: s-maxage=30, stale-while-revalidate=300`).
- API routes are rate-limited per IP (`lib/rateLimit.ts`) to protect against
  abuse without blocking normal usage.
- Video playback connects directly from the browser to the IPTV provider's
  stream URL — the Next.js server is never in the video data path, so it
  cannot become a bandwidth bottleneck for playback.
- Channel rendering is windowed (`components/channel/ChannelGrid.tsx`) so a
  10,000-channel playlist doesn't mount 10,000 DOM nodes at once; `ChannelCard`
  is memoized against the fields it actually renders (not object identity,
  since a poll refresh produces new object references for unchanged data).

**What this does NOT guarantee, and why:**
- The server-side cache (`serverCache.ts`) and rate limiter (`rateLimit.ts`)
  are both **in-memory, per-process**. On a single long-running Node.js
  instance this is exactly the intended behavior. On a multi-instance or
  serverless/edge deployment, each instance holds its own cache and its own
  rate-limit counters — real load reduction vs. per-client fetching, but not
  one single shared cache/limit. Scaling to genuinely many server instances
  behind a load balancer would need a shared store (Redis is the natural
  choice) — both modules are written with a narrow, swappable interface
  (`get`/`refresh` and `checkRateLimit`) specifically so that swap doesn't
  require touching any calling code.
- Actual video bandwidth at 1000 concurrent viewers is governed entirely by
  the upstream IPTV provider's own capacity, not by anything in this
  codebase — this app never proxies stream bytes.
- None of this was load-tested (no network access in the environment this
  was built in — see the validation section below). This is an honest
  architecture description, not a benchmark result.

## EPG / Program Guide

No XMLTV/EPG source is wired up in this build — none was provided, and per
the project's no-fake-data requirement, no program schedule is invented.
`/guide` and the channel detail page both say so plainly ("Program
information unavailable") rather than showing fabricated program titles,
times, or durations. To add real EPG: set `NEXT_PUBLIC_EPG_URL` to an XMLTV
feed and extend `lib/iptv/` with an XMLTV parser — the guide page already has
the conditional branch ready for it.

---

## Honest validation status (read this before trusting "done")

This project was written file-by-file in a sandboxed environment with **no
outbound network access** — `npm install` fails here with
`403 host_not_allowed` against `registry.npmjs.org`, and the same restriction
blocks fetching any live M3U playlist. Concretely, in this environment I
could **not** run:

- `npm install` (blocked — no dependencies could be installed)
- `npm run lint` (requires installed eslint-config-next)
- `npm run build` / `npm run start` (requires the Next.js compiler)
- `npm run dev` + real route/browser testing
- A live fetch of any real IPTV playlist (network blocked)

What I *could* and did verify here:
- Every `.ts`/`.tsx` file was checked with a standalone TypeScript compiler
  (globally available in this sandbox, independent of this project's
  `node_modules`) in a permissive mode, to catch syntax errors and obvious
  type mistakes. This is not a substitute for a real `tsc --noEmit` against
  the project's own dependency versions — one genuine issue it caught
  (an unimported `React.ReactNode` reference) has been fixed.
- The file tree, imports, and component wiring were reviewed by hand for
  consistency (matching prop names, correct relative import paths, etc).

**What this means for you:** run the validation commands above yourself
after `npm install`. I expect the project to build and run correctly based
on careful, deliberate construction against the documented Next.js 15 /
React 19 / Tailwind 3 APIs — but "I expect" is not the same as "I verified,"
and I want to be direct about that distinction rather than claim a build/lint
pass I never actually ran. If `npm run build` surfaces an issue, most likely
candidates are a version mismatch in `package.json` (dependency versions
drift over time) or a Tailwind class name typo — both are quick fixes.

Also note: HLS playback itself (`components/player/VideoPlayer.tsx`) is
wired correctly against the hls.js API and native-HLS fallback, but actually
*playing* a real stream in a real browser could not be tested here — no
browser, no network. Test this against a real channel once running locally.

This round added one new dependency: `server-only` (a tiny package that
throws a build-time error if a server-only module is accidentally imported
into a client bundle — used to guard `serverCache.ts` and `rateLimit.ts`).
No existing dependency versions were changed or downgraded. The new
`/api/*` routes were sanity-checked by hand for correct Next.js 15 Route
Handler conventions (`NextResponse.json`, `export const dynamic`) but, like
everything else, could not be hit with a real HTTP request in this sandbox.

---

## Tamil Live TV — Smart Stream Health Engine

The application includes a dedicated, isolated stream health ingestion and verification pipeline for Tamil channels based specifically on `https://iptv-org.github.io/iptv/languages/tam.m3u`.

### Pipeline Overview
```
SOURCE PLAYLIST (tam.m3u)
  ↓
SERVER-SIDE FETCH (configurable sync interval, default 3h)
  ↓
FAULT-TOLERANT M3U PARSE (Unicode Tamil, EXTINF tags, resolution detection)
  ↓
NORMALIZE & CATEGORIZE (News, Entertainment, Movies, Music, Religious, Kids, Sports)
  ↓
DEDUPLICATE & GROUP (Strong tvg-id identifier, multi-stream failover binding)
  ↓
4-STAGE HEALTH CHECK PROBE:
  - Level 1: SSRF & URL Connectivity Check (private IP blocking, HTTP status)
  - Level 2: HLS / M3U8 Manifest & Segment Validation (EXTM3U, segment extraction)
  - Level 3: Lightweight Playability Probe (0x47 TS sync / MP4 box verification)
  - Level 4: Consecutive Stability Transitions (Probation → Verified Candidate → Online)
  ↓
COMPOSITE HEALTH & QUALITY SCORING (Availability, Latency, Stability, Resolution, Recency)
  ↓
TRANSACTIONAL PERSISTENCE (Preserves historical stats & previous verified streams on transient failure)
  ↓
SERVE ONLY VERIFIED HEALTHY CHANNELS TO USERS (/tamil & /api/tamil/channels)
```

### Dedicated Routes & UI
- **Tamil Live TV Hub**: `/tamil` (Hero banner, instant debounced search, category pills, live health telemetry).
- **Tamil Channel Detail Player**: `/tamil/[id]` (16:9 cinematic player with automatic multi-stream failover, user favorites, and watch history).
- **Language Route Integration**: `/language/tam` and `/language/tamil` automatically connect to verified streams.
- **Admin Console**: `/admin` (Metrics overview: Source channels, Verified count, Degraded count, Offline count, Availability %, Avg Latency, manual sync/scan triggers, and diagnostics modal).

### Environment Configuration
```env
# Tamil Source Playlist Configuration
TAMIL_IPTV_SOURCE_URL=https://iptv-org.github.io/iptv/languages/tam.m3u
TAMIL_PLAYLIST_SYNC_INTERVAL_HOURS=3
HEALTH_CHECK_CONCURRENCY=5
TAMIL_CONNECT_TIMEOUT_MS=5000
TAMIL_READ_TIMEOUT_MS=10000
```

### Available Scripts
- `npm run test:tamil`: Runs the full unit, integration, SSRF, normalizer, and scoring test suite.
- `npm run sync:tamil`: Runs real upstream synchronization against `tam.m3u` and outputs the critical acceptance audit report.


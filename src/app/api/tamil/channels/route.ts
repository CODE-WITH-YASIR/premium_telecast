import { NextResponse } from "next/server";
import { getCachedTamilChannels } from "@/lib/tamil/cache";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const rate = checkRateLimit(getClientKey(request), { limit: 120, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";
  const query = url.searchParams.get("q")?.toLowerCase().trim() || "";
  const category = url.searchParams.get("category")?.toLowerCase().trim() || "";

  try {
    const snapshot = await getCachedTamilChannels({ force });

    let filtered = snapshot.channels;

    if (query) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.normalized_name.includes(query) ||
          (c.group_title && c.group_title.toLowerCase().includes(query)) ||
          c.category.toLowerCase().includes(query)
      );
    }

    if (category && category !== "all") {
      filtered = filtered.filter((c) => c.category.toLowerCase() === category);
    }

    return NextResponse.json(
      {
        channels: filtered,
        total: filtered.length,
        verifiedCount: snapshot.stats.verified_channels,
        lastUpdated: snapshot.stats.last_health_scan_at || snapshot.stats.last_sync_at,
        stats: {
          lastChecked: snapshot.stats.last_health_scan_at,
          availabilityRate: snapshot.stats.availability_rate,
          averageLatencyMs: snapshot.stats.average_latency_ms,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[/api/tamil/channels] error:", err);
    return NextResponse.json(
      { error: "Failed to load Tamil channels catalogue." },
      { status: 500 }
    );
  }
}

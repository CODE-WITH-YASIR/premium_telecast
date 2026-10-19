import { NextResponse } from "next/server";
import { getCachedChannels } from "@/lib/iptv/serverCache";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";
import { filterStrictPogoAndChutti } from "@/lib/iptv/pogoChuttiValidator";

export const dynamic = "force-dynamic"; // response body depends on server-side cache state, not build-time data
export const revalidate = 0; // we manage freshness ourselves via serverCache's own TTL

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

  try {
    const result = await getCachedChannels({ force });

    if (result.totalFailure) {
      // Every upstream source failed and we have no prior cached data at all
      // (serverCache already falls back to cached data when it exists).
      return NextResponse.json(
        {
          channels: [],
          lastUpdated: null,
          error: "Unable to reach any configured IPTV playlist source.",
          sourceResults: result.sourceResults,
        },
        { status: 503 }
      );
    }

    let customChannelsList: Array<{
      id: string;
      name: string;
      streamUrl: string;
      logo?: string;
      group?: string;
      country?: string;
      language?: string;
      sourceId: string;
    }> = [];
    try {
      const { customChannelsService } = await import("@/lib/iptv/customChannels");
      const customs = customChannelsService.getAll(true);
      customChannelsList = customs.map((c) => ({
        id: c.id,
        name: c.name,
        streamUrl: c.stream_url,
        logo: c.logo,
        group: c.category || "Custom",
        country: c.country || "US",
        language: c.language || "English",
        sourceId: "custom",
      }));
    } catch (e) {
      console.warn("Could not load custom channels:", e);
    }

    const mergedChannels = [...customChannelsList, ...result.channels];
    const sanitizedChannels = filterStrictPogoAndChutti(mergedChannels);

    return NextResponse.json(
      {
        channels: sanitizedChannels,
        lastUpdated: result.fetchedAt,
        sourceResults: result.sourceResults,
        error: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[/api/channels] unexpected error:", err);
    return NextResponse.json(
      { channels: [], lastUpdated: null, error: "Internal server error.", sourceResults: [] },
      { status: 500 }
    );
  }
}

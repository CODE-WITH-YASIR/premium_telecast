import { NextResponse } from "next/server";
import { getCachedChannels } from "@/lib/iptv/serverCache";
import { getCategories } from "@/lib/iptv/selectors";
import { checkRateLimit, getClientKey } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rate = checkRateLimit(getClientKey(request), { limit: 120, windowMs: 60_000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const result = await getCachedChannels();
  return NextResponse.json(
    { categories: getCategories(result.channels) },
    { status: 200, headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
  );
}

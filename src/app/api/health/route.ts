import { NextResponse } from "next/server";
import { getCacheStatus } from "@/lib/iptv/serverCache";

export const dynamic = "force-dynamic";

export async function GET() {
  // Deliberately does not call getCachedChannels() — a health check must
  // stay fast and cheap even if the upstream IPTV provider is slow or down.
  // It reports whatever the cache currently holds, not a fresh fetch.
  const cache = getCacheStatus();
  return NextResponse.json(
    {
      status: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      cache,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}

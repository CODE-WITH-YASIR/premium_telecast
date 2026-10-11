import { NextResponse } from "next/server";
import { tamilStore } from "@/lib/tamil/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    const streams = tamilStore.getAllStreams();
    const channels = tamilStore.getAllChannels(false);
    const channelMap = new Map(channels.map((c) => [c.id, c]));

    const failedStreams = streams
      .filter((s) => s.health_status === "OFFLINE" || s.health_status === "DEGRADED")
      .map((s) => ({
        stream: s,
        channel: channelMap.get(s.channel_id) || null,
        checks: tamilStore.getHealthChecks(s.id, 5),
      }));

    // Group failure counts by reason
    const failureBreakdown: Record<string, number> = {};
    for (const fs of failedStreams) {
      const reason = fs.stream.failure_reason || "UNKNOWN";
      failureBreakdown[reason] = (failureBreakdown[reason] || 0) + 1;
    }

    return NextResponse.json({
      failedStreams,
      failureBreakdown,
      totalFailed: failedStreams.length,
    });
  } catch (err) {
    console.error("[/api/admin/tamil/failed] error:", err);
    return NextResponse.json({ error: "Failed to retrieve failed stream diagnostics" }, { status: 500 });
  }
}


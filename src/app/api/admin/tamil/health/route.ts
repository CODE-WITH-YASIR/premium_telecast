import { NextResponse } from "next/server";
import { tamilStore } from "@/lib/tamil/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  try {
    const stats = tamilStore.getSyncStats();
    const channels = tamilStore.getAllChannels(false); // all channels including offline
    const streams = tamilStore.getAllStreams();
    const recentChecks = tamilStore.getHealthChecks(undefined, 30);

    return NextResponse.json({
      stats,
      channels,
      streams,
      recentChecks,
    });
  } catch (err) {
    console.error("[/api/admin/tamil/health] error:", err);
    return NextResponse.json({ error: "Failed to retrieve health dashboard data" }, { status: 500 });
  }
}


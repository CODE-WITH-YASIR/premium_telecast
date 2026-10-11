import { NextResponse } from "next/server";
import { tamilStore } from "@/lib/tamil/store";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const channel = tamilStore.getChannelById(id);

    if (!channel) {
      return NextResponse.json({ error: "Tamil channel not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: channel.id,
      name: channel.name,
      verified: channel.verified,
      health_status: channel.health_status,
      health_score: channel.health_score,
      latency_ms: channel.latency_ms,
      last_checked_at: channel.last_checked_at,
      last_success_at: channel.last_success_at,
      resolution: channel.resolution,
    });
  } catch (err) {
    console.error("[/api/tamil/channels/:id/health] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

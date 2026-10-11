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

    const streams = tamilStore.getStreamsForChannel(id);

    return NextResponse.json({
      channelId: id,
      primaryStreamId: channel.primary_stream_id,
      streams: streams.map((s) => ({
        id: s.id,
        stream_url: s.stream_url,
        protocol: s.protocol,
        health_status: s.health_status,
        health_score: s.health_score,
        resolution: s.resolution,
        latency_ms: s.latency_ms,
        last_checked_at: s.last_checked_at,
        active: s.active,
      })),
    });
  } catch (err) {
    console.error("[/api/tamil/channels/:id/streams] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

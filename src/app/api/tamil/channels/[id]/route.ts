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
      channel: {
        id: channel.id,
        name: channel.name,
        logo_url: channel.logo_url,
        category: channel.category,
        language: channel.language,
        country: channel.country,
        source_url: channel.source_url,
        verified: channel.verified,
        health_status: channel.health_status,
        health_score: channel.health_score,
        last_checked_at: channel.last_checked_at,
        latency_ms: channel.latency_ms,
        resolution: channel.resolution,
        streams: channel.streams?.map((s) => ({
          id: s.id,
          stream_url: s.stream_url,
          health_status: s.health_status,
          health_score: s.health_score,
          resolution: s.resolution,
          latency_ms: s.latency_ms,
        })),
      },
    });
  } catch (err) {
    console.error("[/api/tamil/channels/:id] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

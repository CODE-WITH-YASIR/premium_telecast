import { NextResponse } from "next/server";
import { tamilStore } from "@/lib/tamil/store";
import { invalidateTamilCache } from "@/lib/tamil/cache";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { channelId, streamId, active } = body;

    if (typeof active !== "boolean") {
      return NextResponse.json({ error: "active boolean flag is required" }, { status: 400 });
    }

    invalidateTamilCache();

    if (channelId) {
      const ok = tamilStore.toggleChannelActive(channelId, active);
      if (!ok) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
      return NextResponse.json({ message: `Channel ${active ? "enabled" : "disabled"}` });
    }

    if (streamId) {
      const ok = tamilStore.toggleStreamActive(streamId, active);
      if (!ok) return NextResponse.json({ error: "Stream not found" }, { status: 404 });
      return NextResponse.json({ message: `Stream ${active ? "enabled" : "disabled"}` });
    }

    return NextResponse.json({ error: "channelId or streamId required" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { TamilHealthEngine } from "@/lib/tamil/engine";
import { invalidateTamilCache } from "@/lib/tamil/cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: { streamId?: string; channelId?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    invalidateTamilCache();
    const stats = await TamilHealthEngine.runHealthScan({
      streamId: body.streamId,
      channelId: body.channelId,
    });

    return NextResponse.json({
      message: "Health scan completed.",
      stats,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Health check error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


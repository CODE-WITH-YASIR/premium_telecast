import { NextResponse } from "next/server";
import { TamilHealthEngine } from "@/lib/tamil/engine";
import { invalidateTamilCache } from "@/lib/tamil/cache";

export const dynamic = "force-dynamic";

export async function POST(_request: Request) {
  try {
    invalidateTamilCache();
    const stats = await TamilHealthEngine.syncPlaylist({ forceScan: true });

    return NextResponse.json({
      message: "Tamil channel synchronization and health scan triggered successfully.",
      stats,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Sync error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


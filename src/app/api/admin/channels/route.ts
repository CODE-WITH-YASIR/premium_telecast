import { NextResponse } from "next/server";
import { customChannelsService } from "@/lib/iptv/customChannels";

export const dynamic = "force-dynamic";

export async function GET(_request: Request) {
  const channels = customChannelsService.getAll(false);
  return NextResponse.json({ channels });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, stream_url, logo, category, country, language } = body;

    if (!name || !stream_url) {
      return NextResponse.json({ error: "Channel Name and Stream URL are required." }, { status: 400 });
    }

    const channel = customChannelsService.create({
      name,
      stream_url,
      logo,
      category,
      country,
      language,
    });

    return NextResponse.json({ channel, message: "Channel added successfully." }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create channel";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id || typeof is_active !== "boolean") {
      return NextResponse.json({ error: "Channel ID and is_active flag required." }, { status: 400 });
    }

    const success = customChannelsService.toggleActive(id, is_active);
    if (!success) {
      return NextResponse.json({ error: "Channel not found." }, { status: 404 });
    }
    return NextResponse.json({ message: `Channel ${is_active ? "activated" : "deactivated"}.` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update channel";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Channel ID is required." }, { status: 400 });
    }

    customChannelsService.delete(id);
    return NextResponse.json({ message: "Channel deleted successfully." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete channel";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


"use client";

import Link from "next/link";
import { ListVideo, Play } from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { EPG_SOURCE_URL } from "@/lib/iptv/config";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { LiveBadge } from "@/components/channel/LiveBadge";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export default function GuidePage() {
  const { channels, loading } = useChannels();
  const hasEpgSource = Boolean(EPG_SOURCE_URL);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
          <ListVideo className="h-3.5 w-3.5 text-primary" />
          <span>Electronic Program Directory</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Program Guide & Directory</h1>
        <p className="mt-1 text-xs text-white/60">
          Global index of available broadcast stations and streaming relays.
        </p>
      </div>

      {!hasEpgSource && (
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
          <p className="text-xs text-white/60 leading-relaxed">
            Real-time broadcast directory. Granular XMLTV schedule data is currently offline for this feed provider, so channels are displayed with verified metadata instead of fabricated schedule timings.
          </p>
        </div>
      )}

      {loading ? (
        <ChannelGridSkeleton count={12} />
      ) : channels.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState icon={ListVideo} title="No channels available in current directory" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-xl">
          <ul className="divide-y divide-white/5">
            {channels.slice(0, 100).map((channel) => (
              <li
                key={channel.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] p-1.5 border border-white/5">
                    <ChannelLogo
                      src={channel.logo}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{channel.name}</p>
                    <p className="truncate text-[11px] text-white/50">
                      {[channel.group, channel.country, channel.language].filter(Boolean).join(" · ") || "Global"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <LiveBadge size="sm" />
                  <Link
                    href={`/live?channel=${channel.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white hover:bg-primary hover:text-black transition"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Tune In</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

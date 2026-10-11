"use client";

import { memo } from "react";
import Link from "next/link";
import { Play, CheckCircle, ShieldCheck, Radio, Sparkles } from "lucide-react";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { FavoriteButton } from "@/components/channel/FavoriteButton";
import { formatRelativeTime } from "@/lib/utils";
import type { TamilChannel } from "@/lib/tamil/types";

interface TamilChannelCardProps {
  channel: TamilChannel;
}

export const TamilChannelCard = memo(function TamilChannelCard({ channel }: TamilChannelCardProps) {
  const isHd =
    channel.resolution?.includes("1080") ||
    channel.resolution?.includes("720") ||
    channel.name.toLowerCase().includes("hd");

  const lastCheckedText = channel.last_checked_at
    ? `Checked ${formatRelativeTime(channel.last_checked_at)}`
    : "Verified recently";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-3 sm:p-4 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 active:scale-[0.98]">
      {/* Top Banner / Logo Area */}
      <div className="relative mb-2.5 sm:mb-3.5 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-black/40 p-2 sm:p-3 transition duration-300 group-hover:border-primary/30">
        <ChannelLogo
          src={channel.logo_url}
          alt={channel.name}
          className="max-h-12 sm:max-h-16 w-auto max-w-full object-contain transition duration-300 group-hover:scale-105"
        />

        {/* Live Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-1.5 py-0.5 sm:px-2 sm:py-0.5 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-300">LIVE</span>
        </div>

        {/* Favorite Button (User-Isolated) */}
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton
            channelId={channel.id}
            channelName={channel.name}
            channelLogo={channel.logo_url || undefined}
            variant="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 bg-black/60 border border-white/15 hover:bg-black/80"
          />
        </div>

        {/* Quick Play Overlay */}
        <Link
          href={`/tamil/${channel.id}`}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100"
          aria-label={`Play ${channel.name}`}
        >
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-black shadow-xl shadow-primary/30 transition duration-200 hover:scale-110">
            <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current translate-x-0.5" />
          </div>
        </Link>
      </div>

      {/* Channel Information */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5">
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/70 truncate">
              {channel.category}
            </span>

            {isHd && (
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1 py-0.5 text-[8px] sm:text-[9px] font-bold text-cyan-300 font-mono shrink-0">
                {channel.resolution || "HD"}
              </span>
            )}
          </div>

          <Link href={`/tamil/${channel.id}`}>
            <h3 className="mt-1.5 text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition">
              {channel.name}
            </h3>
          </Link>
        </div>

        {/* Verified Status & Play Action Bar */}
        <div className="mt-2.5 sm:mt-3.5 flex items-center justify-between border-t border-white/5 pt-2 sm:pt-2.5">
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-medium overflow-hidden">
            <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 shrink-0" />
            <span suppressHydrationWarning className="truncate text-white/45">{lastCheckedText}</span>
          </div>

          <Link
            href={`/tamil/${channel.id}`}
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:text-primary-hover transition shrink-0 ml-1.5"
          >
            <span>Watch</span>
            <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
          </Link>
        </div>
      </div>
    </div>
  );
});

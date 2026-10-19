"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  RotateCw,
  Tv,
  X,
  ShieldCheck,
  Info,
  Baby,
  Globe,
} from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { useDebounce } from "@/hooks/useDebounce";
import { filterTamilKidsChannels, searchChannels } from "@/lib/iptv/selectors";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/utils";
import type { Channel } from "@/lib/iptv/types";

/** Well-known Indian/Tamil kids channel names from iptv-org */
const KNOWN_TAMIL_KIDS = new Set([
  "chithiram", "cartoon network", "discovery kids", "sony yay",
  "nick", "sonic", "hungama", "disney junior", "disney channel",
  "nick jr", "nickelodeon",
]);

type AudioStatus = "verified-tamil" | "probable-tamil" | "unverified";

function getAudioStatus(channel: Channel): AudioStatus {
  const isTamilTagged =
    channel.language?.toLowerCase().includes("tam") ||
    channel.languageCode === "tam";
  const isFromTamilSource = channel.sourceId === "iptv-org-tamil";
  const lowerName = channel.name.toLowerCase();
  const isKnownTamilKids = [...KNOWN_TAMIL_KIDS].some((n) => lowerName.includes(n));

  if (isTamilTagged && isFromTamilSource) return "verified-tamil";
  if (isTamilTagged || isFromTamilSource) return "probable-tamil";
  if (isKnownTamilKids) return "unverified";
  return "unverified";
}

const AUDIO_STATUS_CONFIG: Record<AudioStatus, { label: string; className: string }> = {
  "verified-tamil": {
    label: "Tamil",
    className: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  },
  "probable-tamil": {
    label: "Tamil*",
    className: "bg-orange-500/15 border-orange-500/30 text-orange-300",
  },
  unverified: {
    label: "Lang?",
    className: "bg-white/10 border-white/15 text-white/40",
  },
};

function TamilKidsChannelCard({ channel }: { channel: Channel }) {
  const audioStatus = getAudioStatus(channel);
  const statusConfig = AUDIO_STATUS_CONFIG[audioStatus];

  return (
    <Link
      href={`/channel/${channel.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-300 hover:border-orange-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {/* Audio Status Badge */}
      <div className="absolute top-2 right-2 z-10">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold",
            statusConfig.className
          )}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Logo */}
      <div className="relative mx-auto flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-orange-500/20 via-amber-500/15 to-yellow-500/10 shadow-inner">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="h-full w-full object-contain p-1.5"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-2xl",
            channel.logo ? "hidden" : "flex"
          )}
          aria-hidden="true"
        >
          📺
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 text-center">
        <p className="truncate text-xs font-bold text-white group-hover:text-orange-200 transition leading-tight">
          {channel.name}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-white/40">
          {channel.group ?? channel.country ?? "—"}
        </p>
      </div>

      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/80 shadow-lg shadow-orange-500/40 backdrop-blur-sm">
          <svg className="h-3.5 w-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function TamilKidsPage() {
  const { channels, loading, error, refresh, refreshing } = useChannels();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 250);

  const tamilKidsChannels = useMemo(
    () => filterTamilKidsChannels(channels),
    [channels]
  );

  const displayedChannels = useMemo(() => {
    if (debouncedQuery) return searchChannels(tamilKidsChannels, debouncedQuery);
    return tamilKidsChannels;
  }, [tamilKidsChannels, debouncedQuery]);

  const verifiedCount = displayedChannels.filter(
    (c) => getAudioStatus(c) === "verified-tamil"
  ).length;
  const probableCount = displayedChannels.filter(
    (c) => getAudioStatus(c) === "probable-tamil"
  ).length;
  const unverifiedCount = displayedChannels.filter(
    (c) => getAudioStatus(c) === "unverified"
  ).length;

  if (loading) {
    return (
      <div className="page-container pt-6">
        <div className="mb-8 h-40 w-full rounded-3xl bg-white/[0.03] animate-pulse" />
        <ChannelGridSkeleton count={12} />
      </div>
    );
  }

  if (error && channels.length === 0) {
    return (
      <div className="page-container pt-6">
        <ErrorState
          title="Unable to load Tamil Kids channels"
          description={error}
          action={{ label: "Try again", onClick: refresh }}
        />
      </div>
    );
  }

  return (
    <div className="page-container pt-4 sm:pt-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-tr from-[#0b100a] via-[#09100b] to-[#14120a] p-4 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Tamil Kids TV</span>
            </div>

            <h1 className="mt-2 sm:mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Tamil{" "}
              <span className="bg-gradient-to-r from-primary via-amber-300 to-orange-400 bg-clip-text text-transparent">
                Kids Channels
              </span>
            </h1>

            <p className="mt-1.5 text-xs sm:text-sm text-white/60 leading-relaxed">
              Children&apos;s channels discovered from Tamil and Indian streams in the iptv-org
              playlist directory. Channels are categorised by audio language confidence — not all
              streams are guaranteed to have Tamil audio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl">
              <Baby className="h-4 w-4 text-orange-400" />
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">Found</p>
                <p className="text-[11px] text-orange-300 font-semibold">
                  {tamilKidsChannels.length} channels
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition disabled:opacity-50 active:scale-95"
            >
              <RotateCw className={cn("h-3.5 w-3.5 text-primary", refreshing && "animate-spin")} />
              <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4 text-[11px] text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Tamil verified: <strong className="text-white font-mono">{verifiedCount}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            Tamil probable: <strong className="text-white font-mono">{probableCount}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/30" />
            Language unverified: <strong className="text-white font-mono">{unverifiedCount}</strong>
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
          <ShieldCheck className="h-3 w-3" />
          <strong>Tamil</strong> — Playlist metadata confirms Tamil language
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-orange-300">
          <Info className="h-3 w-3" />
          <strong>Tamil*</strong> — Probable Tamil (one signal confirmed)
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/40">
          <Globe className="h-3 w-3" />
          <strong>Lang?</strong> — Language unverified in metadata
        </span>
      </div>

      {/* All Kids TV link */}
      <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
        <span>Also see:</span>
        <Link
          href="/kids"
          className="font-semibold text-purple-400 hover:text-purple-300 transition hover:underline underline-offset-2"
        >
          All Kids Channels →
        </Link>
        <span>•</span>
        <Link
          href="/tamil"
          className="font-semibold text-primary hover:text-primary/80 transition hover:underline underline-offset-2"
        >
          Tamil Live TV →
        </Link>
      </div>

      {/* Search */}
      <div className="mt-5 sm:mt-6 relative">
        <Search className="absolute left-3.5 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Tamil kids channels (e.g. Chutti TV, POGO, Cartoon Network, Nick, Sony YAY)…"
          className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 sm:py-3.5 pl-10 sm:pl-11 pr-10 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Channel Grid */}
      <div className="mt-5 sm:mt-8">
        {displayedChannels.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 text-center">
            <EmptyState
              icon={Tv}
              title={
                debouncedQuery
                  ? `No Tamil kids channels match "${debouncedQuery}"`
                  : channels.length === 0
                  ? "Playlist loading — please wait"
                  : "No Tamil kids channels found in current playlist data"
              }
              description={
                debouncedQuery
                  ? "Try a different keyword or browse all kids channels."
                  : "The upstream iptv-org playlist may not include Tamil-audio kids streams at this time. Try refreshing or check the full Kids page."
              }
              action={
                debouncedQuery
                  ? { label: "Clear search", onClick: () => setSearchQuery("") }
                  : { label: "Refresh playlist", onClick: () => refresh() }
              }
            />
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-white/50">
              <p>
                Showing{" "}
                <span className="font-bold text-white">{displayedChannels.length}</span>{" "}
                Tamil kids channel{displayedChannels.length === 1 ? "" : "s"}
              </p>
              <span className="text-[11px] text-white/30">Source: iptv-org.github.io</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {displayedChannels.map((channel) => (
                <TamilKidsChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-[11px] text-white/35 leading-relaxed">
        <strong className="text-white/50">Disclaimer:</strong> These channels are discovered
        from publicly listed iptv-org playlists. Tamil audio availability is inferred from
        M3U metadata tags. A &ldquo;Tamil&rdquo; or &ldquo;Tamil*&rdquo; label means the upstream playlist data
        suggests Tamil language — actual audio language has not been independently verified by
        live playback testing. We do not link to pirated or DRM-protected streams.
      </div>
    </div>
  );
}

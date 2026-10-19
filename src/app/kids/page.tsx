"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Baby,
  Search,
  RotateCw,
  Tv,
  X,
  Star,
  Sparkles,
  Globe,
} from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { useDebounce } from "@/hooks/useDebounce";
import { filterKidsChannels, filterTamilKidsChannels, searchChannels } from "@/lib/iptv/selectors";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cn } from "@/lib/utils";
import type { Channel } from "@/lib/iptv/types";
import { ChannelRail } from "@/components/home/Sections";

type KidsTab = "all" | "tamil" | "international";

const TABS: Array<{ id: KidsTab; label: string; emoji: string }> = [
  { id: "all", label: "All Kids", emoji: "🎮" },
  { id: "tamil", label: "Tamil Kids", emoji: "🌟" },
  { id: "international", label: "International", emoji: "🌍" },
];

function KidsChannelCard({ channel }: { channel: Channel }) {
  const hasTamilAudio =
    channel.language?.toLowerCase().includes("tam") ||
    channel.languageCode === "tam" ||
    channel.sourceId === "iptv-org-tamil";

  const languageLabel = channel.language
    ? channel.language
    : hasTamilAudio
    ? "Tamil (unverified)"
    : "Unverified";

  return (
    <Link
      href={`/channel/${channel.id}`}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-300 hover:border-purple-500/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {/* Logo */}
      <div className="relative mx-auto flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-purple-500/10 shadow-inner">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="h-full w-full object-contain p-1.5"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              (e.currentTarget.nextElementSibling as HTMLElement | null)?.style &&
                ((e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex");
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
          🎬
        </div>
      </div>

      {/* Channel Info */}
      <div className="min-w-0 text-center">
        <p className="truncate text-xs font-bold text-white group-hover:text-purple-200 transition leading-tight">
          {channel.name}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
          {hasTamilAudio ? (
            <span className="inline-flex items-center rounded-full bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 text-[9px] font-bold text-orange-300">
              TA
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-1.5 py-0.5 text-[9px] font-semibold text-white/50">
              {languageLabel.slice(0, 6)}
            </span>
          )}
          {channel.group && (
            <span className="inline-flex items-center rounded-full bg-purple-500/15 border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300 truncate max-w-[70px]">
              {channel.group.slice(0, 10)}
            </span>
          )}
        </div>
      </div>

      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/80 shadow-lg shadow-purple-500/40 backdrop-blur-sm">
          <svg className="h-3.5 w-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function KidsPage() {
  const { channels, loading, error, refresh, refreshing } = useChannels();
  const [activeTab, setActiveTab] = useState<KidsTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 250);

  const allKidsChannels = useMemo(() => filterKidsChannels(channels), [channels]);
  const tamilKidsChannels = useMemo(() => filterTamilKidsChannels(channels), [channels]);
  const internationalKids = useMemo(
    () =>
      allKidsChannels.filter(
        (c) =>
          !c.language?.toLowerCase().includes("tam") &&
          c.languageCode !== "tam" &&
          c.sourceId !== "iptv-org-tamil"
      ),
    [allKidsChannels]
  );

  const displayedChannels = useMemo(() => {
    let pool: Channel[];
    if (activeTab === "tamil") pool = tamilKidsChannels;
    else if (activeTab === "international") pool = internationalKids;
    else pool = allKidsChannels;

    if (debouncedQuery) {
      return searchChannels(pool, debouncedQuery);
    }
    return pool;
  }, [activeTab, allKidsChannels, tamilKidsChannels, internationalKids, debouncedQuery]);

  if (loading) {
    return (
      <div className="page-container pt-6">
        <div className="mb-8 h-32 w-full rounded-3xl bg-white/[0.03] animate-pulse" />
        <ChannelGridSkeleton count={12} />
      </div>
    );
  }

  if (error && channels.length === 0) {
    return (
      <div className="page-container pt-6">
        <ErrorState
          title="Unable to load Kids channels"
          description={error}
          action={{ label: "Try again", onClick: refresh }}
        />
      </div>
    );
  }

  return (
    <div className="page-container pt-4 sm:pt-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-tr from-[#0d0b1a] via-[#100b1e] to-[#0e1020] p-4 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-purple-300">
              <Baby className="h-3 w-3" />
              <span>Kids &amp; Cartoons — Live Streams</span>
            </div>

            <h1 className="mt-2 sm:mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Kids{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent">
                TV Live
              </span>
            </h1>

            <p className="mt-1.5 text-xs sm:text-sm text-white/60 leading-relaxed">
              Cartoons, educational shows, and kids&apos; channels sourced from the public iptv-org
              directory. Includes Tamil-language kids content where available.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl">
              <Star className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">Kids Channels</p>
                <p className="text-[11px] text-purple-300 font-semibold">{allKidsChannels.length} Found</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition disabled:opacity-50 active:scale-95"
            >
              <RotateCw className={cn("h-3.5 w-3.5 text-purple-400", refreshing && "animate-spin")} />
              <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Tamil Kids Quick Link */}
        {tamilKidsChannels.length > 0 && (
          <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs text-white/60">
              <span className="font-bold text-orange-300">{tamilKidsChannels.length}</span> Tamil Kids
              channels found —{" "}
            </span>
            <Link
              href="/tamil-kids"
              className="text-xs font-bold text-primary hover:text-primary underline-offset-2 hover:underline transition"
            >
              View Tamil Kids →
            </Link>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-5 sm:mt-8 flex flex-col gap-3 sm:gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search kids channels (e.g. POGO, Cartoon Network, Chutti, Nick, Sony YAY)…"
            className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 sm:py-3.5 pl-10 sm:pl-11 pr-10 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:bg-white/[0.05] focus:outline-none transition shadow-inner"
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

        {/* Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const count =
              tab.id === "all"
                ? allKidsChannels.length
                : tab.id === "tamil"
                ? tamilKidsChannels.length
                : internationalKids.length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold transition active:scale-95",
                  active
                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25 font-bold"
                    : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-mono",
                    active ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Channel Grid */}
      <div className="mt-5 sm:mt-8">
        {displayedChannels.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 text-center">
            <EmptyState
              icon={Tv}
              title={
                debouncedQuery
                  ? `No kids channels match "${debouncedQuery}"`
                  : activeTab === "tamil"
                  ? "No Tamil kids channels found in current playlist data"
                  : "No kids channels available right now"
              }
              description={
                debouncedQuery
                  ? "Try a different keyword or browse all channels."
                  : "The playlist may be loading or the upstream source is temporarily unavailable."
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
                Showing <span className="font-bold text-white">{displayedChannels.length}</span> kids
                channel{displayedChannels.length === 1 ? "" : "s"}
                {activeTab === "tamil" && (
                  <span className="ml-2 text-orange-300 font-semibold">— Tamil language</span>
                )}
              </p>
              <span className="flex items-center gap-1 text-white/40 text-[11px]">
                <Globe className="h-3 w-3" />
                <span>iptv-org.github.io</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
              {displayedChannels.map((channel) => (
                <KidsChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Language disclaimer */}
      <div className="mt-8 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-[11px] text-white/35 leading-relaxed">
        <strong className="text-white/50">Note:</strong> Language labels are sourced from M3U metadata
        tags in the upstream playlist. Channels without a language tag are marked unverified. Tamil audio
        availability is not independently confirmed for every stream — playback quality depends on the
        upstream provider.
      </div>
    </div>
  );
}

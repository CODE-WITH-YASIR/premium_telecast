"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Radio,
  Search,
  ShieldCheck,
  Zap,
  RotateCw,
  Sparkles,
  Tv,
  ArrowRight,
  TrendingUp,
  X,
} from "lucide-react";
import { useTamilChannels } from "@/hooks/useTamilChannels";
import { useDebounce } from "@/hooks/useDebounce";
import { TamilChannelCard } from "@/components/tamil/TamilChannelCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import type { TamilCategory } from "@/lib/tamil/types";
import { formatRelativeTime, cn } from "@/lib/utils";

const CATEGORIES: Array<{ id: TamilCategory | "all"; label: string }> = [
  { id: "all", label: "All Channels" },
  { id: "Entertainment", label: "Entertainment" },
  { id: "News", label: "News & Seithigal" },
  { id: "Movies", label: "Movies & Cinema" },
  { id: "Music", label: "Music & Songs" },
  { id: "Religious", label: "Devotional & Bakthi" },
  { id: "Kids", label: "Kids & Animation" },
  { id: "Sports", label: "Sports" },
  { id: "Culture", label: "Culture & Documentaries" },
];

export default function TamilTvPage() {
  const [selectedCategory, setSelectedCategory] = useState<TamilCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 250);

  const {
    channels,
    total,
    verifiedCount,
    loading,
    refreshing,
    error,
    lastUpdated,
    stats,
    refresh,
  } = useTamilChannels({
    category: selectedCategory,
    query: debouncedQuery,
  });

  const featured = useMemo(() => channels[0] || null, [channels]);

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-tr from-[#0b101b] via-[#090b10] to-[#14120a] p-4 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 sm:px-3.5 sm:py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
              <Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse" />
              <span>100% Verified Tamil Channels</span>
            </div>

            <h1 className="mt-2 sm:mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Tamil Live <span className="bg-gradient-to-r from-primary via-amber-300 to-orange-400 bg-clip-text text-transparent">TV</span>
            </h1>

            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/70 leading-relaxed">
              Curated and continuously verified Tamil television streams. Only healthy, playable live broadcasts are served.
            </p>
          </div>

          {/* Telemetry Badge & Quick Stats */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 sm:px-4 sm:py-3 backdrop-blur-xl">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">Health Status</p>
                <p suppressHydrationWarning className="text-[11px] sm:text-xs text-emerald-400 font-semibold">
                  {verifiedCount} Verified Live Channels
                </p>
              </div>
            </div>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => refresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 sm:px-4 sm:py-3 text-xs font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition disabled:opacity-50 active:scale-95"
            >
              <RotateCw className={cn("h-3.5 w-3.5 text-primary", refreshing && "animate-spin")} />
              <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        {stats && (
          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4 border-t border-white/10 pt-3 sm:pt-4 text-[10px] sm:text-[11px] text-white/50">
            <span className="flex items-center gap-1.5" suppressHydrationWarning>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Availability: <strong className="text-white font-mono">{stats.availabilityRate}%</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span suppressHydrationWarning>
              Avg Latency: <strong className="text-white font-mono">{stats.averageLatencyMs}ms</strong>
            </span>
            <span className="hidden sm:inline">•</span>
            <span suppressHydrationWarning>
              Last Checked: <strong className="text-white font-mono">{formatRelativeTime(lastUpdated)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Featured Channel Spotlight (if available) */}
      {featured && !debouncedQuery && selectedCategory === "all" && (
        <div className="mt-4 sm:mt-8 overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-r from-white/[0.04] to-white/[0.01] p-4 sm:p-6 backdrop-blur-2xl shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-white/10 bg-black/40 p-2">
                <img
                  src={featured.logo_url || ""}
                  alt={featured.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-primary">
                    FEATURED LIVE
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-emerald-400 font-mono font-semibold">● ONLINE</span>
                </div>
                <h2 className="mt-0.5 sm:mt-1 text-lg font-bold text-white sm:text-2xl">{featured.name}</h2>
                <p className="text-[11px] sm:text-xs text-white/60">{featured.category} · Tamil Live HD</p>
              </div>
            </div>

            <Link
              href={`/tamil/${featured.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-primary px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-bold text-black shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-95 transition"
            >
              <span>Watch Live</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="mt-5 sm:mt-8 flex flex-col gap-3 sm:gap-4">
        {/* Mobile-Friendly Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            suppressHydrationWarning
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Tamil channels (e.g. Sun TV, Vijay, News, KTV, Music)..."
            className="w-full rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 sm:py-3.5 pl-10 sm:pl-11 pr-10 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-primary/50 focus:bg-white/[0.05] focus:outline-none backdrop-blur-xl transition shadow-inner"
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

        {/* Touch-Friendly Horizontal Scrolling Category Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory touch-pan-x -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                suppressHydrationWarning
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "shrink-0 snap-start rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold transition backdrop-blur-xl active:scale-95",
                  active
                    ? "bg-primary text-black shadow-lg shadow-primary/25 font-bold"
                    : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Channels Grid / Skeletons / Empty States */}
      <div className="mt-5 sm:mt-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl sm:rounded-3xl" />
            ))}
          </div>
        ) : error && channels.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 text-center backdrop-blur-xl">
            <EmptyState
              icon={Tv}
              title="Tamil Channels Temporarily Unavailable"
              description={error}
              action={{ label: "Retry Sync", onClick: () => refresh() }}
            />
          </div>
        ) : channels.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.02] p-8 sm:p-12 text-center backdrop-blur-xl">
            <EmptyState
              icon={Tv}
              title="No verified Tamil streams match your search"
              description="Try adjusting your category filter or search keywords."
              action={{ label: "Clear Filters", onClick: () => { setSelectedCategory("all"); setSearchQuery(""); } }}
            />
          </div>
        ) : (
          <div>
            <div className="mb-3 sm:mb-4 flex items-center justify-between text-xs text-white/50">
              <p>
                Showing <span className="font-bold text-white">{channels.length}</span> verified Tamil channel{channels.length === 1 ? "" : "s"}
              </p>
              <span className="flex items-center gap-1 text-emerald-400 text-[11px] sm:text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Playable & Healthy</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {channels.map((channel) => (
                <TamilChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

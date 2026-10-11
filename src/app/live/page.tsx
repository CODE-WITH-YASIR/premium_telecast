"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Tv,
  Radio,
  Search,
  Share2,
  SlidersHorizontal,
  ChevronRight,
  ListVideo,
  X,
} from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/context/AuthContext";
import {
  getCategories,
  getCountries,
  getLanguages,
  searchChannels,
  filterByCategorySlug,
  filterByCountrySlug,
  filterByLanguageSlug,
} from "@/lib/iptv/selectors";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { FavoriteButton } from "@/components/channel/FavoriteButton";
import { LiveBadge } from "@/components/channel/LiveBadge";
import { FilterBar } from "@/components/channel/FilterBar";
import { ChannelGrid } from "@/components/channel/ChannelGrid";
import { ChannelGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import type { Channel } from "@/lib/iptv/types";

function LivePageContent() {
  const { channels, loading, error, refreshing, lastUpdated, refresh } = useChannels();
  const { recordWatch } = useAuth();
  const searchParams = useSearchParams();

  // Active channel state
  const initialChannelId = searchParams.get("channel");
  const [activeChannelId, setActiveChannelId] = useState<string | null>(initialChannelId);

  // Filters
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [country, setCountry] = useState(searchParams.get("country") ?? "");
  const [language, setLanguage] = useState(searchParams.get("language") ?? "");

  // Mini-hopper search query
  const [hopperQuery, setHopperQuery] = useState("");
  const debouncedHopperQuery = useDebounce(hopperQuery, 150);
  const debouncedQuery = useDebounce(query, 200);

  // Active channel reference derived cleanly
  const activeChannel: Channel | null = useMemo(() => {
    if (!channels.length) return null;
    if (activeChannelId) {
      const found = channels.find((c) => c.id === activeChannelId);
      if (found) return found;
    }
    return channels[0] ?? null;
  }, [channels, activeChannelId]);

  // Record watch history when active channel changes
  useEffect(() => {
    if (activeChannel) {
      void recordWatch(activeChannel.id, activeChannel.name, activeChannel.logo);
    }
  }, [activeChannel, recordWatch]);

  // Facet calculations memoized on channels
  const categories = useMemo(() => getCategories(channels), [channels]);
  const countries = useMemo(() => getCountries(channels), [channels]);
  const languages = useMemo(() => getLanguages(channels), [channels]);

  // Filtered channel catalog
  const filtered = useMemo(() => {
    let result = channels;
    if (debouncedQuery.trim()) result = searchChannels(result, debouncedQuery);
    if (category) result = filterByCategorySlug(result, category);
    if (country) result = filterByCountrySlug(result, country);
    if (language) result = filterByLanguageSlug(result, language);
    return result;
  }, [channels, debouncedQuery, category, country, language]);

  // Quick Hopper channels (top 35 or search match)
  const hopperChannels = useMemo(() => {
    if (!debouncedHopperQuery.trim()) {
      return channels.slice(0, 35);
    }
    return searchChannels(channels, debouncedHopperQuery).slice(0, 35);
  }, [channels, debouncedHopperQuery]);

  // Channel switch callback
  const selectChannel = useCallback((channel: Channel) => {
    setActiveChannelId(channel.id);
  }, []);

  const [copiedShare, setCopiedShare] = useState(false);
  const handleShare = useCallback(async () => {
    if (!activeChannel) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: activeChannel.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      }
    } catch {
      // User cancelled
    }
  }, [activeChannel]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Skeleton className="aspect-video w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-4">
            <Skeleton className="h-[480px] w-full rounded-3xl" />
          </div>
        </div>
        <div className="mt-12">
          <ChannelGridSkeleton count={12} />
        </div>
      </div>
    );
  }

  if (error && channels.length === 0) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6">
        <ErrorState
          title="Unable to load Live TV"
          description={error}
          action={{ label: "Retry Connection", onClick: refresh }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1650px] px-3 py-6 sm:px-6 sm:py-8">
      {/* Top Title & Status Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
            <Radio className="h-4 w-4" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Live Broadcast Center</h1>
          <LiveBadge size="sm" />
        </div>

        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="hidden sm:inline">Active Source: IPTV Org Global</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-400">ONLINE</span>
        </div>
      </div>

      {/* Main Cinema Theater Split: Player (Left) + Channel Hopper (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Large Video Player & Current Channel Header */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            {activeChannel ? (
              <VideoPlayer
                streamUrl={activeChannel.streamUrl}
                title={activeChannel.name}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center bg-black/60">
                <p className="text-white/50 text-sm">Select a channel to begin broadcast</p>
              </div>
            )}
          </div>

          {/* Active Channel Details & Control Strip */}
          {activeChannel && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl shadow-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-inner">
                    <ChannelLogo
                      src={activeChannel.logo}
                      alt={activeChannel.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg sm:text-2xl font-bold text-white">
                        {activeChannel.name}
                      </h2>
                      <LiveBadge size="sm" />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/60">
                      {activeChannel.group && (
                        <span className="rounded-md bg-white/[0.08] px-2 py-0.5 font-medium text-white/80">
                          {activeChannel.group}
                        </span>
                      )}
                      {activeChannel.country && <span>Country: {activeChannel.country}</span>}
                      {activeChannel.language && <span>· Lang: {activeChannel.language}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions: Favorite, Share */}
                <div className="flex items-center gap-2 shrink-0">
                  <FavoriteButton
                    channelId={activeChannel.id}
                    channelName={activeChannel.name}
                    variant="full"
                    className="border-white/15 bg-white/[0.06] hover:bg-white/10 text-xs py-2 px-3.5"
                  />
                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label="Share channel link"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/[0.08] transition"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>{copiedShare ? "Copied!" : "Share"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Channel Browser & Channel Hopper Drawer */}
        <div className="lg:col-span-4 flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-2xl shadow-xl h-[520px] lg:h-[680px] xl:h-[720px] min-h-0 max-h-[calc(100vh-120px)] overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <ListVideo className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-white">Live Channel Hopper</h3>
            </div>
            <span className="text-[11px] font-mono text-white/40">
              {hopperQuery ? `${hopperChannels.length} found` : "Instant Switch"}
            </span>
          </div>

          {/* Quick Hopper Search */}
          <div className="relative mt-3 shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
            <input
              type="text"
              value={hopperQuery}
              onChange={(e) => setHopperQuery(e.target.value)}
              placeholder="Quick search channels…"
              aria-label="Quick search channels"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
            />
            {hopperQuery && (
              <button
                type="button"
                onClick={() => setHopperQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Scrollable Hopper Channel List */}
          <div className="mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 space-y-1.5 touch-pan-y">
            {hopperChannels.length === 0 ? (
              <div className="py-12 text-center text-xs text-white/40">
                No channels match &quot;{hopperQuery}&quot;
              </div>
            ) : (
              hopperChannels.map((c) => {
                const isSelected = c.id === activeChannel?.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectChannel(c)}
                    className={`group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition duration-150 ${
                      isSelected
                        ? "bg-primary/15 border border-primary/40 shadow-lg shadow-primary/10"
                        : "border border-transparent bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] p-1.5 border border-white/5">
                      <ChannelLogo src={c.logo} alt={c.name} className="h-full w-full object-contain" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`truncate text-xs font-semibold ${isSelected ? "text-primary" : "text-white"}`}>
                          {c.name}
                        </p>
                        {isSelected && (
                          <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                        )}
                      </div>
                      <p className="truncate text-[10px] text-white/50">
                        {c.group || c.country || "Live"}
                      </p>
                    </div>

                    <ChevronRight className={`h-4 w-4 shrink-0 transition ${isSelected ? "text-primary" : "text-white/20 group-hover:text-white/60"}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Channel Catalog Browser */}
      <div className="mt-14 border-t border-white/10 pt-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/70">
              <SlidersHorizontal className="h-3 w-3 text-primary" />
              <span>Catalog Browser</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Browse All Channels
            </h2>
            <p className="text-xs text-white/60">
              Filter by genre, country, or language and tap any card to start streaming immediately in the theater player.
            </p>
          </div>
        </div>

        <FilterBar
          query={query}
          onQueryChange={setQuery}
          category={category}
          onCategoryChange={setCategory}
          country={country}
          onCountryChange={setCountry}
          language={language}
          onLanguageChange={setLanguage}
          categories={categories}
          countries={countries}
          languages={languages}
          filteredCount={filtered.length}
          totalCount={channels.length}
          lastUpdated={lastUpdated}
          refreshing={refreshing}
          onRefresh={refresh}
        />

        <div className="mt-8">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Tv}
              title="No channels match your filters"
              description="Try adjusting your query, category, country, or language selection."
            />
          ) : (
            <ChannelGrid channels={filtered} onSelectChannel={selectChannel} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function LivePage() {
  return (
    <Suspense fallback={<div className="p-10"><ChannelGridSkeleton count={12} /></div>}>
      <LivePageContent />
    </Suspense>
  );
}

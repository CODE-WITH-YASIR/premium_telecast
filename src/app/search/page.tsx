"use client";

import { useMemo, useState } from "react";
import { Search as SearchIcon, Radio, X, Sparkles, ShieldCheck } from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { useTamilChannels } from "@/hooks/useTamilChannels";
import { useDebounce } from "@/hooks/useDebounce";
import { searchChannels } from "@/lib/iptv/selectors";
import { ChannelGrid } from "@/components/channel/ChannelGrid";
import { TamilChannelCard } from "@/components/tamil/TamilChannelCard";
import { EmptyState } from "@/components/ui/States";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";

const QUICK_FILTERS = [
  "Tamil TV",
  "Sun TV",
  "Vijay TV",
  "KTV",
  "News",
  "Sports",
  "Movies",
  "Music",
  "Kids",
  "Entertainment",
];

export default function SearchPage() {
  const { channels: globalChannels, loading: globalLoading } = useChannels();
  const { channels: tamilChannels, loading: tamilLoading } = useTamilChannels({ category: "all" });

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 180);

  // Search Tamil Channels
  const matchingTamilChannels = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    if (q === "tamil" || q === "tamil tv") return tamilChannels;

    return tamilChannels.filter((c) => {
      const name = c.name.toLowerCase();
      const norm = c.normalized_name?.toLowerCase() || "";
      const cat = c.category.toLowerCase();
      return name.includes(q) || norm.includes(q) || cat.includes(q);
    });
  }, [tamilChannels, debouncedQuery]);

  // Search Global Channels
  const matchingGlobalChannels = useMemo(() => {
    return debouncedQuery ? searchChannels(globalChannels, debouncedQuery) : [];
  }, [globalChannels, debouncedQuery]);

  const totalResults = matchingTamilChannels.length + matchingGlobalChannels.length;
  const isLoading = globalLoading && tamilLoading;

  return (
    <div className="page-container pt-6 sm:pt-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/30 bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Unified Live Stream Search</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Search Live Channels</h1>
        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Search all verified Tamil Live TV broadcasts and over 11,000 global channels instantly.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3.5 sm:max-w-2xl shadow-xl backdrop-blur-xl focus-within:border-primary/60 focus-within:bg-white/[0.07] transition">
        <SearchIcon className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by channel name (e.g. Sun TV, Vijay, BBC, Sky Sports, News)…"
          aria-label="Search channels"
          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white transition"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Filter Chips */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs text-white/40">Suggested:</span>
        {QUICK_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setQuery(f)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-xs text-white/70 hover:border-primary/50 hover:bg-primary/10 hover:text-white transition"
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ChannelGridSkeleton count={12} />
      ) : !debouncedQuery ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState
            icon={SearchIcon}
            title="Start typing to explore"
            description="Search channels across Tamil Live TV, global news, sports, entertainment, movies, and music."
          />
        </div>
      ) : totalResults === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState
            title="No channels found"
            description={`Nothing matched "${debouncedQuery}". Try refining your keywords.`}
          />
        </div>
      ) : (
        <div className="space-y-10">
          {/* 1. Verified Tamil Live TV Channels Section (if any match) */}
          {matchingTamilChannels.length > 0 && (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    <Radio className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Verified Tamil Live Channels
                  </h2>
                  <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
                    {matchingTamilChannels.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>100% Playable & Healthy</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {matchingTamilChannels.map((ch) => (
                  <TamilChannelCard key={ch.id} channel={ch} />
                ))}
              </div>
            </div>
          )}

          {/* 2. Global IPTV Channels Section (if any match) */}
          {matchingGlobalChannels.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Global Broadcast Channels
                  </h2>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">
                    {matchingGlobalChannels.length}
                  </span>
                </div>
              </div>

              <ChannelGrid channels={matchingGlobalChannels} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}


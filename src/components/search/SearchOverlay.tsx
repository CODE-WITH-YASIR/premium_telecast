"use client";

import { useEffect, useMemo, useRef, useState, useDeferredValue, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ChevronRight,
  Tv,
  Radio,
  Sparkles,
  Zap,
  ShieldCheck,
  Film,
  Music,
  Newspaper,
  Gamepad2,
  Trophy,
} from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { useTamilChannels } from "@/hooks/useTamilChannels";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import type { Channel } from "@/lib/iptv/types";
import type { TamilChannel } from "@/lib/tamil/types";

interface UnifiedSearchItem {
  id: string;
  name: string;
  logo?: string | null;
  category?: string;
  country?: string;
  language?: string;
  resolution?: string;
  isTamil: boolean;
  verified?: boolean;
  href: string;
  searchTokens: string;
}

const POPULAR_SEARCHES = [
  "Tamil TV",
  "Sun TV",
  "Vijay TV",
  "KTV",
  "Polimer News",
  "Zee Tamil",
  "Sports",
  "News",
  "Movies",
  "Music",
  "Kids",
];

const SEARCH_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tamil", label: "Tamil TV", badge: "Live" },
  { id: "news", label: "News", icon: Newspaper },
  { id: "movies", label: "Movies", icon: Film },
  { id: "music", label: "Music", icon: Music },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "kids", label: "Kids", icon: Gamepad2 },
];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { channels: globalChannels } = useChannels();
  const { channels: tamilChannels } = useTamilChannels({ category: "all" });

  const [query, setQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Deferred query for instantaneous, 120 FPS typing without input lag
  const deferredQuery = useDeferredValue(query);

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Focus input and reset state on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedFilter("all");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Combine and index all channels into a memoized search index
  const unifiedCatalogue = useMemo<UnifiedSearchItem[]>(() => {
    const list: UnifiedSearchItem[] = [];

    // 1. Verified Tamil channels
    for (const t of tamilChannels) {
      list.push({
        id: t.id,
        name: t.name,
        logo: t.logo_url,
        category: t.category,
        country: "IN",
        language: "Tamil",
        resolution: t.resolution || "1080p",
        isTamil: true,
        verified: t.verified ?? true,
        href: `/tamil/${t.id}`,
        searchTokens: `${t.name} ${t.category} tamil ${t.normalized_name || ""} india hd live`.toLowerCase(),
      });
    }

    // 2. Global IPTV channels
    for (const g of globalChannels) {
      list.push({
        id: g.id,
        name: g.name,
        logo: g.logo,
        category: g.group || "Live TV",
        country: g.country,
        language: g.language,
        resolution: "HD",
        isTamil: (g.language?.toLowerCase() === "tamil" || g.name.toLowerCase().includes("tamil")),
        verified: false,
        href: `/channel/${g.id}`,
        searchTokens: `${g.name} ${g.group || ""} ${g.country || ""} ${g.language || ""}`.toLowerCase(),
      });
    }

    return list;
  }, [tamilChannels, globalChannels]);

  // High-performance search and ranking algorithm
  const results = useMemo<UnifiedSearchItem[]>(() => {
    const trimmed = deferredQuery.trim().toLowerCase();
    const filter = selectedFilter.toLowerCase();

    if (!trimmed && filter === "all") {
      return [];
    }

    const queryTokens = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
    const isTamilSearch = queryTokens.some((t) => t.includes("tamil") || t.includes("tam"));

    const scored: Array<{ item: UnifiedSearchItem; score: number }> = [];

    for (const item of unifiedCatalogue) {
      // Category filter check
      if (filter !== "all") {
        if (filter === "tamil") {
          if (!item.isTamil) continue;
        } else {
          const itemCat = item.category?.toLowerCase() || "";
          if (!itemCat.includes(filter)) continue;
        }
      }

      if (queryTokens.length === 0) {
        // Just filtering by category without query
        scored.push({ item, score: item.isTamil ? 100 : 50 });
        continue;
      }

      const itemName = item.name.toLowerCase();
      let score = 0;

      // Exact name match
      if (itemName === trimmed) {
        score += 1000;
      } else if (itemName.startsWith(trimmed)) {
        score += 500;
      } else if (itemName.includes(trimmed)) {
        score += 250;
      }

      // Token matching
      let allTokensMatch = true;
      for (const tok of queryTokens) {
        if (item.searchTokens.includes(tok)) {
          score += 60;
          if (itemName.includes(tok)) score += 80;
        } else {
          allTokensMatch = false;
          break;
        }
      }

      if (!allTokensMatch && score === 0) {
        continue;
      }

      // Ranking boost for Tamil channels when searching Tamil keywords
      if (item.isTamil) {
        score += 40;
        if (isTamilSearch) score += 400;
        if (item.verified) score += 50;
      }

      scored.push({ item, score });
    }

    // Sort descending by score
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.name.localeCompare(b.item.name, undefined, { sensitivity: "base" });
    });

    // Cap to top 40 results for instantaneous rendering & smooth scrolling
    return scored.slice(0, 40).map((s) => s.item);
  }, [unifiedCatalogue, deferredQuery, selectedFilter]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Scroll active item into view during keyboard navigation
  const scrollToActiveItem = useCallback((index: number) => {
    const el = itemRefs.current.get(index);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.min(prev + 1, results.length - 1);
          scrollToActiveItem(next);
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          scrollToActiveItem(next);
          return next;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = results[activeIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, activeIndex, router, onClose, scrollToActiveItem]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search channels"
      className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-3xl animate-in fade-in duration-200 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 min-h-0 h-full max-h-screen flex-col px-3.5 pt-4 pb-4 sm:px-6 sm:pt-10 sm:pb-6 overflow-hidden">
        {/* Search Header Bar */}
        <div className="relative flex shrink-0 items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.07] px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-2xl backdrop-blur-2xl focus-within:border-primary/70 focus-within:bg-white/[0.1] focus-within:ring-2 focus-within:ring-primary/40 transition">
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Tamil TV, Sun TV, Vijay, News, Sports, 11,000+ Channels…"
            aria-label="Search channels"
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-white/40 focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="hidden rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-mono text-white/60 hover:bg-white/10 hover:text-white sm:inline-flex items-center"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="mt-3 flex shrink-0 items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory touch-pan-x">
          {SEARCH_CATEGORIES.map((cat) => {
            const active = selectedFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedFilter(cat.id)}
                className={`shrink-0 snap-start inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition backdrop-blur-lg ${
                  active
                    ? "bg-primary text-black font-bold shadow-md shadow-primary/25"
                    : "border border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {cat.id === "tamil" && <Radio className="h-3 w-3 animate-pulse text-amber-950" />}
                <span>{cat.label}</span>
                {cat.id === "tamil" && !active && (
                  <span className="rounded bg-orange-500/20 px-1 py-0.2 text-[9px] font-bold text-orange-400">
                    88
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Suggestion Pills when query is empty */}
        {!query && selectedFilter === "all" && (
          <div className="mt-4 flex shrink-0 flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-white/40">Trending:</span>
            {POPULAR_SEARCHES.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setQuery(tag);
                  inputRef.current?.focus();
                }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70 hover:border-primary/40 hover:bg-primary/10 hover:text-white transition"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Results List Container - Fully Optimized for Touch & Smooth Scrolling */}
        <div
          ref={listContainerRef}
          className="mt-3 flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y pb-6 pr-1.5 scroll-smooth"
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          {(deferredQuery || selectedFilter !== "all") && (
            <div className="mb-2.5 flex items-center justify-between text-xs text-white/50 px-1">
              <span>
                Found <strong className="text-white font-semibold">{results.length}</strong> channel
                {results.length === 1 ? "" : "s"}
              </span>
              <span className="hidden sm:inline">Use ↑ ↓ to navigate · ↵ to stream</span>
            </div>
          )}

          {/* Empty State */}
          {(deferredQuery || selectedFilter !== "all") && results.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center backdrop-blur-xl">
              <Tv className="mx-auto h-12 w-12 text-white/20" />
              <h3 className="mt-3 text-base font-semibold text-white">No channels found</h3>
              <p className="mt-1 text-xs text-white/50">
                Nothing matched &quot;{deferredQuery}&quot; in category &quot;{selectedFilter}&quot;. Try searching for &quot;Tamil&quot;, &quot;Sun TV&quot;, &quot;Vijay&quot;, or &quot;News&quot;.
              </p>
            </div>
          )}

          {/* Channels List */}
          <div className="flex flex-col gap-1.5">
            {results.map((channel, i) => {
              const isSelected = i === activeIndex;
              return (
                <button
                  key={`${channel.id}-${i}`}
                  ref={(el) => {
                    if (el) itemRefs.current.set(i, el);
                    else itemRefs.current.delete(i);
                  }}
                  type="button"
                  onClick={() => {
                    router.push(channel.href);
                    onClose();
                  }}
                  className={`group flex w-full items-center gap-3.5 rounded-2xl p-3 text-left transition duration-150 active:scale-[0.99] ${
                    isSelected
                      ? "bg-primary/20 border border-primary/50 shadow-lg shadow-primary/10"
                      : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-white/15"
                  }`}
                >
                  {/* Channel Logo */}
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/50 p-1.5 border border-white/10 shadow-inner">
                    <ChannelLogo
                      src={channel.logo}
                      alt={channel.name}
                      className="h-full w-full object-contain"
                    />
                    {channel.isTamil && (
                      <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[8px] font-black text-black ring-2 ring-black">
                        T
                      </span>
                    )}
                  </div>

                  {/* Channel Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate text-sm font-bold ${
                          isSelected ? "text-primary" : "text-white group-hover:text-primary transition"
                        }`}
                      >
                        {channel.name}
                      </p>

                      {channel.isTamil ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 px-1.5 py-0.5 text-[9px] font-bold text-orange-400">
                          <Radio className="h-2.5 w-2.5 animate-pulse" />
                          Tamil Live TV
                        </span>
                      ) : (
                        channel.country && (
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-white/60 uppercase">
                            {channel.country}
                          </span>
                        )
                      )}

                      {channel.resolution && (
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-white/50">
                          {channel.resolution}
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 truncate text-xs text-white/50">
                      {[
                        channel.category,
                        channel.isTamil ? "Verified Stream" : channel.language,
                        channel.isTamil ? "100% Playable" : channel.country,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center gap-1.5 text-xs text-white/40 group-hover:text-primary transition shrink-0">
                    <span className="hidden sm:inline text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition">
                      Watch Live
                    </span>
                    <ChevronRight className={`h-4 w-4 ${isSelected ? "text-primary" : "text-white/30"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


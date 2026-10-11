"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart, ArrowLeft, Search, Trash2, Radio, Sparkles, Tv, X } from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/context/AuthContext";
import { ChannelGrid } from "@/components/channel/ChannelGrid";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export default function FavoritesPage() {
  const { channels, loading } = useChannels();
  const { favoriteIds } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const [filterQuery, setFilterQuery] = useState("");

  const favoriteChannels = useMemo(
    () => channels.filter((c) => favoriteIds.includes(c.id)),
    [channels, favoriteIds]
  );

  const displayedFavorites = useMemo(() => {
    if (!filterQuery.trim()) return favoriteChannels;
    const q = filterQuery.toLowerCase().trim();
    return favoriteChannels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.group?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q)
    );
  }, [favoriteChannels, filterQuery]);

  return (
    <div className="mx-auto max-w-[1680px] px-3 py-6 sm:px-6 sm:py-8 pb-24">
      <Link
        href="/live"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Live TV</span>
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500/25 to-pink-500/10 border border-rose-500/35 text-rose-400 shadow-lg shadow-rose-500/15">
            <Heart className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isAuthenticated ? `${user?.name}’s Favorites` : "Your Favorite Channels"}
            </h1>
            <p className="text-xs text-white/60 mt-0.5">
              {favoriteChannels.length} channel{favoriteChannels.length === 1 ? "" : "s"} saved for instant one-click streaming
            </p>
          </div>
        </div>

        {/* Telemetry Status Badge */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/75 backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isAuthenticated ? `Account: ${user?.email}` : "Saved Locally (Zero Cloud Lag)"}</span>
          </div>
        </div>
      </div>

      {/* Quick Search within Favorites (if user has > 4 channels) */}
      {favoriteChannels.length > 4 && (
        <div className="mb-6 relative max-w-sm">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-white/40" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search saved channels…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/40 focus:border-primary/60 focus:outline-none"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-2.5 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {loading ? (
        <ChannelGridSkeleton count={8} />
      ) : favoriteChannels.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">No favorite channels yet</h2>
          <p className="mt-1.5 text-xs text-white/60 max-w-md mx-auto">
            Tap the heart icon on any broadcast or Tamil channel to bookmark it here for instant one-click streaming.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/live"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-black hover:bg-primary-hover transition shadow-lg shadow-primary/20"
            >
              <Tv className="h-4 w-4" />
              <span>Browse Live Channels</span>
            </Link>
            <Link
              href="/tamil"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              <Sparkles className="h-4 w-4 text-orange-400" />
              <span>Explore Tamil TV</span>
            </Link>
          </div>
        </div>
      ) : displayedFavorites.length === 0 ? (
        <div className="py-12 text-center text-xs text-white/50">
          No saved channels match &quot;{filterQuery}&quot;
        </div>
      ) : (
        <ChannelGrid channels={displayedFavorites} />
      )}
    </div>
  );
}

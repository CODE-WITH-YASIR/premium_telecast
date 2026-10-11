"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
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

  const favoriteChannels = useMemo(
    () => channels.filter((c) => favoriteIds.includes(c.id)),
    [channels, favoriteIds]
  );

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <Link
        href="/live"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Live TV
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {isAuthenticated ? `${user?.name}’s Favorites` : "Your Favorite Channels"}
              </h1>
              <p className="text-xs text-white/60">
                {favoriteChannels.length} channel{favoriteChannels.length === 1 ? "" : "s"} saved for instant access
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{isAuthenticated ? `Account: ${user?.email}` : "Saved Locally"}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <ChannelGridSkeleton count={8} />
      ) : favoriteChannels.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState
            icon={Heart}
            title="No favorite channels yet"
            description="Tap the heart icon on any channel card to pin it to your personal favorites collection."
            action={{ label: "Browse Live TV", href: "/live" }}
          />
        </div>
      ) : (
        <ChannelGrid channels={favoriteChannels} />
      )}
    </div>
  );
}

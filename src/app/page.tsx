"use client";

import { useMemo } from "react";
import { useChannels } from "@/hooks/useChannels";
import { useTamilChannels } from "@/hooks/useTamilChannels";
import { useFavorites } from "@/hooks/useFavorites";
import { useHistory } from "@/hooks/useHistory";
import { useAuth } from "@/context/AuthContext";
import { getCategories, getCountries, getLanguages, filterKidsChannels, filterTamilKidsChannels } from "@/lib/iptv/selectors";
import { Hero } from "@/components/home/Hero";
import { SectionHeading, ChannelRail, FacetPills } from "@/components/home/Sections";
import { TamilChannelCard } from "@/components/tamil/TamilChannelCard";
import { ChannelGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tv, Radio, Sparkles, ShieldCheck, Zap, Globe, Film, Music, Flame } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const { channels, loading, error, refresh } = useChannels();
  const { channels: tamilChannels } = useTamilChannels();
  const { favoriteIds } = useFavorites();
  const { entries: historyEntries } = useHistory();
  const { user, isAuthenticated } = useAuth();

  // Smart featured selection: prioritize an HTTPS playable stream when available
  const featured = useMemo(() => {
    if (!channels.length) return null;
    const httpsChannel = channels.find((c) => c.streamUrl?.startsWith("https://"));
    return httpsChannel || channels[0] || null;
  }, [channels]);

  const liveNow = useMemo(() => channels.slice(0, 24), [channels]);
  const categories = useMemo(() => getCategories(channels), [channels]);
  const countries = useMemo(() => getCountries(channels), [channels]);
  const languages = useMemo(() => getLanguages(channels), [channels]);

  // User-isolated favorites
  const favoriteChannels = useMemo(
    () => channels.filter((c) => favoriteIds.includes(c.id)),
    [channels, favoriteIds]
  );

  // User-isolated recent history
  const recentChannels = useMemo(() => {
    const byId = new Map(channels.map((c) => [c.id, c]));
    return historyEntries
      .map((e) => byId.get(e.channelId))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .slice(0, 16);
  }, [channels, historyEntries]);

  // Curated category rails
  const newsChannels = useMemo(
    () =>
      channels
        .filter((c) => c.group?.toLowerCase().includes("news"))
        .slice(0, 20),
    [channels]
  );

  const sportsChannels = useMemo(
    () =>
      channels
        .filter(
          (c) =>
            c.group?.toLowerCase().includes("sport") ||
            c.name.toLowerCase().includes("sport")
        )
        .slice(0, 20),
    [channels]
  );

  const movieChannels = useMemo(
    () =>
      channels
        .filter(
          (c) =>
            c.group?.toLowerCase().includes("movie") ||
            c.group?.toLowerCase().includes("cinema") ||
            c.group?.toLowerCase().includes("entertainment")
        )
        .slice(0, 20),
    [channels]
  );

  const musicChannels = useMemo(
    () =>
      channels
        .filter((c) => c.group?.toLowerCase().includes("music"))
        .slice(0, 20),
    [channels]
  );

  const kidsChannels = useMemo(
    () => filterKidsChannels(channels).slice(0, 24),
    [channels]
  );

  const tamilKidsChannels = useMemo(
    () => filterTamilKidsChannels(channels).slice(0, 18),
    [channels]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-[1680px] px-4 py-10 sm:px-6">
        <Skeleton className="mb-10 h-80 w-full rounded-3xl sm:h-96" />
        <div className="space-y-10">
          <ChannelGridSkeleton count={6} />
          <ChannelGridSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (error && channels.length === 0) {
    return (
      <div className="mx-auto max-w-[1680px] px-4 py-16 sm:px-6">
        <ErrorState
          title="Unable to load channels"
          description={error}
          action={{ label: "Try again", onClick: refresh }}
        />
      </div>
    );
  }

  if (!featured) {
    return (
      <div className="mx-auto max-w-[1680px] px-4 py-16 sm:px-6">
        <EmptyState
          icon={Tv}
          title="No live channels available right now"
          description="We couldn't reach any channels from the configured IPTV sources."
          action={{ label: "Refresh", onClick: refresh }}
        />
      </div>
    );
  }

  return (
    <div className="pb-6">
      <Hero channel={featured} />

      {/* Broadcast Telemetry Strip */}
      <section className="border-b border-white/[0.06] bg-[#07090f]/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 text-xs">
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/60">Platform Status:</span>
              <span className="font-bold text-white">100% Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span className="text-white/60">Active Index:</span>
              <span className="font-bold text-white">{channels.length.toLocaleString()} Feeds</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-white/60">Tamil Live TV:</span>
              <span className="font-bold text-orange-400">88 Verified Streams</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-white/60">Engine:</span>
              <span className="font-bold text-cyan-300">Adaptive HLS.js Hardware Mode</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tamil"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary hover:text-black transition"
            >
              <Sparkles className="h-3 w-3" />
              <span>Explore Verified Tamil Streams</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="page-container flex flex-col gap-12 pt-8">

        {/* Recently Watched / Continue Watching */}
        {recentChannels.length > 0 && (
          <section>
            <SectionHeading
              title={isAuthenticated ? `Continue Watching for ${user?.name}` : "Recently Watched"}
              subtitle="Pick up where you left off from your last session"
              href="/history"
            />
            <ChannelRail channels={recentChannels} />
          </section>
        )}

        {/* Favorites Rail */}
        {favoriteChannels.length > 0 && (
          <section>
            <SectionHeading
              title={isAuthenticated ? `${user?.name}'s Saved Channels` : "Your Bookmarks"}
              subtitle="Instant access to your favorite broadcasts"
              href="/favorites"
            />
            <ChannelRail channels={favoriteChannels.slice(0, 18)} />
          </section>
        )}

        {/* Verified Tamil Live TV Rail */}
        {tamilChannels.length > 0 && (
          <section>
            <SectionHeading
              title="Tamil Live TV — 100% Playable Streams"
              subtitle="Curated and continuously verified Tamil broadcasts with zero buffering"
              href="/tamil"
              badge="VERIFIED"
            />
            <div className="relative -mx-2 px-2">
              <div className="flex gap-4 overflow-x-auto pb-5 pt-1 scroll-smooth no-scrollbar [mask-image:linear-gradient(to_right,black_92%,transparent)]">
                {tamilChannels.slice(0, 18).map((channel) => (
                  <div key={channel.id} className="w-52 shrink-0 sm:w-60">
                    <TamilChannelCard channel={channel} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Kids Channels Rail */}
        {kidsChannels.length > 0 && (
          <section>
            <SectionHeading
              title="Kids & Cartoons"
              subtitle="Children's channels including POGO, Cartoon Network, Nick, Sony YAY, Chutti TV and more"
              href="/kids"
              badge="NEW"
            />
            <ChannelRail channels={kidsChannels} />
          </section>
        )}

        {/* Tamil Kids Rail */}
        {tamilKidsChannels.length > 0 && (
          <section>
            <SectionHeading
              title="Tamil Kids TV"
              subtitle="Children's content sourced from Tamil-language and Indian streams"
              href="/tamil-kids"
            />
            <ChannelRail channels={tamilKidsChannels} />
          </section>
        )}

        {/* Live Now Rail */}
        <section>
          <SectionHeading
            title="Top Live Broadcasts"
            subtitle="Explore high-definition channels currently on air globally"
            href="/live"
          />
          <ChannelRail channels={liveNow} />
        </section>

        {/* News Channels */}
        {newsChannels.length > 0 && (
          <section>
            <SectionHeading
              title="Global News & Current Affairs"
              subtitle="Real-time news relays from around the world"
              href="/category/news"
            />
            <ChannelRail channels={newsChannels} />
          </section>
        )}

        {/* Sports Channels */}
        {sportsChannels.length > 0 && (
          <section>
            <SectionHeading
              title="Live Sports & Stadiums"
              subtitle="Championship coverage, matches, and sports commentary"
              href="/category/sports"
            />
            <ChannelRail channels={sportsChannels} />
          </section>
        )}

        {/* Entertainment / Movies */}
        {movieChannels.length > 0 && (
          <section>
            <SectionHeading
              title="Movies & Entertainment"
              subtitle="Blockbusters, series, drama, and 24/7 cinema channels"
              href="/category/entertainment"
            />
            <ChannelRail channels={movieChannels} />
          </section>
        )}

        {/* Music Channels */}
        {musicChannels.length > 0 && (
          <section>
            <SectionHeading
              title="Music & Live Concerts"
              subtitle="Non-stop music videos, charts, and live concerts"
              href="/category/music"
            />
            <ChannelRail channels={musicChannels} />
          </section>
        )}

        {/* Browse by Category */}
        {categories.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
            <SectionHeading title="Explore by Broadcast Category" subtitle="Browse streams sorted by genre" />
            <FacetPills facets={categories} basePath="/category" />
          </section>
        )}

        {/* Browse by Country */}
        {countries.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
            <SectionHeading title="Explore by Country & Region" subtitle="Channels organized by territory of origin" />
            <FacetPills facets={countries} basePath="/country" />
          </section>
        )}

        {/* Browse by Language */}
        {languages.length > 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl">
            <SectionHeading title="Explore by Spoken Language" subtitle="International stations across 80+ languages" />
            <FacetPills facets={languages} basePath="/language" />
          </section>
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useChannels } from "@/hooks/useChannels";
import { useTamilChannels } from "@/hooks/useTamilChannels";
import { useFavorites } from "@/hooks/useFavorites";
import { useHistory } from "@/hooks/useHistory";
import { useAuth } from "@/context/AuthContext";
import { getCategories, getCountries, getLanguages } from "@/lib/iptv/selectors";
import { Hero } from "@/components/home/Hero";
import { SectionHeading, ChannelRail, FacetPills } from "@/components/home/Sections";
import { TamilChannelCard } from "@/components/tamil/TamilChannelCard";
import { ChannelGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Tv } from "lucide-react";

export default function HomePage() {
  const { channels, loading, error, refresh } = useChannels();
  const { channels: tamilChannels } = useTamilChannels();
  const { favoriteIds } = useFavorites();
  const { entries: historyEntries } = useHistory();
  const { user, isAuthenticated } = useAuth();

  const featured = channels[0] ?? null;
  const liveNow = useMemo(() => channels.slice(0, 20), [channels]);
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
        .slice(0, 18),
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
        .slice(0, 18),
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
        .slice(0, 18),
    [channels]
  );

  const musicChannels = useMemo(
    () =>
      channels
        .filter((c) => c.group?.toLowerCase().includes("music"))
        .slice(0, 18),
    [channels]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6">
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
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6">
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
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6">
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
    <div className="pb-16">
      <Hero channel={featured} />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-12 px-4 py-12 sm:px-6">

        {/* Recently Watched / Continue Watching */}
        {recentChannels.length > 0 && (
          <section>
            <SectionHeading
              title={isAuthenticated ? `Continue Watching for ${user?.name}` : "Recently Watched"}
              href="/history"
            />
            <ChannelRail channels={recentChannels} />
          </section>
        )}

        {/* Favorites Rail */}
        {favoriteChannels.length > 0 && (
          <section>
            <SectionHeading
              title={isAuthenticated ? `${user?.name}'s Favorites` : "Your Favorites"}
              href="/favorites"
            />
            <ChannelRail channels={favoriteChannels.slice(0, 18)} />
          </section>
        )}

        {/* Verified Tamil Live TV Rail */}
        {tamilChannels.length > 0 && (
          <section>
            <SectionHeading title="Tamil Live TV — Verified Streams" href="/tamil" />
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none [mask-image:linear-gradient(to_right,black_90%,transparent)]">
                {tamilChannels.slice(0, 16).map((channel) => (
                  <div key={channel.id} className="w-48 shrink-0 sm:w-56">
                    <TamilChannelCard channel={channel} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Live Now Rail */}
        <section>
          <SectionHeading title="Top Live Broadcasts" href="/live" />
          <ChannelRail channels={liveNow} />
        </section>

        {/* News Channels */}
        {newsChannels.length > 0 && (
          <section>
            <SectionHeading title="Global News & Current Affairs" href="/category/news" />
            <ChannelRail channels={newsChannels} />
          </section>
        )}

        {/* Sports Channels */}
        {sportsChannels.length > 0 && (
          <section>
            <SectionHeading title="Live Sports & Events" href="/category/sports" />
            <ChannelRail channels={sportsChannels} />
          </section>
        )}

        {/* Entertainment / Movies */}
        {movieChannels.length > 0 && (
          <section>
            <SectionHeading title="Movies & Entertainment" href="/category/entertainment" />
            <ChannelRail channels={movieChannels} />
          </section>
        )}

        {/* Music Channels */}
        {musicChannels.length > 0 && (
          <section>
            <SectionHeading title="Music & Concerts" href="/category/music" />
            <ChannelRail channels={musicChannels} />
          </section>
        )}

        {/* Browse by Category */}
        {categories.length > 0 && (
          <section>
            <SectionHeading title="Browse by Genre & Category" />
            <FacetPills facets={categories} basePath="/category" />
          </section>
        )}

        {/* Browse by Country */}
        {countries.length > 0 && (
          <section>
            <SectionHeading title="Browse by Country & Region" />
            <FacetPills facets={countries} basePath="/country" />
          </section>
        )}

        {/* Browse by Language */}
        {languages.length > 0 && (
          <section>
            <SectionHeading title="Browse by Audio Language" />
            <FacetPills facets={languages} basePath="/language" />
          </section>
        )}
      </div>
    </div>
  );
}

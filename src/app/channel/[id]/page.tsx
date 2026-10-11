"use client";

import { use, useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Radio } from "lucide-react";
import { useChannel } from "@/hooks/useChannel";
import { useChannels } from "@/hooks/useChannels";
import { useHistory } from "@/hooks/useHistory";
import { getSimilarChannels, getNextChannel } from "@/lib/iptv/selectors";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { FavoriteButton } from "@/components/channel/FavoriteButton";
import { LiveBadge } from "@/components/channel/LiveBadge";
import { UpNextSection, SimilarChannelsSection } from "@/components/channel/RelatedChannels";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export default function ChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { channel, loading, notFound } = useChannel(id);
  const { channels } = useChannels();
  const { recordWatch } = useHistory();
  const recordedChannelIdRef = useRef<string | null>(null);

  const similar = useMemo(
    () => (channel ? getSimilarChannels(channel, channels) : []),
    [channel, channels]
  );
  const nextChannel = useMemo(
    () => (channel ? getNextChannel(channel, channels) : null),
    [channel, channels]
  );

  useEffect(() => {
    if (channel && channel.id && recordedChannelIdRef.current !== channel.id) {
      recordedChannelIdRef.current = channel.id;
      void recordWatch(channel.id, channel.name, channel.logo);
    }
  }, [channel, recordWatch]);

  const [shared, setShared] = useState(false);
  const handleShare = useCallback(async () => {
    if (!channel) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: channel.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // User cancelled
    }
  }, [channel]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="mb-6 aspect-video w-full rounded-3xl" />
        <Skeleton className="mb-3 h-8 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    );
  }

  if (notFound || !channel) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState
            title="Channel not found"
            description="This channel may have been removed or updated in the global playlist."
            action={{ label: "Back to Live TV", href: "/live" }}
          />
        </div>
      </div>
    );
  }

  const meta = [channel.group, channel.country, channel.language].filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link
        href="/live"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Live TV
      </Link>

      {/* Main Cinematic Video Player */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
        <VideoPlayer streamUrl={channel.streamUrl} title={channel.name} />
      </div>

      {/* Channel Information Header Bar */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 shadow-inner">
              <ChannelLogo
                src={channel.logo}
                alt={`${channel.name} logo`}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-2.5">
                <LiveBadge size="sm" />
                <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider">
                  BROADCASTING
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {channel.name}
              </h1>
              {meta.length > 0 && (
                <p className="mt-1 text-xs text-white/60 font-medium">
                  {meta.join(" · ")}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <FavoriteButton
              channelId={channel.id}
              channelName={channel.name}
              variant="full"
              className="border-white/15 bg-white/[0.06] hover:bg-white/10 text-xs py-2 px-3.5"
            />
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share channel link"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{shared ? "Copied Link!" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* Program Schedule & Broadcast Info */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Live Broadcast Information
            </h2>
          </div>
          <p className="mt-1.5 text-xs text-white/60 leading-relaxed">
            Real-time television broadcast stream active. Adaptive bitrate streaming enables continuous playback based on your device network bandwidth.
          </p>
        </div>
      </div>

      {/* Up Next & Similar Channels */}
      <div className="mt-10 flex flex-col gap-10">
        <UpNextSection channel={nextChannel} />
        <SimilarChannelsSection channels={similar} />
      </div>
    </div>
  );
}

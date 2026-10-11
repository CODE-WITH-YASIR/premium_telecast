"use client";

import { use, useEffect, useMemo, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Radio, AlertTriangle, ShieldCheck, Zap, Sparkles } from "lucide-react";
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

  const isMixedContent = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (window.location.protocol !== "https:") return false;
    return channel?.streamUrl?.startsWith("http://") ?? false;
  }, [channel]);

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
      <div className="page-container max-w-6xl pt-8">
        <Skeleton className="mb-6 aspect-video w-full rounded-3xl" />
        <Skeleton className="mb-3 h-8 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    );
  }

  if (notFound || !channel) {
    return (
      <div className="page-container max-w-4xl pt-16">
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
    <div className="page-container max-w-6xl pt-6 sm:pt-8">
      <Link
        href="/live"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)] hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Live TV</span>
      </Link>

      {/* Main Cinematic Video Player */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl">
        <VideoPlayer streamUrl={channel.streamUrl} title={channel.name} />
      </div>

      {/* Mixed Content Warning Alert Banner */}
      {isMixedContent && (
        <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              This stream uses unencrypted HTTP and may be blocked by modern browser HTTPS security.
            </span>
          </div>
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-1.5 font-bold text-black hover:bg-amber-300 transition shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Browse Secure HTTPS Channels</span>
          </Link>
        </div>
      )}

      {/* Channel Information Header Bar */}
      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-15 w-15 sm:h-17 sm:w-17 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] p-2.5 shadow-inner">
              <ChannelLogo
                src={channel.logo}
                alt={`${channel.name} logo`}
                className="h-full w-full object-contain filter drop-shadow-md"
              />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <LiveBadge size="sm" />
                <span className="text-xs font-mono text-emerald-400 font-bold tracking-wider">
                  BROADCASTING
                </span>
                {channel.streamUrl.startsWith("https://") && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    HTTPS SECURE
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {channel.name}
              </h1>
              {meta.length > 0 && (
                <p className="mt-1 text-xs text-white/60 font-medium">
                  {meta.join(" · ")}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <FavoriteButton
              channelId={channel.id}
              channelName={channel.name}
              variant="full"
              className="border-white/15 bg-white/[0.06] hover:bg-white/10 text-xs py-2 px-4 font-semibold"
            />
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share channel link"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08]"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{shared ? "Copied Link!" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* Program Schedule & Broadcast Info */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/70">
              Live Broadcast Telemetry
            </h2>
          </div>
          <p className="mt-1.5 text-xs text-white/60 leading-relaxed">
            Real-time television broadcast stream active. Adaptive bitrate streaming enables continuous playback based on your device network bandwidth with hardware acceleration.
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

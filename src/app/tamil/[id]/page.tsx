"use client";

import { use, useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Radio,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Sparkles,
  Tv,
} from "lucide-react";
import { TamilPlayer } from "@/components/tamil/TamilPlayer";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { FavoriteButton } from "@/components/channel/FavoriteButton";
import { LiveBadge } from "@/components/channel/LiveBadge";
import { useHistory } from "@/hooks/useHistory";
import { useTamilChannels } from "@/hooks/useTamilChannels";
import { TamilChannelCard } from "@/components/tamil/TamilChannelCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";
import { formatRelativeTime } from "@/lib/utils";
import { validatePogoOrChutti } from "@/lib/iptv/pogoChuttiValidator";
import type { TamilChannel, TamilStream } from "@/lib/tamil/types";

export default function TamilChannelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { recordWatch } = useHistory();
  const { channels: allTamilChannels } = useTamilChannels();

  const [channel, setChannel] = useState<TamilChannel | null>(null);
  const [streams, setStreams] = useState<TamilStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shared, setShared] = useState(false);

  const recordedIdRef = useRef<string | null>(null);

  const loadChannelData = useCallback(async () => {
    setLoading(true);
    try {
      const [chanRes, stRes] = await Promise.all([
        fetch(`/api/tamil/channels/${encodeURIComponent(id)}`),
        fetch(`/api/tamil/channels/${encodeURIComponent(id)}/streams`),
      ]);

      if (!chanRes.ok) {
        setNotFound(true);
        return;
      }

      const chanData = await chanRes.json();
      const stData = stRes.ok ? await stRes.json() : { streams: [] };

      const pogoChuttiCheck = validatePogoOrChutti({
        id: chanData.channel.id,
        name: chanData.channel.name,
        streamUrl: chanData.channel.source_url || "",
        sourceId: "tamil",
      });
      if (pogoChuttiCheck.isTargetChannel && !pogoChuttiCheck.isVisible) {
        setNotFound(true);
        return;
      }

      setChannel(chanData.channel);
      setStreams(
        stData.streams?.length > 0
          ? stData.streams
          : [
              {
                id: `${id}_primary`,
                channel_id: id,
                stream_url: chanData.channel.source_url,
                protocol: "https",
                active: true,
                health_status: chanData.channel.health_status,
                health_score: chanData.channel.health_score,
                resolution: chanData.channel.resolution,
                latency_ms: chanData.channel.latency_ms,
                last_checked_at: chanData.channel.last_checked_at,
              },
            ]
      );
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadChannelData();
  }, [loadChannelData]);

  // Record user watch history
  useEffect(() => {
    if (channel && channel.id && recordedIdRef.current !== channel.id) {
      recordedIdRef.current = channel.id;
      void recordWatch(channel.id, channel.name, channel.logo_url || undefined);
    }
  }, [channel, recordWatch]);

  const similarChannels = useMemo(() => {
    if (!channel) return [];
    return allTamilChannels
      .filter((c) => c.id !== channel.id && (c.category === channel.category || true))
      .slice(0, 6);
  }, [channel, allTamilChannels]);

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
            icon={Tv}
            title="Tamil Channel Not Found"
            description="This channel may have been disabled or updated in the live catalogue."
            action={{ label: "Back to Tamil TV", href: "/tamil" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-6xl pt-4 sm:pt-6">
      <Link
        href="/tamil"
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)] hover:text-white transition active:scale-95"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Tamil Live TV</span>
      </Link>

      {/* Main Failover Video Player */}
      <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-black shadow-2xl">
        <TamilPlayer streams={streams} title={channel.name} />
      </div>

      {/* Channel Information Header */}
      <div className="mt-4 sm:mt-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-white/10 bg-black/40 p-2 shadow-inner">
              <ChannelLogo
                src={channel.logo_url}
                alt={`${channel.name} logo`}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-1.5 sm:gap-2">
                <LiveBadge size="sm" />
                <span className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  VERIFIED STREAM
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white sm:text-3xl">
                {channel.name}
              </h1>
              <p className="mt-0.5 text-[11px] sm:text-xs text-white/60 font-medium">
                {channel.category} · Tamil Live Broadcast {channel.resolution ? `· ${channel.resolution}` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <FavoriteButton
              channelId={channel.id}
              channelName={channel.name}
              channelLogo={channel.logo_url || undefined}
              variant="full"
              className="border-white/15 bg-white/[0.06] hover:bg-white/10 text-xs py-1.5 px-3 sm:py-2 sm:px-3.5"
            />
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08] active:scale-95"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{shared ? "Copied!" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* Stream Health & Availability Status Bar */}
        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-6 border-t border-white/10 pt-3 sm:pt-4 text-[11px] sm:text-xs text-white/60">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Radio className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
            <span>Health: <strong className="text-emerald-400">Online</strong></span>
          </div>

          {channel.latency_ms && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400 shrink-0" />
              <span>Latency: <strong className="text-white font-mono">{channel.latency_ms}ms</strong></span>
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
            <span>Streams: <strong className="text-white font-mono">{streams.length}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/40 shrink-0" />
            <span suppressHydrationWarning className="truncate">
              Checked: <strong className="text-white/80 font-mono">{formatRelativeTime(channel.last_checked_at)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Similar Tamil Channels */}
      {similarChannels.length > 0 && (
        <div className="mt-8 sm:mt-12">
          <h2 className="text-lg font-bold tracking-tight text-white sm:text-2xl">
            More Tamil Channels
          </h2>
          <p className="text-xs text-white/60 mt-0.5">Explore other verified live Tamil streams</p>

          <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {similarChannels.map((c) => (
              <TamilChannelCard key={c.id} channel={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

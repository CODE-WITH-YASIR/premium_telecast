import Link from "next/link";
import { Play, Sparkles, Tv, Radio, Info } from "lucide-react";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { LiveBadge } from "@/components/channel/LiveBadge";
import { FavoriteButton } from "@/components/channel/FavoriteButton";
import type { Channel } from "@/lib/iptv/types";

export function Hero({ channel }: { channel: Channel }) {
  const meta = [channel.group, channel.country, channel.language].filter(Boolean).join(" · ");

  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#07080c]">
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-[#0e1017]/80 to-[#07080c] z-0" />
      <div className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 h-80 w-80 rounded-full bg-sky-500/10 blur-[140px] pointer-events-none" />

      {/* Grid Pattern overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-10 px-4 py-16 sm:px-6 sm:py-24 md:flex-row md:items-center md:justify-between">
        {/* Left: Headline & Actions */}
        <div className="flex flex-1 flex-col items-start gap-6 max-w-2xl">
          <div className="flex items-center gap-3">
            <LiveBadge size="md" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-primary" />
              Featured Broadcast
            </span>
          </div>

          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl drop-shadow-sm">
              {channel.name}
            </h1>
            {meta && (
              <p className="mt-3 text-base text-white/70 sm:text-lg font-medium">
                {meta}
              </p>
            )}
            <p className="mt-2 text-xs sm:text-sm text-white/50 max-w-lg leading-relaxed">
              Real-time television broadcast streamed worldwide with ultra-low latency and adaptive HLS playback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/live?channel=${channel.id}`}
              className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-[#ff8f3d] px-7 py-3.5 text-sm font-bold text-black shadow-xl shadow-primary/25 transition hover:brightness-110 active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Watch Live Now</span>
            </Link>

            <Link
              href={`/channel/${channel.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.12] hover:border-white/30"
            >
              <Info className="h-4 w-4 text-white/70" />
              <span>Channel Details</span>
            </Link>

            <FavoriteButton
              channelId={channel.id}
              channelName={channel.name}
              variant="full"
              className="border-white/15 bg-white/[0.06] backdrop-blur-xl px-5 py-3.5 text-sm font-semibold"
            />
          </div>

          {/* Feature Badges */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/10 text-xs text-white/60">
            <div className="flex items-center gap-1.5">
              <Tv className="h-3.5 w-3.5 text-primary" />
              <span>Adaptive 1080p Stream</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-emerald-400" />
              <span>Live Global Relay</span>
            </div>
          </div>
        </div>

        {/* Right: Liquid Glass Channel Hologram Card */}
        <div className="w-full max-w-md shrink-0 md:w-[420px]">
          <div className="relative group overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-2xl backdrop-blur-2xl transition hover:border-primary/50">
            {/* Holographic specular highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent pointer-events-none" />

            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/40 p-6 flex items-center justify-center border border-white/10 shadow-inner">
              <ChannelLogo
                src={channel.logo}
                alt={`${channel.name} logo`}
                className="h-full w-full object-contain filter drop-shadow-md transition duration-300 group-hover:scale-110"
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-mono tracking-widest text-primary font-bold">
                  {channel.group || "IPTV Live"}
                </p>
                <p className="text-base font-bold text-white mt-0.5">{channel.name}</p>
              </div>
              <LiveBadge size="sm" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

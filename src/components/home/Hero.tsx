import Link from "next/link";
import { Play, Sparkles, Tv, Radio, Info, ShieldCheck, Zap } from "lucide-react";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { LiveBadge } from "@/components/channel/LiveBadge";
import { FavoriteButton } from "@/components/channel/FavoriteButton";
import type { Channel } from "@/lib/iptv/types";

export function Hero({ channel }: { channel: Channel }) {
  const meta = [channel.group, channel.country, channel.language].filter(Boolean).join(" · ");

  return (
    <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#050609]">
      {/* Cinematic Ambient Glow Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-[#0a0d16]/85 to-[#050609] z-0" />
      <div className="absolute -top-36 -left-24 h-[450px] w-[450px] rounded-full bg-primary/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 h-96 w-96 rounded-full bg-sky-500/15 blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-40" />

      <div className="relative z-10 mx-auto flex max-w-[1680px] flex-col gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:py-24 md:flex-row md:items-center md:justify-between">
        {/* Left: Headline, Metadata & Actions */}
        <div className="flex flex-1 flex-col items-start gap-6 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <LiveBadge size="md" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Featured Broadcast
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
              <Zap className="h-3 w-3" />
              1080p Ultra-HD
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white drop-shadow-md">
              {channel.name}
            </h1>
            {meta && (
              <p className="mt-3 text-sm sm:text-base text-white/70 font-medium">
                {meta}
              </p>
            )}
            <p className="mt-2 text-xs sm:text-sm text-white/50 max-w-xl leading-relaxed">
              Global television broadcast streamed directly in high-definition with adaptive HLS playback, hardware decoding, and zero latency.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/live?channel=${channel.id}`}
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-primary via-orange-500 to-[#ff8f3d] px-7 py-3.5 text-sm font-bold text-black shadow-xl shadow-primary/25 transition hover:brightness-110 active:scale-95"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20">
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </div>
              <span>Watch Live Now</span>
            </Link>

            <Link
              href={`/channel/${channel.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/[0.12] hover:border-white/30"
            >
              <Info className="h-4 w-4 text-white/70" />
              <span>Details</span>
            </Link>

            <FavoriteButton
              channelId={channel.id}
              channelName={channel.name}
              variant="full"
              className="border-white/15 bg-white/[0.06] backdrop-blur-xl px-5 py-3.5 text-sm font-semibold hover:border-rose-500/40"
            />
          </div>

          {/* Feature Badges & Telemetry */}
          <div className="flex flex-wrap items-center gap-5 pt-3 border-t border-white/10 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-primary" />
              <span>Adaptive HLS Stream</span>
            </div>
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-emerald-400" />
              <span>Global CDN Relay</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Verified Hardware Playback</span>
            </div>
          </div>
        </div>

        {/* Right: Liquid Glass Channel Hologram Card with Equalizer */}
        <div className="w-full max-w-md shrink-0 md:w-[440px]">
          <div className="relative group overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.09] via-white/[0.04] to-[#0a0d16]/90 p-7 shadow-2xl backdrop-blur-2xl transition hover:border-primary/50">
            {/* Holographic specular highlight */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.06] to-transparent pointer-events-none" />

            <div className="relative aspect-video overflow-hidden rounded-2xl bg-black/60 p-6 flex items-center justify-center border border-white/10 shadow-inner group-hover:border-primary/30 transition">
              <ChannelLogo
                src={channel.logo}
                alt={`${channel.name} logo`}
                className="h-full w-full object-contain filter drop-shadow-xl transition duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 backdrop-blur-md border border-white/10">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">ON AIR</span>
                <div className="flex items-end gap-0.5 h-3 ml-1">
                  <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-1" />
                  <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-2" />
                  <span className="w-0.5 bg-emerald-400 rounded-full eq-bar-3" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div>
                <span className="inline-block rounded-md bg-white/[0.07] px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary font-bold">
                  {channel.group || "IPTV Broadcast"}
                </span>
                <p className="text-base font-bold text-white mt-1 group-hover:text-primary transition-colors">
                  {channel.name}
                </p>
              </div>
              <LiveBadge size="sm" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

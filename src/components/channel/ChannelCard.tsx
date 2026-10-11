import { memo } from "react";
import Link from "next/link";
import { ChannelLogo } from "./ChannelLogo";
import { LiveBadge } from "./LiveBadge";
import { FavoriteButton } from "./FavoriteButton";
import type { Channel } from "@/lib/iptv/types";

interface ChannelCardProps {
  channel: Channel;
  onSelect?: (channel: Channel) => void;
  active?: boolean;
}

function ChannelCardInner({ channel, onSelect, active }: ChannelCardProps) {
  const meta = [channel.language, channel.country].filter(Boolean).join(" · ");

  const cardContent = (
    <>
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-b from-white/[0.04] to-black/60 p-4 flex items-center justify-center">
        <ChannelLogo
          src={channel.logo}
          alt={`${channel.name} logo`}
          className="h-full w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-108"
        />

        {/* Live status badge */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 z-10">
          <LiveBadge size="sm" />
        </div>

        {/* Stream quality indicator pill */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 z-10">
          <span className="rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] font-bold text-white/80 font-mono backdrop-blur-md border border-white/10">
            HD
          </span>
        </div>

        {/* Favorite toggle button */}
        <div className="absolute right-2.5 bottom-2.5 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
          <FavoriteButton
            channelId={channel.id}
            channelName={channel.name}
            className="h-7 w-7 border-white/20 bg-black/70 backdrop-blur-md shadow-md"
          />
        </div>

        {/* Specular shimmer overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" />
      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div>
          <h3 className="line-clamp-1 text-xs sm:text-sm font-bold text-white group-hover:text-primary transition-colors">
            {channel.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-white/50">
            {channel.group && (
              <span className="line-clamp-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-white/70 font-medium">
                {channel.group}
              </span>
            )}
            {meta && <span className="line-clamp-1 truncate">{meta}</span>}
          </div>
        </div>
      </div>
    </>
  );

  const containerClass = `group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-250 ${
    active
      ? "border-primary bg-primary/[0.08] shadow-[0_0_24px_rgba(255,107,53,0.35)] ring-1 ring-primary"
      : "border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-[#0a0d16]/80 backdrop-blur-md hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_16px_36px_-12px_rgba(255,107,53,0.25)] focus-visible:-translate-y-1"
  }`;

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => {
          onSelect(channel);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className={`${containerClass} text-left w-full`}
      >
        {cardContent}
      </button>
    );
  }

  return (
    <Link href={`/channel/${channel.id}`} className={containerClass}>
      {cardContent}
    </Link>
  );
}

export const ChannelCard = memo(ChannelCardInner, (prev, next) => {
  const a = prev.channel;
  const b = next.channel;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.logo === b.logo &&
    a.group === b.group &&
    a.language === b.language &&
    a.country === b.country &&
    prev.active === next.active &&
    prev.onSelect === next.onSelect
  );
});

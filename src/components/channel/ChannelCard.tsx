import { memo } from "react";
import Link from "next/link";
import { ChannelLogo } from "./ChannelLogo";
import { LiveBadge } from "./LiveBadge";
import { FavoriteButton } from "./FavoriteButton";
import type { Channel } from "@/lib/iptv/types";

interface ChannelCardProps {
  channel: Channel;
  onSelect?: (channel: Channel) => void;
}

function ChannelCardInner({ channel, onSelect }: ChannelCardProps) {
  const meta = [channel.language, channel.country].filter(Boolean).join(" · ");

  const cardContent = (
    <>
      <div className="relative aspect-video w-full overflow-hidden bg-white/[0.02]">
        <ChannelLogo
          src={channel.logo}
          alt={`${channel.name} logo`}
          className="h-full w-full p-5 object-contain transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <LiveBadge size="sm" />
        </div>
        <div className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <FavoriteButton
            channelId={channel.id}
            channelName={channel.name}
            className="h-7 w-7 border-white/20 bg-black/60 backdrop-blur-md"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-3">
        <h3 className="line-clamp-1 text-xs sm:text-sm font-semibold text-white group-hover:text-primary transition-colors">
          {channel.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/50">
          {channel.group && (
            <span className="line-clamp-1 rounded-md bg-white/[0.05] px-1.5 py-0.5 text-white/70">
              {channel.group}
            </span>
          )}
          {meta && <span className="line-clamp-1">{meta}</span>}
        </div>
      </div>
    </>
  );

  const containerClass =
    "group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_30px_-10px_rgba(255,107,53,0.25)] focus-visible:-translate-y-1";

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
    prev.onSelect === next.onSelect
  );
});

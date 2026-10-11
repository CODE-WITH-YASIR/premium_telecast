"use client";

import { useEffect, useRef, useState } from "react";
import { ChannelCard } from "./ChannelCard";
import type { Channel } from "@/lib/iptv/types";

const INITIAL_BATCH = 60;
const BATCH_SIZE = 60;

export function ChannelGrid({
  channels,
  onSelectChannel,
}: {
  channels: Channel[];
  onSelectChannel?: (channel: Channel) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [channels]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => Math.min(count + BATCH_SIZE, channels.length));
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [channels.length]);

  const visible = channels.slice(0, visibleCount);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {visible.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            onSelect={onSelectChannel}
          />
        ))}
      </div>
      {visibleCount < channels.length && (
        <div ref={sentinelRef} className="flex items-center justify-center py-10 text-xs text-white/40">
          Loading more live streams…
        </div>
      )}
    </div>
  );
}

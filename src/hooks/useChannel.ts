"use client";

import { useMemo } from "react";
import { useChannels } from "./useChannels";
import type { Channel } from "@/lib/iptv/types";

interface UseChannelResult {
  channel: Channel | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

/** Derives a single channel by id from the shared channel list — no separate fetch. */
export function useChannel(id: string): UseChannelResult {
  const { channels, loading, error } = useChannels();

  const channel = useMemo(() => channels.find((c) => c.id === id) ?? null, [channels, id]);

  return {
    channel,
    loading,
    error,
    notFound: !loading && channels.length > 0 && channel === null,
  };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import type { TamilCategory, TamilChannel } from "@/lib/tamil/types";

interface UseTamilChannelsOptions {
  category?: TamilCategory | "all";
  query?: string;
  autoRefresh?: boolean;
}

interface TamilChannelsState {
  channels: TamilChannel[];
  total: number;
  verifiedCount: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
  stats: {
    lastChecked: number | null;
    availabilityRate: number;
    averageLatencyMs: number;
  } | null;
}

export function useTamilChannels(options: UseTamilChannelsOptions = {}) {
  const { category = "all", query = "", autoRefresh = false } = options;

  const [state, setState] = useState<TamilChannelsState>({
    channels: [],
    total: 0,
    verifiedCount: 0,
    loading: true,
    refreshing: false,
    error: null,
    lastUpdated: null,
    stats: null,
  });

  const fetchChannels = useCallback(
    async (force = false) => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (category && category !== "all") params.set("category", category);
        if (force) params.set("force", "true");

        const res = await fetch(`/api/tamil/channels?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to load Tamil channels (HTTP ${res.status})`);
        }

        const data = await res.json();
        setState((prev) => ({
          channels: data.channels || [],
          total: data.total || 0,
          verifiedCount: data.verifiedCount || 0,
          loading: false,
          refreshing: false,
          error: null,
          lastUpdated: data.lastUpdated || Date.now(),
          stats: data.stats || null,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load Tamil channels";
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: prev.channels.length > 0 ? null : message,
        }));
      }
    },
    [category, query]
  );

  useEffect(() => {
    setState((prev) => ({ ...prev, loading: prev.channels.length === 0, refreshing: true }));
    void fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void fetchChannels(false);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchChannels]);

  return {
    ...state,
    refresh: () => fetchChannels(true),
  };
}

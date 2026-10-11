"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { channelStore } from "@/lib/iptv/store";

/**
 * Subscribes to the shared channel store. Every component that calls this
 * hook reads the exact same underlying dataset — there is only ever one
 * network request in flight for the playlist at a time, no matter how many
 * components call this hook simultaneously.
 *
 * The first component mounted (in practice the root layout provider) starts
 * the initial fetch + 60s visibility-aware polling; every other caller just
 * reads the resulting snapshot.
 */
export function useChannels() {
  const state = useSyncExternalStore(
    channelStore.subscribe,
    channelStore.getSnapshot,
    channelStore.getServerSnapshot
  );

  useEffect(() => {
    void channelStore.refresh();
    channelStore.startPolling();
    return () => {
      // Polling is intentionally left running across route changes within the
      // app (it's a module-level singleton) — only torn down if this were the
      // very last consumer, which in practice is the root provider unmounting
      // (e.g. HMR). Individual pages mounting/unmounting should not stop the
      // shared poller for the whole app.
    };
  }, []);

  const refresh = useCallback(() => channelStore.refresh({ force: true }), []);

  return {
    channels: state.channels,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    lastUpdated: state.lastUpdated,
    sourceResults: state.sourceResults,
    refresh,
  };
}

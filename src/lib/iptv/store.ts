"use client";

import { CACHE_TTL_MS, AUTO_REFRESH_INTERVAL_MS } from "./config";
import type { Channel, SourceResult } from "./types";

const CACHE_KEY = "premium-live-tv:channel-cache:v1";

interface ChannelsApiResponse {
  channels: Channel[];
  lastUpdated: number | null;
  sourceResults: SourceResult[];
  error: string | null;
}

/**
 * Fetches from our own /api/channels route — never the raw IPTV playlist
 * directly. The playlist itself is fetched and cached exactly once per TTL
 * window, server-side (lib/iptv/serverCache.ts), no matter how many browser
 * clients call this. This is what keeps 1000 concurrent users from turning
 * into 1000 separate playlist downloads against the upstream provider.
 */
async function fetchFromApi(signal: AbortSignal, force: boolean): Promise<ChannelsApiResponse> {
  const res = await fetch(`/api/channels${force ? "?force=true" : ""}`, {
    signal,
    cache: "no-store", // freshness is governed by the server-side cache, not the browser HTTP cache
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    throw new Error(`Rate limited — please wait${retryAfter ? ` ${retryAfter}s` : ""} and try again.`);
  }

  const body = (await res.json()) as ChannelsApiResponse;

  if (!res.ok && body.channels.length === 0) {
    throw new Error(body.error ?? `Request failed (HTTP ${res.status})`);
  }

  return body;
}

export interface ChannelStoreState {
  channels: Channel[];
  loading: boolean; // true only for the very first load with no data yet
  refreshing: boolean; // true while a background refresh is in flight
  error: string | null; // human-readable error from the most recent attempt
  sourceResults: SourceResult[];
  lastUpdated: number | null;
}

type Listener = () => void;

const SERVER_SNAPSHOT: ChannelStoreState = Object.freeze({
  channels: [],
  loading: true,
  refreshing: false,
  error: null,
  sourceResults: [],
  lastUpdated: null,
});

/**
 * Shared client-side channel store, implemented as a plain module-level
 * singleton consumed via useSyncExternalStore. All hooks/components read the
 * same snapshot, so the playlist is fetched once and shared everywhere
 * instead of every page independently re-fetching it.
 */
class ChannelStore {
  private state: ChannelStoreState = { ...SERVER_SNAPSHOT };

  private listeners = new Set<Listener>();
  private inFlight: Promise<void> | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private hydrated = false;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): ChannelStoreState => this.state;

  getServerSnapshot = (): ChannelStoreState => SERVER_SNAPSHOT;

  private setState(patch: Partial<ChannelStoreState>) {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }

  private hydrateFromCache() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        channels: Channel[];
        lastUpdated: number;
      };
      if (Array.isArray(parsed.channels) && parsed.channels.length > 0) {
        this.setState({
          channels: parsed.channels,
          lastUpdated: parsed.lastUpdated,
          loading: false,
        });
      }
    } catch {
      // Corrupted cache — ignore and fetch fresh. Never let a bad cache entry
      // crash the app.
    }
  }

  private persistToCache() {
    if (typeof window === "undefined") return;
    const channels = this.state.channels;
    const lastUpdated = this.state.lastUpdated;

    // Use requestIdleCallback / setTimeout so we never freeze UI thread during JSON operations
    const defer = typeof window.requestIdleCallback === "function" ? window.requestIdleCallback : setTimeout;
    defer(() => {
      try {
        // Store essential channel metadata safely
        const payload = JSON.stringify({
          channels: channels.slice(0, 1500),
          lastUpdated,
        });
        window.localStorage.setItem(CACHE_KEY, payload);
      } catch {
        // localStorage quota exceeded or private mode - continue safely in memory
      }
    });
  }

  /** Fetches fresh data. Concurrent calls reuse the same in-flight request. */
  async refresh(options: { force?: boolean } = {}): Promise<void> {
    this.hydrateFromCache();

    const isFresh =
      this.state.lastUpdated !== null && Date.now() - this.state.lastUpdated < CACHE_TTL_MS;
    if (isFresh && !options.force && this.state.channels.length > 0) {
      return;
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;

    const hasExistingData = this.state.channels.length > 0;
    this.setState({
      loading: !hasExistingData,
      refreshing: hasExistingData,
      error: null,
    });

    this.inFlight = (async () => {
      try {
        const result = await fetchFromApi(controller.signal, Boolean(options.force));

        if (result.error && result.channels.length === 0) {
          // Server had nothing usable to give us (upstream totally down, no
          // prior cache): never wipe good local data with []. Surface the
          // error but keep whatever channels we already had.
          this.setState({
            loading: false,
            refreshing: false,
            error:
              this.state.channels.length > 0
                ? `Unable to refresh channels (${result.error}). Showing previously loaded data.`
                : `Unable to load channels (${result.error}).`,
            sourceResults: result.sourceResults,
          });
          return;
        }

        this.setState({
          channels: result.channels,
          loading: false,
          refreshing: false,
          error: null,
          sourceResults: result.sourceResults,
          lastUpdated: result.lastUpdated,
        });
        this.persistToCache();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Unable to load channels.";
        this.setState({
          loading: false,
          refreshing: false,
          error:
            this.state.channels.length > 0
              ? `Unable to refresh channels (${message}). Showing previously loaded data.`
              : message,
        });
      } finally {
        this.inFlight = null;
      }
    })();

    return this.inFlight;
  }

  startPolling() {
    if (typeof window === "undefined") return;
    this.stopPolling();

    const tick = () => {
      if (document.visibilityState === "visible") {
        void this.refresh();
      }
      this.pollTimer = setTimeout(tick, AUTO_REFRESH_INTERVAL_MS);
    };
    this.pollTimer = setTimeout(tick, AUTO_REFRESH_INTERVAL_MS);

    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      void this.refresh();
    }
  };
}

export const channelStore = new ChannelStore();

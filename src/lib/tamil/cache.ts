import "server-only";
import { TAMIL_CONFIG } from "./config";
import { TamilHealthEngine } from "./engine";
import { tamilStore } from "./store";
import type { TamilChannel, TamilSyncStats } from "./types";

interface TamilCatalogSnapshot {
  channels: TamilChannel[];
  stats: TamilSyncStats;
  cachedAt: number;
}

let cachedSnapshot: TamilCatalogSnapshot | null = null;
let inFlightCache: Promise<TamilCatalogSnapshot> | null = null;

export async function getCachedTamilChannels(options: {
  force?: boolean;
} = {}): Promise<TamilCatalogSnapshot> {
  if (options.force) {
    cachedSnapshot = null;
    tamilStore.reloadFromDisk();
  }

  const now = Date.now();
  const isFresh =
    cachedSnapshot !== null &&
    now - cachedSnapshot.cachedAt < TAMIL_CONFIG.PUBLIC_CACHE_TTL_MS;

  if (isFresh && !options.force) {
    return cachedSnapshot as TamilCatalogSnapshot;
  }

  if (inFlightCache) {
    return inFlightCache;
  }

  inFlightCache = (async () => {
    try {
      if (options.force) {
        tamilStore.reloadFromDisk();
      }

      const stats = tamilStore.getSyncStats();

      // If store is completely empty, trigger initial sync
      if (stats.unique_channels === 0) {
        await TamilHealthEngine.syncPlaylist();
      }

      const verifiedChannels = tamilStore.getAllChannels(true);
      const updatedStats = tamilStore.getSyncStats();

      const snapshot: TamilCatalogSnapshot = {
        channels: verifiedChannels,
        stats: updatedStats,
        cachedAt: Date.now(),
      };

      cachedSnapshot = snapshot;
      return snapshot;
    } finally {
      inFlightCache = null;
    }
  })();

  return inFlightCache;
}

export function invalidateTamilCache(): void {
  cachedSnapshot = null;
  tamilStore.reloadFromDisk();
}

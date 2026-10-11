"use client";

import { useAuth, type HistoryItem } from "@/context/AuthContext";

export type HistoryEntry = HistoryItem;

/**
 * Provides access to user watch history.
 * Backed by AuthContext (database-persisted per user when authenticated,
 * local fallback for guest mode).
 */
export function useHistory() {
  const { history, recordWatch, removeHistoryEntry, clearHistory } = useAuth();

  return {
    entries: history,
    recordWatch,
    removeEntry: removeHistoryEntry,
    clearHistory,
  };
}

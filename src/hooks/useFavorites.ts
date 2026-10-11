"use client";

import { useAuth } from "@/context/AuthContext";

/**
 * Provides access to user favorites.
 * Backed by AuthContext (database-persisted per user when authenticated,
 * local fallback for guest mode).
 */
export function useFavorites() {
  const { favorites, isFavorite, toggleFavorite } = useAuth();

  return {
    favoriteIds: favorites,
    isFavorite,
    toggleFavorite,
    removeFavorite: toggleFavorite,
  };
}

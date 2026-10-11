"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteButton({
  channelId,
  channelName,
  channelLogo,
  className,
  variant = "icon",
}: {
  channelId: string;
  channelName: string;
  channelLogo?: string;
  className?: string;
  variant?: "icon" | "full";
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const active = mounted && isFavorite(channelId);

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(channelId);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${channelName} from favorites` : `Add ${channelName} to favorites`}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border transition active:scale-95",
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-black/40 text-white hover:border-border-hover hover:bg-black/60",
        variant === "icon" ? "h-9 w-9" : "px-4 py-2 text-sm font-medium",
        className
      )}
    >
      <Heart className="h-4 w-4" fill={active ? "currentColor" : "none"} aria-hidden="true" />
      {variant === "full" && (active ? "Favorited" : "Favorite")}
    </button>
  );
}

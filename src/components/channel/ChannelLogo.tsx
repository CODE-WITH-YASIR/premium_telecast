"use client";

import { useState } from "react";
import { Tv } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelLogoProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Renders a channel logo with a graceful, premium fallback.
 *
 * Never renders a broken browser image icon, raw alt text, or a raw URL:
 * a missing/invalid src, or an image that fails to load at runtime, falls
 * through to a neutral TV icon on a subtle gradient background instead.
 * Uses a plain <img> (not next/image) deliberately — logo URLs come from
 * arbitrary third-party IPTV metadata that can't be pre-registered with the
 * Next.js image optimizer's domain allowlist at build time.
 */
export function ChannelLogo({ src, alt, className, fallbackClassName }: ChannelLogoProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gradient-to-br from-surface-tertiary to-surface-secondary text-muted",
          className,
          fallbackClassName
        )}
        role="img"
        aria-label={alt}
      >
        <Tv className="h-1/3 w-1/3 min-h-4 min-w-4" aria-hidden="true" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party hosts, see comment above
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  );
}

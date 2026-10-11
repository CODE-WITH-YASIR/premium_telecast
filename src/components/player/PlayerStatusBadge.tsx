import { cn } from "@/lib/utils";

export type PlaybackBadgeStatus = "connecting" | "live" | "paused" | "error";

const CONFIG: Record<PlaybackBadgeStatus, { label: string; className: string; pulse: boolean }> = {
  connecting: { label: "Connecting…", className: "bg-white/15 text-white", pulse: false },
  live: { label: "Live", className: "bg-primary/90 text-black", pulse: true },
  paused: { label: "Paused", className: "bg-white/15 text-white", pulse: false },
  error: { label: "Stream Error", className: "bg-red-500/90 text-white", pulse: false },
};

/**
 * Reflects actual playback state — never shows "Live" just because a channel
 * was selected/navigated to. Only true once the <video> element is actually
 * decoding and playing frames.
 */
export function PlayerStatusBadge({
  status,
  className,
}: {
  status: PlaybackBadgeStatus;
  className?: string;
}) {
  const cfg = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        cfg.className,
        className
      )}
    >
      {cfg.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-black/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-black" />
        </span>
      )}
      {cfg.label}
    </span>
  );
}

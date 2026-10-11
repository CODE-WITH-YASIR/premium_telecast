import { cn } from "@/lib/utils";

export function LiveBadge({ className, size = "sm" }: { className?: string; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/90 font-semibold uppercase tracking-wide text-black",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-black/70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-black" />
      </span>
      Live
    </span>
  );
}

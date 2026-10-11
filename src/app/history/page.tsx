"use client";

import Link from "next/link";
import { History as HistoryIcon, X, ArrowLeft, Trash2 } from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { useAuth } from "@/context/AuthContext";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { EmptyState } from "@/components/ui/States";
import { formatRelativeTime } from "@/lib/utils";

export default function HistoryPage() {
  const { entries, removeEntry, clearHistory } = useHistory();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/live"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Live TV
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {isAuthenticated ? `${user?.name}’s Watch History` : "Watch History"}
            </h1>
            <p className="text-xs text-white/60">
              {entries.length} recently tuned channel{entries.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState
            icon={HistoryIcon}
            title="No recently watched channels"
            description="Channels you tune into will automatically be recorded here so you can pick up where you left off."
            action={{ label: "Browse Live Channels", href: "/live" }}
          />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li
              key={entry.channelId}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl hover:bg-white/[0.06] hover:border-primary/40 transition"
            >
              <Link
                href={`/channel/${entry.channelId}`}
                className="flex flex-1 items-center gap-4 min-w-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] p-2 border border-white/5">
                  <ChannelLogo
                    src={entry.logo}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white group-hover:text-primary transition">
                    {entry.name}
                  </p>
                  <p className="text-xs text-white/50">
                    Watched {formatRelativeTime(entry.watchedAt)}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <Link
                  href={`/live?channel=${entry.channelId}`}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-primary hover:text-black transition"
                >
                  Watch
                </Link>
                <button
                  type="button"
                  onClick={() => removeEntry(entry.channelId)}
                  aria-label={`Remove ${entry.name} from history`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

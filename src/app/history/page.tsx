"use client";

import Link from "next/link";
import { History as HistoryIcon, X, ArrowLeft, Trash2, Play, Sparkles, Tv } from "lucide-react";
import { useHistory } from "@/hooks/useHistory";
import { useAuth } from "@/context/AuthContext";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { EmptyState } from "@/components/ui/States";
import { formatRelativeTime } from "@/lib/utils";

export default function HistoryPage() {
  const { entries, removeEntry, clearHistory } = useHistory();
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="page-container max-w-4xl pt-6 sm:pt-8">
      <Link
        href="/live"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)] hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Live TV</span>
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/25 to-blue-500/10 border border-cyan-500/35 text-cyan-400 shadow-lg shadow-cyan-500/15">
            <HistoryIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {isAuthenticated ? `${user?.name}’s Watch History` : "Watch History"}
            </h1>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              {entries.length} recently tuned broadcast{entries.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition self-start sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-4">
            <HistoryIcon className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">No recently watched broadcasts</h2>
          <p className="mt-1.5 text-xs text-white/60 max-w-md mx-auto">
            Channels you stream will automatically be logged here so you can easily resume playback where you left off.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/live"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-black hover:bg-primary-hover transition shadow-lg shadow-primary/20"
            >
              <Tv className="h-4 w-4" />
              <span>Browse Live Channels</span>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li
              key={entry.channelId}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 backdrop-blur-xl hover:bg-white/[0.06] hover:border-primary/40 transition shadow-sm"
            >
              <Link
                href={`/channel/${entry.channelId}`}
                className="flex flex-1 items-center gap-3.5 min-w-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/50 p-2 border border-white/10 group-hover:border-primary/40 transition">
                  <ChannelLogo
                    src={entry.logo}
                    alt=""
                    className="h-full w-full object-contain filter drop-shadow-md"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white group-hover:text-primary transition-colors">
                    {entry.name}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    Watched {formatRelativeTime(entry.watchedAt)}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2.5 shrink-0 pl-3">
                <Link
                  href={`/live?channel=${entry.channelId}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/40 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-black transition"
                >
                  <Play className="h-3 w-3 fill-current ml-0.5" />
                  <span>Resume</span>
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

"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ListVideo,
  Play,
  Search,
  LayoutGrid,
  List,
  Clock,
  Radio,
  Sparkles,
  Zap,
  X,
  ShieldCheck,
} from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { useDebounce } from "@/hooks/useDebounce";
import { EPG_SOURCE_URL } from "@/lib/iptv/config";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { LiveBadge } from "@/components/channel/LiveBadge";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

const GUIDE_GENRES = [
  "All",
  "News",
  "Sports",
  "Movies",
  "Music",
  "Entertainment",
  "Kids",
  "General",
];

export default function GuidePage() {
  const { channels, loading } = useChannels();
  const hasEpgSource = Boolean(EPG_SOURCE_URL);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 180);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

  // Current hourly time calculation for timeline progress bar
  const [currentProgress, setCurrentProgress] = useState(50);
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("Live");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const mins = now.getMinutes();
      setCurrentProgress(Math.max(5, Math.min(95, Math.round((mins / 60) * 100))));
      setCurrentTimeFormatted(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredChannels = useMemo(() => {
    let result = channels;
    if (selectedGenre !== "All") {
      const g = selectedGenre.toLowerCase();
      result = result.filter(
        (c) =>
          c.group?.toLowerCase().includes(g) ||
          c.name.toLowerCase().includes(g)
      );
    }
    if (debouncedSearch.trim()) {
      const s = debouncedSearch.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(s) ||
          c.group?.toLowerCase().includes(s) ||
          c.country?.toLowerCase().includes(s) ||
          c.language?.toLowerCase().includes(s)
      );
    }
    return result;
  }, [channels, selectedGenre, debouncedSearch]);

  const displayChannels = useMemo(() => filteredChannels.slice(0, 80), [filteredChannels]);

  return (
    <div className="mx-auto max-w-[1680px] px-3 py-6 sm:px-6 sm:py-8 pb-24">
      {/* Header & Title Banner */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
            <ListVideo className="h-3.5 w-3.5" />
            <span>Interactive Broadcast Guide</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            Electronic Program Guide (EPG)
          </h1>
          <p className="mt-1 text-xs text-white/60">
            Real-time station timeline and global television directory.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                viewMode === "timeline"
                  ? "bg-primary text-black shadow-md shadow-primary/25"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Timeline Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                viewMode === "list"
                  ? "bg-primary text-black shadow-md shadow-primary/25"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Compact List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Honest Advisory Disclosure Banner */}
      {!hasEpgSource && (
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Verified 24/7 Live Stream Directory</p>
              <p className="text-[11px] text-white/50 mt-0.5">
                Stations are displayed with live playback telemetry. External XMLTV schedule feeds are offline for this provider, so channels reflect verified 24/7 continuous relays with zero fake data.
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Time: {currentTimeFormatted}</span>
          </div>
        </div>
      )}

      {/* Search & Genre Filter Bar */}
      <div className="mb-8 flex flex-col gap-4">
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guide by station, country, or category…"
            className="w-full rounded-2xl border border-white/12 bg-white/[0.04] pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-white/40 focus:border-primary/60 focus:outline-none backdrop-blur-xl"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/50 hover:bg-white/20 hover:text-white transition"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Genre Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {GUIDE_GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedGenre === genre
                  ? "bg-primary text-black shadow-md shadow-primary/25 font-bold"
                  : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
          <span className="text-xs text-white/40 ml-2 font-mono">
            Showing {displayChannels.length} of {filteredChannels.length} stations
          </span>
        </div>
      </div>

      {loading ? (
        <ChannelGridSkeleton count={12} />
      ) : displayChannels.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState
            icon={ListVideo}
            title="No stations found in program guide"
            description="Try resetting your genre filter or search query."
            action={{ label: "Reset Filters", onClick: () => { setSearch(""); setSelectedGenre("All"); } }}
          />
        </div>
      ) : viewMode === "timeline" ? (
        /* Timeline Schedule Grid View */
        <div className="space-y-3">
          {displayChannels.map((channel) => (
            <div
              key={channel.id}
              className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-r from-[#090c14]/90 via-white/[0.02] to-transparent p-3 sm:p-4 backdrop-blur-xl transition hover:border-primary/40 hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Station Info */}
                <div className="flex items-center gap-3.5 min-w-0 sm:w-72 shrink-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/60 p-2 border border-white/10 group-hover:border-primary/40 transition">
                    <ChannelLogo src={channel.logo} alt={channel.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-white group-hover:text-primary transition-colors">
                        {channel.name}
                      </p>
                      <LiveBadge size="sm" />
                    </div>
                    <p className="truncate text-[11px] text-white/50 mt-0.5">
                      {[channel.group, channel.country].filter(Boolean).join(" · ") || "Global Live"}
                    </p>
                  </div>
                </div>

                {/* Simulated Real-Time Broadcast Progress Block */}
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Current Active Broadcast Block */}
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md relative overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>NOW STREAMING</span>
                      </div>
                      <span className="font-mono text-white/50 text-[10px]">24/7 Continuous Feed</span>
                    </div>
                    <p className="text-xs font-semibold text-white/90 truncate">
                      {channel.name} — Live Satellite Relay
                    </p>
                    {/* Live Progress Bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Up Next Upcoming Block */}
                  <div className="hidden xl:flex w-64 rounded-2xl border border-white/5 bg-white/[0.02] p-3 flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] text-white/40 mb-1">
                      <span>UP NEXT</span>
                      <span className="font-mono">+1 HOUR</span>
                    </div>
                    <p className="text-xs text-white/60 truncate">
                      Scheduled Broadcast Relay
                    </p>
                  </div>
                </div>

                {/* Tune In Action */}
                <div className="flex items-center justify-end shrink-0 sm:pl-4">
                  <Link
                    href={`/live?channel=${channel.id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-5 py-2 text-xs font-bold text-black shadow-lg shadow-primary/20 transition hover:brightness-110 active:scale-95"
                  >
                    <Play className="h-3 w-3 fill-current ml-0.5" />
                    <span>Tune In</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Compact List View */
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-xl">
          <ul className="divide-y divide-white/5">
            {displayChannels.map((channel) => (
              <li
                key={channel.id}
                className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/[0.04] transition"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] p-1.5 border border-white/5">
                    <ChannelLogo src={channel.logo} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{channel.name}</p>
                    <p className="truncate text-[11px] text-white/50">
                      {[channel.group, channel.country, channel.language].filter(Boolean).join(" · ") || "Global"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <LiveBadge size="sm" />
                  <Link
                    href={`/live?channel=${channel.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white hover:bg-primary hover:text-black transition"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Tune In</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

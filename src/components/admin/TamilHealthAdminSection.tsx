"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  RotateCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Radio,
  ExternalLink,
  Layers,
  Activity,
  Filter,
  Search,
  Loader2,
  ChevronRight,
  Eye,
  Info,
} from "lucide-react";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { formatRelativeTime, cn } from "@/lib/utils";
import type {
  HealthCheckRecord,
  TamilChannel,
  TamilStream,
  TamilSyncStats,
} from "@/lib/tamil/types";

interface TamilHealthData {
  stats: TamilSyncStats;
  channels: TamilChannel[];
  streams: TamilStream[];
  recentChecks: HealthCheckRecord[];
}

interface TamilHealthAdminSectionProps {
  sessionToken: string | null;
}

export function TamilHealthAdminSection({ sessionToken }: TamilHealthAdminSectionProps) {
  const [data, setData] = useState<TamilHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Table filters
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "DEGRADED" | "OFFLINE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannelDiagnostics, setSelectedChannelDiagnostics] = useState<TamilChannel | null>(null);

  const getAuthHeaders = useCallback((extra: Record<string, string> = {}) => {
    return {
      ...extra,
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    };
  }, [sessionToken]);

  const loadHealthData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tamil/health", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error("Failed to fetch Tamil health data:", err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    void loadHealthData();
  }, [loadHealthData]);

  // Trigger Full Sync & Health Scan
  const handleTriggerSync = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/tamil/sync", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
      });
      const d = await res.json();
      if (res.ok) {
        setFeedback("Sync & health check started successfully. Data will refresh shortly.");
        await loadHealthData();
      } else {
        setFeedback(d.error || "Sync failed to start");
      }
    } catch {
      setFeedback("Network error triggering sync");
    } finally {
      setSyncing(false);
    }
  };

  // Trigger Health Scan Only
  const handleTriggerScan = async (channelId?: string) => {
    setScanning(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/tamil/health-check", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(channelId ? { channelId } : {}),
      });
      const d = await res.json();
      if (res.ok) {
        setFeedback(channelId ? "Channel recheck completed." : "Health scan completed.");
        await loadHealthData();
      } else {
        setFeedback(d.error || "Scan failed");
      }
    } catch {
      setFeedback("Network error triggering scan");
    } finally {
      setScanning(false);
    }
  };

  // Toggle Channel Active State
  const handleToggleChannel = async (channelId: string, currentActive: boolean) => {
    try {
      await fetch("/api/admin/tamil/channels", {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ channelId, active: !currentActive }),
      });
      await loadHealthData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChannels = (data?.channels || []).filter((c) => {
    if (statusFilter === "ONLINE" && !c.verified) return false;
    if (statusFilter === "DEGRADED" && c.health_status !== "DEGRADED") return false;
    if (statusFilter === "OFFLINE" && c.health_status !== "OFFLINE") return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.normalized_name.includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const stats = data?.stats;

  return (
    <div className="mt-12 border-t border-white/10 pt-10">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>Dedicated Health Checker</span>
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Tamil Live TV — Smart Stream Health Engine
          </h2>
          <p className="text-xs text-white/60">
            Source: <code className="text-primary font-mono">https://iptv-org.github.io/iptv/languages/tam.m3u</code>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={syncing || scanning}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-primary/20 hover:bg-primary-hover transition disabled:opacity-50"
          >
            <RotateCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
            <span>{syncing ? "Syncing Upstream…" : "Run Full Sync & Scan"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTriggerScan()}
            disabled={syncing || scanning}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <Activity className={cn("h-3.5 w-3.5 text-cyan-400", scanning && "animate-spin")} />
            <span>{scanning ? "Scanning Streams…" : "Probe Health"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-white">
          {feedback}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
          <p className="text-[11px] text-white/50">Source Channels</p>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {stats?.total_source_channels || data?.channels.length || 0}
          </p>
          <p className="text-[10px] text-white/40">From M3U source</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-emerald-400">Verified Playable</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-emerald-400">
            {stats?.verified_channels || 0}
          </p>
          <p className="text-[10px] text-emerald-400/60">Visible to users</p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-amber-400">Degraded</p>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-amber-400">
            {stats?.degraded_channels || 0}
          </p>
          <p className="text-[10px] text-amber-400/60">Needs monitoring</p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-rose-400">Offline / Dead</p>
            <XCircle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-rose-400">
            {stats?.offline_channels || 0}
          </p>
          <p className="text-[10px] text-rose-400/60">Hidden from catalogue</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.03] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-cyan-400">Availability</p>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-white">
            {stats?.availability_rate || 0}%
          </p>
          <p className="text-[10px] text-cyan-400/60">Catalogue reliability</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-white/50">Avg Latency</p>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-white font-mono">
            {stats?.average_latency_ms || 0}ms
          </p>
          <p className="text-[10px] text-white/40">P95: {stats?.p95_latency_ms || 0}ms</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["ALL", "ONLINE", "DEGRADED", "OFFLINE"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition",
                statusFilter === st
                  ? "bg-white/20 text-white"
                  : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter Tamil streams..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/30 focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Stream Channels Table */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-white/50">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Channel</th>
                  <th className="px-5 py-3.5 font-medium">Health Status</th>
                  <th className="px-5 py-3.5 font-medium">Health Score</th>
                  <th className="px-5 py-3.5 font-medium">Latency</th>
                  <th className="px-5 py-3.5 font-medium">Last Success</th>
                  <th className="px-5 py-3.5 font-medium">Streams</th>
                  <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredChannels.map((c) => {
                  const isOnline = c.verified;
                  const isDegraded = c.health_status === "DEGRADED";
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/40 p-1 border border-white/10">
                            <ChannelLogo src={c.logo_url} alt={c.name} className="h-full w-full object-contain" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{c.name}</p>
                            <p className="text-[10px] text-white/40">{c.category} {c.resolution ? `· ${c.resolution}` : ""}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                            isOnline
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : isDegraded
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isOnline ? "bg-emerald-400" : isDegraded ? "bg-amber-400" : "bg-rose-400"
                            )}
                          />
                          <span>{isOnline ? "ONLINE" : c.health_status}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-14 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                c.health_score >= 70
                                  ? "bg-emerald-400"
                                  : c.health_score >= 40
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              )}
                              style={{ width: `${c.health_score}%` }}
                            />
                          </div>
                          <span className="font-mono text-white/80">{c.health_score}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-white/70">
                        {c.latency_ms ? `${c.latency_ms}ms` : "—"}
                      </td>

                      <td className="px-5 py-3.5 text-white/50">
                        {formatRelativeTime(c.last_success_at)}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] font-mono text-white/80">
                          <Layers className="h-3 w-3 text-primary" />
                          {c.streams?.length || 1}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedChannelDiagnostics(c)}
                            title="View Diagnostics"
                            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
                          >
                            <Info className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleTriggerScan(c.id)}
                            title="Probe Stream Now"
                            className="rounded-lg p-1.5 text-cyan-400 hover:bg-cyan-500/10 transition"
                          >
                            <RotateCw className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleChannel(c.id, c.active)}
                            className={cn(
                              "rounded-lg px-2 py-1 text-[10px] font-semibold transition",
                              c.active
                                ? "bg-white/10 text-white hover:bg-rose-500/20 hover:text-rose-300"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            )}
                          >
                            {c.active ? "Disable" : "Enable"}
                          </button>

                          <a
                            href={`/tamil/${c.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg p-1.5 text-primary hover:bg-primary/10 transition"
                            title="Preview Player"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diagnostics Modal */}
      {selectedChannelDiagnostics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0e111a] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/40 p-1 border border-white/10">
                  <ChannelLogo
                    src={selectedChannelDiagnostics.logo_url}
                    alt={selectedChannelDiagnostics.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedChannelDiagnostics.name}</h3>
                  <p className="text-xs text-white/50">{selectedChannelDiagnostics.id}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedChannelDiagnostics(null)}
                className="rounded-xl border border-white/10 p-2 text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <p className="text-white/40">Status</p>
                  <p className="mt-1 font-bold text-white">{selectedChannelDiagnostics.health_status}</p>
                </div>
                <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <p className="text-white/40">Score</p>
                  <p className="mt-1 font-bold text-primary">{selectedChannelDiagnostics.health_score}/100</p>
                </div>
                <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <p className="text-white/40">Failures</p>
                  <p className="mt-1 font-bold text-rose-400">{selectedChannelDiagnostics.consecutive_failures}</p>
                </div>
                <div className="rounded-xl bg-white/[0.02] p-3 border border-white/5">
                  <p className="text-white/40">Successes</p>
                  <p className="mt-1 font-bold text-emerald-400">{selectedChannelDiagnostics.consecutive_successes}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-white/70">Stream URL Endpoint:</p>
                <div className="mt-1 rounded-xl bg-black/60 p-3 font-mono text-[11px] text-white/80 break-all border border-white/5 select-all">
                  {selectedChannelDiagnostics.source_url}
                </div>
              </div>

              {selectedChannelDiagnostics.failure_reason && (
                <div>
                  <p className="text-xs font-semibold text-rose-400">Failure Diagnostic Reason:</p>
                  <div className="mt-1 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-200 border border-rose-500/20">
                    {selectedChannelDiagnostics.failure_reason}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-white/70 mb-2">Configured Failover Streams:</p>
                <div className="space-y-2">
                  {selectedChannelDiagnostics.streams?.map((st, idx) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between rounded-xl bg-white/[0.03] p-3 border border-white/5 text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">Source {idx + 1}</span>
                        <p className="text-[10px] text-white/40 font-mono truncate max-w-md">{st.stream_url}</p>
                      </div>
                      <span className="font-mono text-emerald-400 text-xs">{st.health_status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedChannelDiagnostics(null)}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-bold text-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

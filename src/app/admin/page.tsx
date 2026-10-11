"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  Plus,
  Trash2,
  Tv,
  Radio,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useChannels } from "@/hooks/useChannels";
import { ChannelLogo } from "@/components/channel/ChannelLogo";
import { TamilHealthAdminSection } from "@/components/admin/TamilHealthAdminSection";

interface CustomChannel {
  id: string;
  name: string;
  stream_url: string;
  logo?: string;
  category: string;
  country: string;
  language: string;
  is_active: boolean;
  created_at: number;
}

export default function AdminPage() {
  const { user, isAdmin, sessionToken, loading: authLoading } = useAuth();
  const { channels, refresh: refreshCatalog } = useChannels();

  const [customChannels, setCustomChannels] = useState<CustomChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add form fields
  const [name, setName] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [logo, setLogo] = useState("");
  const [category, setCategory] = useState("Custom");
  const [country, setCountry] = useState("US");
  const [language, setLanguage] = useState("English");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getAuthHeaders = useCallback((extraHeaders: Record<string, string> = {}) => {
    return {
      ...extraHeaders,
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    };
  }, [sessionToken]);

  const loadCustomChannels = useCallback(async () => {
    setLoadingChannels(true);
    try {
      const res = await fetch("/api/admin/channels", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCustomChannels(data.channels || []);
      }
    } catch (err) {
      console.error("Failed to load admin channels:", err);
    } finally {
      setLoadingChannels(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isAdmin) {
      void loadCustomChannels();
    }
  }, [isAdmin, loadCustomChannels]);

  async function handleAddChannel(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/channels", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name,
          stream_url: streamUrl,
          logo,
          category,
          country,
          language,
        }),
      });
      if (res.ok) {
        setFeedback("Channel created successfully!");
        setName("");
        setStreamUrl("");
        setLogo("");
        setShowAddForm(false);
        await loadCustomChannels();
        await refreshCatalog();
      } else {
        const d = await res.json();
        setFeedback(d.error || "Failed to add channel");
      }
    } catch {
      setFeedback("Network error while adding channel");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    try {
      await fetch("/api/admin/channels", {
        method: "PUT",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id, is_active: !active }),
      });
      await loadCustomChannels();
      await refreshCatalog();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this custom channel?")) return;
    try {
      await fetch(`/api/admin/channels?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await loadCustomChannels();
      await refreshCatalog();
    } catch (e) {
      console.error(e);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Shield className="mx-auto h-16 w-16 text-rose-500/80" />
        <h1 className="mt-4 text-2xl font-bold text-white">Access Restricted</h1>
        <p className="mt-2 text-sm text-white/60">
          This section is reserved for platform administrators. Log in with an administrator account to access channel management controls.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-black"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-white/60 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <Shield className="h-3.5 w-3.5" />
            <span>Administrator Console</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Content & Stream Management</h1>
          <p className="text-xs sm:text-sm text-white/60">
            Oversee global playlist caches, add verified custom HLS feeds, and manage live availability.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-primary/20 hover:bg-primary-hover transition"
        >
          <Plus className="h-4 w-4" />
          <span>{showAddForm ? "Hide Form" : "Add Custom Channel"}</span>
        </button>
      </div>

      {/* Platform Health & Catalog Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">Global IPTV Catalog</p>
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">{channels.length.toLocaleString()}</p>
          <p className="mt-1 text-xs text-emerald-400">Live indexed streams</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">Admin Custom Feeds</p>
            <Tv className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white">{customChannels.length}</p>
          <p className="mt-1 text-xs text-cyan-400">Database overrides</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/50">Admin Session</p>
            <Shield className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-2 text-xl font-bold text-white truncate">{user?.name || user?.email}</p>
          <p className="mt-1 text-xs text-white/50">{user?.email}</p>
        </div>
      </div>

      {feedback && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-xs text-white">
          {feedback}
        </div>
      )}

      {/* Add Custom Channel Modal / Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddChannel}
          className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl"
        >
          <h2 className="text-lg font-bold text-white">Add New Custom Stream</h2>
          <p className="text-xs text-white/60">This channel will immediately appear across all live views.</p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Channel Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. NASA TV HD"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Stream HLS URL (.m3u8) *</label>
              <input
                type="url"
                required
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://example.com/live/stream.m3u8"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Logo / Thumbnail URL</label>
              <input
                type="url"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="News, Sports, Science, Movies..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Country Code</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="US, UK, IN, CA..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/70">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="English, Spanish, French..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-medium text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-black hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Publishing…" : "Publish Custom Stream"}
            </button>
          </div>
        </form>
      )}

      {/* Custom Channels Table */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-white">Custom Broadcast Channels</h2>
        <p className="text-xs text-white/60">Managed channels stored in the local SQLite database.</p>

        {loadingChannels ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </div>
        ) : customChannels.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <Tv className="mx-auto h-12 w-12 text-white/20" />
            <h3 className="mt-3 text-base font-semibold text-white">No custom channels added yet</h3>
            <p className="mt-1 text-xs text-white/60">Add a stream above to introduce proprietary or curated feeds.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-white/[0.03] text-white/50">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Channel</th>
                    <th className="px-5 py-3.5 font-medium">Category</th>
                    <th className="px-5 py-3.5 font-medium">Country / Lang</th>
                    <th className="px-5 py-3.5 font-medium">Stream URL</th>
                    <th className="px-5 py-3.5 font-medium">Status</th>
                    <th className="px-5 py-3.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customChannels.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] p-1 border border-white/5">
                            <ChannelLogo src={c.logo} alt={c.name} className="h-full w-full object-contain" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">{c.name}</p>
                            <p className="text-[10px] text-white/40">{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-white/70">{c.category}</td>
                      <td className="px-5 py-4 text-white/70">
                        {c.country} · {c.language}
                      </td>
                      <td className="px-5 py-4 max-w-xs truncate text-white/40 font-mono">
                        {c.stream_url}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(c.id, c.is_active)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            c.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-white/10 text-white/40 border border-white/10"
                          }`}
                        >
                          {c.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {c.is_active ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/channel/${c.id}`}
                            className="rounded-lg p-2 text-white/60 hover:text-white hover:bg-white/5 transition"
                            title="Preview Channel"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="rounded-lg p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
                            title="Delete Channel"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Tamil Stream Health Engine Section */}
      <TamilHealthAdminSection sessionToken={sessionToken} />
    </div>
  );
}

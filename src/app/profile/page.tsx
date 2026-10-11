"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Heart,
  History,
  Shield,
  RotateCcw,
  CheckCircle2,
  Tv,
  Save,
  Radio,
  Sparkles,
  Zap,
  Sliders,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, isAdmin, logout, updateProfile, favorites, history } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || "Administrator");
  const [email, setEmail] = useState(user?.email || "admin@premiumtv.live");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfile(displayName, email);
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-10 pb-24">
      {/* Header Profile Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-[#090c14]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-orange-500 to-amber-400 p-0.5 shadow-xl shadow-primary/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#07090f] text-2xl font-black text-primary">
                {user?.name?.slice(0, 1).toUpperCase() || "A"}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user?.name || "User"}</h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-3 py-0.5 text-[10px] font-extrabold text-cyan-300 border border-cyan-500/30">
                    <Shield className="h-3 w-3" />
                    ADMINISTRATOR
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-white/70">
                    VIP VIEWER
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-white/60 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Settings Form & Local Storage Stats */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Edit Profile Form */}
        <form
          onSubmit={handleSave}
          className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                <User className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-white">Viewer Preferences</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/70 font-semibold mb-1.5">Email / Account Identifier</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-500 px-5 py-2.5 text-xs font-bold text-black hover:brightness-110 transition shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving…" : "Save Changes"}</span>
            </button>
          </div>
        </form>

        {/* Local Storage & Admin Information */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Shield className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-white">Architecture & Storage</h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-white/40 font-medium">Storage Mode</p>
                <p className="inline-flex items-center gap-1.5 text-emerald-400 font-bold mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Instant Local-First Engine (Zero Cloud Latency)
                </p>
              </div>

              <div>
                <p className="text-white/40 font-medium">Administration Status</p>
                <p className="text-white/80 font-semibold mt-0.5">
                  Full Administrator Access Granted
                </p>
              </div>

              <div>
                <p className="text-white/40 font-medium">Streaming Platform Catalog</p>
                <p className="text-white/80 font-semibold mt-0.5">
                  88 Verified Tamil Channels · 11,000+ Worldwide Feeds
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/35 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 transition w-full justify-center"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Launch Administrator Console</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/favorites"
          className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition hover:border-rose-500/40 hover:bg-white/[0.04]"
        >
          <div className="flex items-center justify-between">
            <Heart className="h-6 w-6 text-rose-400" />
            <span className="text-2xl font-black text-white">{favorites.length}</span>
          </div>
          <p className="mt-3 text-sm font-bold text-white group-hover:text-primary transition">
            Saved Channels
          </p>
          <p className="text-xs text-white/50 mt-0.5">Instant bookmarks stored locally</p>
        </Link>

        <Link
          href="/history"
          className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition hover:border-cyan-500/40 hover:bg-white/[0.04]"
        >
          <div className="flex items-center justify-between">
            <History className="h-6 w-6 text-cyan-400" />
            <span className="text-2xl font-black text-white">{history.length}</span>
          </div>
          <p className="mt-3 text-sm font-bold text-white group-hover:text-primary transition">
            Watch History
          </p>
          <p className="text-xs text-white/50 mt-0.5">Recently streamed broadcasts</p>
        </Link>

        <Link
          href="/tamil"
          className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition hover:border-primary/40 hover:bg-white/[0.04]"
        >
          <div className="flex items-center justify-between">
            <Radio className="h-6 w-6 text-orange-400" />
            <span className="text-2xl font-black text-orange-400">88</span>
          </div>
          <p className="mt-3 text-sm font-bold text-white group-hover:text-primary transition">
            Tamil Live TV
          </p>
          <p className="text-xs text-white/50 mt-0.5">100% verified playable streams</p>
        </Link>
      </div>
    </div>
  );
}

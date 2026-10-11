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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header Profile Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/30 to-orange-500/20 border border-primary/40 text-2xl font-extrabold text-primary shadow-lg shadow-primary/10">
              {user?.name?.slice(0, 1).toUpperCase() || "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">{user?.name || "User"}</h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-400 border border-cyan-500/30">
                    <Shield className="h-3 w-3" />
                    ADMINISTRATOR
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/60">
                    LOCAL USER
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs sm:text-sm text-white/60 font-mono">{user?.email}</p>
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
            <div className="flex items-center gap-2.5 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-white">Profile Preferences</h2>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-white/60 font-medium mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white/60 font-medium mb-1.5">Email / Identifier</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-black hover:bg-primary-hover transition shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? "Saving…" : "Save Changes"}</span>
            </button>
          </div>
        </form>

        {/* Local Storage & Admin Information */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Shield className="h-5 w-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">Local-First Storage & Access</h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-white/40">Storage Mode</p>
                <p className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Instant Local-First Storage (Zero Cloud Lag)
                </p>
              </div>

              <div>
                <p className="text-white/40">Administration Privileges</p>
                <p className="text-white/80 font-medium mt-0.5">
                  Full Administrator Access Granted
                </p>
              </div>

              <div>
                <p className="text-white/40">Platform Status</p>
                <p className="text-white/80 font-medium mt-0.5">
                  88 Verified Tamil Channels · 11,000+ Global Feeds
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-4 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition w-full justify-center"
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
          className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.04]"
        >
          <div className="flex items-center justify-between">
            <Heart className="h-6 w-6 text-rose-400" />
            <span className="text-2xl font-bold text-white">{favorites.length}</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-white group-hover:text-primary transition">
            Saved Channels
          </p>
          <p className="text-xs text-white/50 mt-0.5">Instant bookmarks stored locally</p>
        </Link>

        <Link
          href="/history"
          className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.04]"
        >
          <div className="flex items-center justify-between">
            <History className="h-6 w-6 text-cyan-400" />
            <span className="text-2xl font-bold text-white">{history.length}</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-white group-hover:text-primary transition">
            Watch History
          </p>
          <p className="text-xs text-white/50 mt-0.5">Recently streamed broadcasts</p>
        </Link>

        <Link
          href="/tamil"
          className="group rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.04]"
        >
          <div className="flex items-center justify-between">
            <Radio className="h-6 w-6 text-orange-400" />
            <span className="text-2xl font-bold text-orange-400">88</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-white group-hover:text-primary transition">
            Tamil Live TV
          </p>
          <p className="text-xs text-white/50 mt-0.5">100% verified playable streams</p>
        </Link>
      </div>
    </div>
  );
}


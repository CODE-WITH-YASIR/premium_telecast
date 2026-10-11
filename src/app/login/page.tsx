"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, Shield, Mail, Lock, Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { Metadata } from "next";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Email is required."); return; }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/profile");
    } catch {
      setError("Could not sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminQuickLogin() {
    setLoading(true);
    try {
      await login("mohamedyasir2000@gmail.com");
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100svh-80px)] max-w-md flex-col justify-center px-4 py-10 sm:px-6 pb-24">
      <div className="overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-b from-white/[0.07] via-white/[0.025] to-[#0a0d16]/95 p-7 sm:p-9 backdrop-blur-2xl shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--primary)] via-orange-500 to-amber-400 p-0.5 shadow-xl shadow-[var(--primary-glow)]">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[var(--bg-raised)]">
              <Radio className="h-6 w-6 text-[var(--primary)] animate-pulse" />
            </div>
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-[var(--text-tertiary)] leading-relaxed max-w-xs">
            Sign in to sync your saved channels, watch history, and preferences.
          </p>
        </div>

        {/* Quick Admin Access */}
        <div className="mt-7">
          <button
            type="button"
            onClick={handleAdminQuickLogin}
            disabled={loading}
            className="w-full flex items-center justify-between rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/18 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-4.5 w-4.5 shrink-0" />
              <span>One-Click Sign In (Administrator)</span>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        </div>

        <div className="relative my-7 flex items-center gap-3">
          <div className="flex-grow border-t border-[var(--border-subtle)]" />
          <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider whitespace-nowrap">
            or continue with email
          </span>
          <div className="flex-grow border-t border-[var(--border-subtle)]" />
        </div>

        {/* Error message */}
        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Standard Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)]" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="you@domain.com"
                className="input input-icon-left"
                aria-required="true"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Password
              <span className="ml-2 text-xs text-[var(--text-disabled)]">(optional for local session)</span>
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)]" aria-hidden="true" />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input input-icon-left input-icon-right"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-disabled)] hover:text-[var(--text-secondary)] transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="btn btn-primary w-full mt-2"
          >
            {loading ? "Signing in…" : "Sign In & Stream"}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-ghost w-full"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>Continue as Google VIP</span>
          </button>
        </div>

        <p className="mt-7 text-center text-sm text-[var(--text-tertiary)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--primary)] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, Mail, Lock, User, Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Display name is required."); return; }
    if (!email) { setError("Email is required."); return; }
    setError("");
    setLoading(true);
    try {
      await signup(email, password, name);
      router.push("/profile");
    } catch {
      setError("Could not create account. Please try again.");
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-[var(--text-tertiary)] leading-relaxed max-w-xs">
            Get your personalized live television streaming workspace.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Display name <span className="text-[var(--primary)]" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)]" aria-hidden="true" />
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Your Name"
                className="input input-icon-left"
                aria-required="true"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Email address <span className="text-[var(--primary)]" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)]" aria-hidden="true" />
              <input
                id="signup-email"
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
            <label htmlFor="signup-password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-disabled)]" aria-hidden="true" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
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
            disabled={loading || !name || !email}
            className="btn btn-primary w-full"
          >
            {loading ? "Creating account…" : "Create & Start Streaming"}
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
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="mt-7 text-center text-sm text-[var(--text-tertiary)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

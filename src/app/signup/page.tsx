"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Radio, Shield, Mail, Lock, User, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await signup(email, password, name);
    setLoading(false);
    router.push("/profile");
  }

  async function handleGoogleLogin() {
    setLoading(true);
    await loginWithGoogle();
    setLoading(false);
    router.push("/profile");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-140px)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-[#0a0d16]/95 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-orange-500 to-amber-400 p-0.5 shadow-xl shadow-primary/20">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#07090f]">
              <Radio className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Create Account
          </h1>
          <p className="mt-1 text-xs text-white/60">
            Get your personalized live television streaming workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Display name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/12 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-500 px-4 py-3 text-xs font-bold text-black hover:brightness-110 transition shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            <span>{loading ? "Creating account…" : "Create & Start Streaming"}</span>
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

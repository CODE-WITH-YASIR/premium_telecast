import Link from "next/link";
import { Tv, Home, Search, Radio } from "lucide-react";

export default function NotFound() {
  return (
    <div className="page-container flex min-h-[calc(100svh-80px)] flex-col items-center justify-center py-16 text-center">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-[var(--primary)]/20 to-orange-500/10 border border-[var(--primary)]/30 shadow-xl">
          <Tv className="h-9 w-9 text-[var(--primary)]" aria-hidden="true" />
        </div>

        {/* Status code */}
        <p className="text-xs font-bold tracking-[0.2em] text-[var(--text-tertiary)] uppercase mb-3">
          404 — Channel Not Found
        </p>

        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Off the air
        </h1>
        <p className="mt-4 text-base text-[var(--text-tertiary)] leading-relaxed">
          The page you tuned into doesn&apos;t exist or has moved. Let&apos;s get you back on air.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <Link href="/live" className="btn btn-ghost">
            <Radio className="h-4 w-4" />
            <span>Live TV</span>
          </Link>
          <Link href="/search" className="btn btn-ghost">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

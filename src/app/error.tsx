"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for diagnostics — never shown to the user as a raw stack trace.
    console.error(error);
  }, [error]);

  return (
    <div className="page-container flex min-h-[calc(100svh-80px)] flex-col items-center justify-center py-16 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
        <div className="h-72 w-72 rounded-full bg-red-500/08 blur-[100px]" />
      </div>

      <div role="alert" className="relative z-10 max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-950/50 border border-red-800/30 shadow-xl">
          <AlertTriangle className="h-9 w-9 text-red-400" aria-hidden="true" />
        </div>

        <p className="text-xs font-bold tracking-[0.2em] text-red-400/70 uppercase mb-3">
          Unexpected Error
        </p>

        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-4 text-base text-[var(--text-tertiary)] leading-relaxed">
          An unexpected error occurred. This is usually temporary — try refreshing to resume streaming.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn btn-primary"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </button>
          <Link href="/" className="btn btn-ghost">
            <Home className="h-4 w-4" />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

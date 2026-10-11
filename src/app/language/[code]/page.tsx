"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Languages, ShieldCheck, ArrowRight, Radio } from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { useTamilChannels } from "@/hooks/useTamilChannels";
import { filterByLanguageSlug } from "@/lib/iptv/selectors";
import { ChannelGrid } from "@/components/channel/ChannelGrid";
import { TamilChannelCard } from "@/components/tamil/TamilChannelCard";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export default function LanguagePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const isTamil = code.toLowerCase() === "tam" || code.toLowerCase() === "tamil";

  const { channels, loading: globalLoading } = useChannels();
  const { channels: tamilChannels, loading: tamilLoading } = useTamilChannels();

  const filtered = useMemo(() => filterByLanguageSlug(channels, code), [channels, code]);
  const label = isTamil ? "Tamil" : filtered[0]?.language ?? code;

  if (isTamil) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <Link
          href="/live"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Live TV
        </Link>

        {/* Dedicated Hub Banner */}
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-amber-500/5 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between backdrop-blur-xl">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 text-primary">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Tamil Live TV</h1>
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  VERIFIED HEALTH ENGINE
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                {tamilChannels.length} verified playable live broadcasts
              </p>
            </div>
          </div>

          <Link
            href="/tamil"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-black hover:bg-primary-hover transition shrink-0"
          >
            <span>Open Dedicated Tamil Hub</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {tamilLoading ? (
          <ChannelGridSkeleton count={12} />
        ) : tamilChannels.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
            <EmptyState
              icon={Languages}
              title="No verified Tamil channels available"
              action={{ label: "Browse Live TV", href: "/live" }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {tamilChannels.map((c) => (
              <TamilChannelCard key={c.id} channel={c} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <Link
        href="/live"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Live TV
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Audio Language: {label}</h1>
        <p className="mt-1 text-xs text-white/60">
          {filtered.length} broadcast channel{filtered.length === 1 ? "" : "s"} in {label}
        </p>
      </div>

      {globalLoading ? (
        <ChannelGridSkeleton count={12} />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState
            icon={Languages}
            title="No channels in this language"
            action={{ label: "Browse Live TV", href: "/live" }}
          />
        </div>
      ) : (
        <ChannelGrid channels={filtered} />
      )}
    </div>
  );
}

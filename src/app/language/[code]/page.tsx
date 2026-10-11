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
      <div className="page-container pt-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)] hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Live TV</span>
          </Link>
        </nav>

        {/* Dedicated Hub Banner */}
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-[var(--primary)]/20 bg-gradient-to-r from-[var(--primary)]/10 via-amber-500/5 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/20 border border-[var(--primary)]/30 text-[var(--primary)] shrink-0">
              <Radio className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Tamil Live TV</h1>
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  VERIFIED HEALTH ENGINE
                </span>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {tamilChannels.length} verified playable live broadcasts
              </p>
            </div>
          </div>

          <Link
            href="/tamil"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-2.5 text-xs font-bold text-black hover:bg-[var(--primary-hover)] transition shrink-0"
          >
            <span>Open Dedicated Tamil Hub</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {tamilLoading ? (
          <ChannelGridSkeleton count={12} />
        ) : tamilChannels.length === 0 ? (
          <EmptyState
            icon={Languages}
            title="No verified Tamil channels available"
            description="The Tamil Health Engine is refreshing channel sources. Check back shortly."
            action={{ label: "Browse Live TV", href: "/live" }}
          />
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
    <div className="page-container pt-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/live"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)] hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Live TV</span>
        </Link>
      </nav>

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/10 border border-purple-500/30 text-purple-400 shadow-lg">
          <Languages className="h-6 w-6" />
        </div>
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--glass-base)] px-3 py-1 text-xs font-semibold text-[var(--text-tertiary)]">
            <Radio className="h-3 w-3" />
            <span>Language Broadcast Hub</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {label}
          </h1>
          {!globalLoading && (
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              {filtered.length.toLocaleString()} broadcast channel{filtered.length === 1 ? "" : "s"} in {label}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {globalLoading ? (
        <ChannelGridSkeleton count={12} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Languages}
          title="No channels in this language"
          description="No broadcast channels found for this language in the current IPTV directory."
          action={{ label: "Browse Live TV", href: "/live" }}
        />
      ) : (
        <ChannelGrid channels={filtered} />
      )}
    </div>
  );
}

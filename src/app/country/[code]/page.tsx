"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { filterByCountrySlug } from "@/lib/iptv/selectors";
import { ChannelGrid } from "@/components/channel/ChannelGrid";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export default function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { channels, loading } = useChannels();
  const filtered = useMemo(() => filterByCountrySlug(channels, code), [channels, code]);
  const label = filtered[0]?.country ?? code;

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
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Country: {label}</h1>
        <p className="mt-1 text-xs text-white/60">
          {filtered.length} broadcast channel{filtered.length === 1 ? "" : "s"} originating from this region
        </p>
      </div>

      {loading ? (
        <ChannelGridSkeleton count={12} />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 backdrop-blur-xl">
          <EmptyState
            icon={Globe}
            title="No channels from this country"
            action={{ label: "Browse Live TV", href: "/live" }}
          />
        </div>
      ) : (
        <ChannelGrid channels={filtered} />
      )}
    </div>
  );
}

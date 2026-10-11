"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Radio } from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { filterByCountrySlug } from "@/lib/iptv/selectors";
import { ChannelGrid } from "@/components/channel/ChannelGrid";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export default function CountryPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { channels, loading } = useChannels();
  const filtered = useMemo(() => filterByCountrySlug(channels, code), [channels, code]);
  const label = filtered[0]?.country ?? code.toUpperCase();

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
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 text-[var(--accent-cyan)] shadow-lg">
          <Globe className="h-6 w-6" />
        </div>
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--glass-base)] px-3 py-1 text-xs font-semibold text-[var(--text-tertiary)]">
            <Radio className="h-3 w-3" />
            <span>Regional Broadcast Hub</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {label}
          </h1>
          {!loading && (
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              {filtered.length.toLocaleString()} broadcast channel{filtered.length === 1 ? "" : "s"} from this region
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <ChannelGridSkeleton count={12} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No channels from this country"
          description="No broadcast channels were found for this region in the current IPTV catalog."
          action={{ label: "Browse All Live TV", href: "/live" }}
        />
      ) : (
        <ChannelGrid channels={filtered} />
      )}
    </div>
  );
}

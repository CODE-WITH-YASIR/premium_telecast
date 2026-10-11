"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, Radio } from "lucide-react";
import { useChannels } from "@/hooks/useChannels";
import { filterByCategorySlug } from "@/lib/iptv/selectors";
import { ChannelGrid } from "@/components/channel/ChannelGrid";
import { ChannelGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/States";

export default function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const { channels, loading } = useChannels();
  const filtered = useMemo(() => filterByCategorySlug(channels, name), [channels, name]);
  const label = filtered[0]?.group ?? decodeURIComponent(name);

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
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[var(--primary)]/20 to-orange-500/10 border border-[var(--primary)]/30 text-[var(--primary)] shadow-lg">
          <LayoutGrid className="h-6 w-6" />
        </div>
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--glass-base)] px-3 py-1 text-xs font-semibold text-[var(--text-tertiary)]">
            <Radio className="h-3 w-3" />
            <span>Category</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl capitalize">
            {label}
          </h1>
          {!loading && (
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              {filtered.length.toLocaleString()} broadcast channel{filtered.length === 1 ? "" : "s"} available
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <ChannelGridSkeleton count={12} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No channels in this category"
          description="No channels were found for this genre. Try browsing all live channels."
          action={{ label: "Browse All Live TV", href: "/live" }}
        />
      ) : (
        <ChannelGrid channels={filtered} />
      )}
    </div>
  );
}

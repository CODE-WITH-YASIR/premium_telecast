import Link from "next/link";
import { ChevronRight, Radio } from "lucide-react";
import type { FacetCount } from "@/lib/iptv/selectors";
import type { Channel } from "@/lib/iptv/types";
import { ChannelCard } from "@/components/channel/ChannelCard";

export function SectionHeading({
  title,
  subtitle,
  href,
  badge,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  badge?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="h-4.5 w-1.5 rounded-full bg-gradient-to-b from-primary to-orange-500 shadow-sm shadow-primary/50" />
          <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">{title}</h2>
          {badge && (
            <span className="rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-[10px] font-extrabold text-primary">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-white/50 mt-1 pl-4">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-white/75 transition hover:border-primary/50 hover:bg-primary/10 hover:text-white"
        >
          <span>Explore All</span>
          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 text-primary" />
        </Link>
      )}
    </div>
  );
}

export function ChannelRail({ channels }: { channels: Channel[] }) {
  return (
    <div className="relative -mx-2 px-2">
      <div className="flex gap-4 overflow-x-auto pb-5 pt-1 scroll-smooth no-scrollbar [mask-image:linear-gradient(to_right,black_92%,transparent)]">
        {channels.map((channel) => (
          <div key={channel.id} className="w-48 shrink-0 sm:w-56">
            <ChannelCard channel={channel} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FacetPills({ facets, basePath }: { facets: FacetCount[]; basePath: string }) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {facets.slice(0, 18).map((facet) => (
        <Link
          key={facet.key}
          href={`${basePath}/${facet.key}`}
          className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition hover:border-primary/50 hover:bg-primary/10 hover:text-white hover:scale-105 active:scale-95"
        >
          <span>{facet.label}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/60 group-hover:bg-primary/20 group-hover:text-primary font-semibold">
            {facet.count}
          </span>
        </Link>
      ))}
    </div>
  );
}

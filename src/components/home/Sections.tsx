import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { FacetCount } from "@/lib/iptv/selectors";
import type { Channel } from "@/lib/iptv/types";
import { ChannelCard } from "@/components/channel/ChannelCard";

export function SectionHeading({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="h-4 w-1 rounded-full bg-primary" />
        <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
        >
          <span>Explore All</span>
          <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function ChannelRail({ channels }: { channels: Channel[] }) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none [mask-image:linear-gradient(to_right,black_90%,transparent)]">
        {channels.map((channel) => (
          <div key={channel.id} className="w-44 shrink-0 sm:w-52">
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
          className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition hover:border-primary/50 hover:bg-primary/10 hover:text-white"
        >
          <span>{facet.label}</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/60 group-hover:bg-primary/20 group-hover:text-primary">
            {facet.count}
          </span>
        </Link>
      ))}
    </div>
  );
}

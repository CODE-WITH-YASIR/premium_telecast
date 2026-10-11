import { SectionHeading, ChannelRail } from "@/components/home/Sections";
import { EmptyState } from "@/components/ui/States";
import type { Channel } from "@/lib/iptv/types";
import { Tv } from "lucide-react";

export function UpNextSection({ channel }: { channel: Channel | null }) {
  if (!channel) return null;
  return (
    <section>
      <SectionHeading title="Up Next" />
      <ChannelRail channels={[channel]} />
    </section>
  );
}

export function SimilarChannelsSection({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) {
    return (
      <section>
        <SectionHeading title="Similar Channels" />
        <EmptyState
          icon={Tv}
          title="No similar channels found"
          description="We couldn't find other channels sharing this channel's category, country, or language."
        />
      </section>
    );
  }
  return (
    <section>
      <SectionHeading title="Similar Channels" />
      <ChannelRail channels={channels} />
    </section>
  );
}

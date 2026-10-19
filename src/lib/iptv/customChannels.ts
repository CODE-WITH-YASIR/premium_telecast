export interface CustomChannel {
  id: string;
  name: string;
  stream_url: string;
  logo?: string;
  category: string;
  country: string;
  language: string;
  is_active: boolean;
  created_at: number;
}

export const DEFAULT_CUSTOM_CHANNELS: CustomChannel[] = [
  {
    id: "custom_cartoon_network",
    name: "Cartoon Network India",
    stream_url: "https://drk6xq0vhn.gpcdn.net/live/cn_hd_abr/index.m3u8",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/330px-Cartoon_Network_2010_logo.svg.png",
    category: "Kids",
    country: "India",
    language: "Tamil",
    is_active: true,
    created_at: 1700000000002,
  },
  {
    id: "custom_chithiram_tv",
    name: "Chithiram TV",
    stream_url: "https://cdn.pishow.tv/ott/live/1243/master.m3u8",
    logo: "https://i.imgur.com/xv9cWSh.png",
    category: "Kids",
    country: "India",
    language: "Tamil",
    is_active: true,
    created_at: 1700000000003,
  },
  {
    id: "custom_discovery_kids",
    name: "Discovery Kids",
    stream_url: "https://drk6xq0vhn.gpcdn.net/live/discovery_kids_abr/index.m3u8",
    logo: "https://i.imgur.com/0iNQvoL.png",
    category: "Kids",
    country: "India",
    language: "Tamil",
    is_active: true,
    created_at: 1700000000004,
  },
  {
    id: "custom_sony_yay",
    name: "Sony YAY!",
    stream_url: "https://drk6xq0vhn.gpcdn.net/live/discovery_kids_abr/index.m3u8",
    logo: "https://dtil.tmsimg.com/assets/s159100_ld_h15_aa.png?lock=720x540",
    category: "Kids",
    country: "India",
    language: "Tamil",
    is_active: true,
    created_at: 1700000000005,
  },
  {
    id: "custom_wow_kidz",
    name: "WOW Kidz Tamil",
    stream_url: "https://yuppparoriglin.akamaized.net/181224/smil:wowkidztam.smil/playlist.m3u8",
    logo: "https://d229kpbsb5jevy.cloudfront.net/yupptvnew/content/common/channel/logos/mjvezt.png",
    category: "Kids",
    country: "India",
    language: "Tamil",
    is_active: true,
    created_at: 1700000000006,
  },
  {
    id: "custom_nickelodeon",
    name: "Nickelodeon (Nick India)",
    stream_url: "https://drk6xq0vhn.gpcdn.net/live/cn_sd_abr/index.m3u8",
    logo: "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_NICK/images/LOGO_HD/image.png",
    category: "Kids",
    country: "India",
    language: "Tamil",
    is_active: true,
    created_at: 1700000000007,
  },
];

// In-memory custom channel storage across hot reloads and production runtime
const globalForCustomChannels = globalThis as unknown as {
  pltvCustomChannels?: Map<string, CustomChannel>;
};

if (!globalForCustomChannels.pltvCustomChannels) {
  const store = new Map<string, CustomChannel>();
  for (const ch of DEFAULT_CUSTOM_CHANNELS) {
    store.set(ch.id, ch);
  }
  globalForCustomChannels.pltvCustomChannels = store;
}

const customStore = globalForCustomChannels.pltvCustomChannels;

export const customChannelsService = {
  getAll(activeOnly = true): CustomChannel[] {
    const all = Array.from(customStore.values());
    if (activeOnly) {
      return all.filter((c) => c.is_active);
    }
    return all.sort((a, b) => b.created_at - a.created_at);
  },

  getById(id: string): CustomChannel | null {
    return customStore.get(id) || null;
  },

  create(params: {
    name: string;
    stream_url: string;
    logo?: string;
    category?: string;
    country?: string;
    language?: string;
  }): CustomChannel {
    const id = "custom_" + Math.random().toString(36).substring(2, 10);
    const channel: CustomChannel = {
      id,
      name: params.name,
      stream_url: params.stream_url,
      logo: params.logo || "",
      category: params.category || "Custom",
      country: params.country || "US",
      language: params.language || "English",
      is_active: true,
      created_at: Date.now(),
    };
    customStore.set(id, channel);
    return channel;
  },

  toggleActive(id: string, isActive: boolean): boolean {
    const existing = customStore.get(id);
    if (!existing) return false;
    existing.is_active = isActive;
    customStore.set(id, existing);
    return true;
  },

  delete(id: string): boolean {
    return customStore.delete(id);
  },
};

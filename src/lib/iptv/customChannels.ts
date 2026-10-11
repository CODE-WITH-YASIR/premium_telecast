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

// In-memory custom channel storage across hot reloads and production runtime
const globalForCustomChannels = globalThis as unknown as {
  pltvCustomChannels?: Map<string, CustomChannel>;
};

if (!globalForCustomChannels.pltvCustomChannels) {
  globalForCustomChannels.pltvCustomChannels = new Map<string, CustomChannel>();
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

/**
 * Core data model for a parsed IPTV channel.
 *
 * Every field except id/name/streamUrl is genuinely optional because real M3U
 * sources frequently omit attributes. Nothing here is ever backfilled with
 * placeholder text at the data layer — "unknown" values are represented as
 * `undefined` and it is the UI's job to render an honest empty state.
 */
export interface Channel {
  /** Deterministic, Unicode-safe, URL-safe id derived from the stream URL. */
  id: string;
  name: string;
  streamUrl: string;
  logo?: string;
  group?: string;
  country?: string;
  countryCode?: string;
  language?: string;
  languageCode?: string;
  tvgId?: string;
  tvgName?: string;
  channelNumber?: string;
  /** Which configured playlist source this channel came from. */
  sourceId: string;
}

/** A single configured M3U/M3U8 playlist source. */
export interface PlaylistSource {
  id: string;
  label: string;
  url: string;
}

/** Result of fetching + parsing one playlist source. */
export interface SourceResult {
  sourceId: string;
  channels: Channel[];
  skippedEntries: number;
  error: string | null;
}

/** Aggregate result across all configured sources. */
export interface FetchChannelsResult {
  channels: Channel[];
  sourceResults: SourceResult[];
  fetchedAt: number;
  /** True if every configured source failed (channels will be empty). */
  totalFailure: boolean;
}

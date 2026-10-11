"use client";

import { Search, RefreshCw } from "lucide-react";
import type { FacetCount } from "@/lib/iptv/selectors";
import { cn, formatRelativeTime } from "@/lib/utils";

interface FilterBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  country: string;
  onCountryChange: (v: string) => void;
  language: string;
  onLanguageChange: (v: string) => void;
  categories: FacetCount[];
  countries: FacetCount[];
  languages: FacetCount[];
  filteredCount: number;
  totalCount: number;
  lastUpdated: number | null;
  refreshing: boolean;
  onRefresh: () => void;
}

function FacetSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FacetCount[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="rounded-full border border-border bg-surface-secondary px-3 py-2 text-sm text-white focus:outline-none focus-visible:outline-2 focus-visible:outline-primary"
    >
      <option value="">{label}</option>
      {options.map((opt) => (
        <option key={opt.key} value={opt.key}>
          {opt.label} ({opt.count})
        </option>
      ))}
    </select>
  );
}

export function FilterBar(props: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white sm:text-2xl">Channel Directory</h3>
          <p className="mt-1 text-xs sm:text-sm text-white/50">
            {props.filteredCount} channel{props.filteredCount === 1 ? "" : "s"}
            {props.filteredCount !== props.totalCount && ` of ${props.totalCount}`} · Updated{" "}
            {formatRelativeTime(props.lastUpdated)}
          </p>
        </div>
        <button
          type="button"
          onClick={props.onRefresh}
          disabled={props.refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-white transition hover:border-border-hover hover:bg-white/5 disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", props.refreshing && "animate-spin")} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-full border border-border bg-surface-secondary px-4 py-2">
          <Search className="h-4 w-4 text-muted" aria-hidden="true" />
          <input
            value={props.query}
            onChange={(e) => props.onQueryChange(e.target.value)}
            placeholder="Search channels…"
            aria-label="Search channels"
            className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
          />
        </div>
        <FacetSelect
          label="Category"
          value={props.category}
          onChange={props.onCategoryChange}
          options={props.categories}
        />
        <FacetSelect
          label="Country"
          value={props.country}
          onChange={props.onCountryChange}
          options={props.countries}
        />
        <FacetSelect
          label="Language"
          value={props.language}
          onChange={props.onLanguageChange}
          options={props.languages}
        />
      </div>
    </div>
  );
}

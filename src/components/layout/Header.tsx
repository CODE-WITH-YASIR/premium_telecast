"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Heart,
  History,
  ListVideo,
  Menu,
  X,
  Radio,
  User,
  Shield,
  ChevronDown,
  Sparkles,
  Tv,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { SearchOverlay } from "@/components/search/SearchOverlay";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/live", label: "Live TV" },
  { href: "/tamil", label: "Tamil TV", badge: "VERIFIED" },
  { href: "/guide", label: "Guide" },
  { href: "/favorites", label: "Favorites" },
  { href: "/history", label: "History" },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAdmin, favorites, history } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcut: Cmd+K / Ctrl+K / '/' for search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#050609]/85 backdrop-blur-2xl transition-all">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-3 shrink-0">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/30 via-orange-500/20 to-primary/10 border border-primary/40 shadow-lg shadow-primary/20 transition group-hover:scale-105 group-hover:border-primary/60">
              <Radio className="h-5 w-5 text-primary animate-pulse" aria-hidden="true" />
              <div className="absolute -inset-1 rounded-2xl bg-primary/25 blur-md -z-10 opacity-40 group-hover:opacity-100 transition" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white leading-none">
                  PREMIUM <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">TV</span>
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[9px] font-bold text-emerald-400">
                  LIVE
                </span>
              </div>
              <span className="text-[10px] tracking-widest text-white/40 uppercase font-mono mt-0.5">
                Ultra-HD Streaming
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                    active
                      ? "text-white bg-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                      : "text-white/65 hover:text-white hover:bg-white/[0.05]"
                  )}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="rounded-full bg-primary/20 border border-primary/40 px-1.5 py-0.2 text-[9px] font-extrabold text-primary">
                      {link.badge}
                    </span>
                  )}
                  {link.href === "/favorites" && favorites.length > 0 && (
                    <span className="rounded-full bg-rose-500/25 border border-rose-500/40 px-1.5 py-0.2 text-[9px] text-rose-300 font-bold">
                      {favorites.length}
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[14px] h-[2.5px] rounded-full bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(255,107,53,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Action Items */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search channels"
              className="group flex h-9.5 items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 text-xs text-white/70 transition hover:border-primary/50 hover:bg-white/[0.08] hover:text-white shadow-sm"
            >
              <Search className="h-3.5 w-3.5 text-white/50 group-hover:text-primary transition" />
              <span className="hidden sm:inline font-medium">Search</span>
              <kbd className="hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/50 sm:inline border border-white/5">
                ⌘K
              </kbd>
            </button>

            {/* Quick Favorites Link */}
            <Link
              href="/favorites"
              aria-label="Favorites"
              className="relative hidden h-9.5 w-9.5 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white/70 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 sm:flex"
            >
              <Heart className="h-4 w-4" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-black text-white shadow-md">
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </Link>

            {/* User Profile & Quick Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 rounded-full border border-white/12 bg-white/[0.04] p-1 pr-3 transition hover:border-white/25 hover:bg-white/[0.08]"
                aria-label="User profile & settings"
              >
                <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-orange-500 text-xs font-black text-black shadow-md shadow-primary/20">
                  {user?.name?.slice(0, 1).toUpperCase() || "A"}
                </div>
                <span className="hidden max-w-[120px] truncate text-xs font-semibold text-white md:inline">
                  {user?.name || "Account"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-white/50" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-64 overflow-hidden rounded-2xl border border-white/15 bg-[#090b12]/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="px-3.5 py-2.5 border-b border-white/10">
                    <p className="truncate text-xs font-bold text-white">{user?.name || "Live TV User"}</p>
                    <p className="truncate text-[11px] text-white/50 font-mono mt-0.5">{user?.email || "Local Profile"}</p>
                    {isAdmin && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-500/30">
                        <Shield className="h-2.5 w-2.5" />
                        ADMINISTRATOR
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
                    >
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>Profile & Settings</span>
                    </Link>

                    <Link
                      href="/favorites"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="h-3.5 w-3.5 text-rose-400" />
                        <span>Saved Channels</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/50">{favorites.length}</span>
                    </Link>

                    <Link
                      href="/history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <History className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Watch History</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/50">{history.length}</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/15 transition mt-1 border-t border-white/5"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Admin Console</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] text-white transition hover:border-white/25 hover:bg-white/[0.08] lg:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <nav
            className="flex flex-col gap-1 border-t border-white/10 bg-[#06080e]/98 px-4 py-3.5 backdrop-blur-2xl lg:hidden animate-in fade-in slide-in-from-top-2"
            aria-label="Mobile navigation"
          >
            {[
              { href: "/", label: "Home", icon: Radio },
              { href: "/live", label: "Live TV", icon: Tv },
              { href: "/tamil", label: "Tamil Live TV (Verified)", icon: Sparkles },
              { href: "/guide", label: "Program Guide & EPG", icon: ListVideo },
              { href: "/favorites", label: "Favorites", icon: Heart, count: favorites.length },
              { href: "/history", label: "Watch History", icon: History, count: history.length },
              { href: "/profile", label: "Profile & Settings", icon: User },
              ...(isAdmin ? [{ href: "/admin", label: "Admin Console", icon: Shield }] : []),
            ].map(({ href, label, icon: Icon, count }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                  pathname === href
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>{label}</span>
                </div>
                {count !== undefined && count > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-mono text-white/60">
                    {count}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Mobile Bottom Navigation Dock */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-white/10 bg-[#06070b]/92 px-2 pb-safe backdrop-blur-2xl lg:hidden"
        aria-label="Mobile quick actions"
      >
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition",
            pathname === "/" ? "text-primary font-bold" : "text-white/50 hover:text-white"
          )}
        >
          <Radio className="h-4.5 w-4.5" />
          <span>Home</span>
        </Link>
        <Link
          href="/live"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition",
            pathname === "/live" ? "text-primary font-bold" : "text-white/50 hover:text-white"
          )}
        >
          <Tv className="h-4.5 w-4.5" />
          <span>Live TV</span>
        </Link>
        <Link
          href="/tamil"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition",
            pathname === "/tamil" ? "text-primary font-bold" : "text-white/50 hover:text-white"
          )}
        >
          <Sparkles className="h-4.5 w-4.5 text-orange-400" />
          <span>Tamil</span>
        </Link>
        <Link
          href="/guide"
          className={cn(
            "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition",
            pathname === "/guide" ? "text-primary font-bold" : "text-white/50 hover:text-white"
          )}
        >
          <ListVideo className="h-4.5 w-4.5" />
          <span>Guide</span>
        </Link>
        <Link
          href="/favorites"
          className={cn(
            "relative flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition",
            pathname === "/favorites" ? "text-rose-400 font-bold" : "text-white/50 hover:text-white"
          )}
        >
          <Heart className="h-4.5 w-4.5" />
          <span>Saved</span>
          {favorites.length > 0 && (
            <span className="absolute top-0.5 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
              {favorites.length > 9 ? "9+" : favorites.length}
            </span>
          )}
        </Link>
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

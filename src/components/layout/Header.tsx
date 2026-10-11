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
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { SearchOverlay } from "@/components/search/SearchOverlay";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/live", label: "Live TV" },
  { href: "/tamil", label: "Tamil TV" },
  { href: "/guide", label: "Guide" },
  { href: "/favorites", label: "Favorites" },
  { href: "/history", label: "History" },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAdmin, favorites } = useAuth();
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
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#060709]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-2.5 shrink-0">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary/20 to-orange-500/10 border border-primary/30 shadow-lg shadow-primary/10 transition group-hover:scale-105 group-hover:border-primary/50">
              <Radio className="h-4.5 w-4.5 text-primary animate-pulse" aria-hidden="true" />
              <div className="absolute -inset-0.5 rounded-xl bg-primary/20 blur-sm -z-10 opacity-0 group-hover:opacity-100 transition" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white sm:text-base leading-none">
                PREMIUM <span className="text-primary font-black">TV</span>
              </span>
              <span className="text-[10px] tracking-widest text-white/40 uppercase font-mono mt-0.5">
                Live Broadcast
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
                    active
                      ? "text-white bg-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  {link.label}
                  {link.href === "/favorites" && favorites.length > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] text-primary font-bold">
                      {favorites.length}
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[13px] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
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
              className="group flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/60 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <Search className="h-3.5 w-3.5 text-white/40 group-hover:text-white transition" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/40 sm:inline">
                ⌘K
              </kbd>
            </button>

            {/* Quick Favorites Link */}
            <Link
              href="/favorites"
              aria-label="Favorites"
              className="relative hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white sm:flex"
            >
              <Heart className="h-4 w-4" />
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-black">
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </Link>

            {/* User Profile & Quick Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 pr-2.5 transition hover:border-white/20 hover:bg-white/[0.08]"
                aria-label="User profile & settings"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-primary/30 to-orange-500/20 border border-primary/40 text-xs font-bold text-primary shadow-sm">
                  {user?.name?.slice(0, 1).toUpperCase() || "A"}
                </div>
                <span className="hidden max-w-[120px] truncate text-xs font-semibold text-white md:inline">
                  {user?.name || "My Account"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-white/50" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0e1017]/95 p-2 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="truncate text-xs font-bold text-white">{user?.name || "Live TV User"}</p>
                    <p className="truncate text-[10px] text-white/50 font-mono">{user?.email || "Local Profile"}</p>
                    {isAdmin && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-500/20">
                        <Shield className="h-2.5 w-2.5" />
                        ADMIN
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
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
                    >
                      <Heart className="h-3.5 w-3.5 text-rose-400" />
                      <span>Saved Channels ({favorites.length})</span>
                    </Link>

                    <Link
                      href="/history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white transition"
                    >
                      <History className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Watch History ({history.length})</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/10 transition"
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
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:border-white/20 hover:bg-white/[0.06] lg:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <nav
            className="flex flex-col gap-1 border-t border-white/10 bg-[#060709]/95 px-4 py-3 backdrop-blur-2xl lg:hidden animate-in fade-in slide-in-from-top-2"
            aria-label="Mobile navigation"
          >
            {[
              { href: "/", label: "Home", icon: Radio },
              { href: "/live", label: "Live TV", icon: Radio },
              { href: "/tamil", label: "Tamil TV", icon: Radio },
              { href: "/guide", label: "Program Guide", icon: ListVideo },
              { href: "/favorites", label: "Favorites", icon: Heart },
              { href: "/history", label: "History", icon: History },
              { href: "/profile", label: "Profile & Settings", icon: User },
              ...(isAdmin ? [{ href: "/admin", label: "Admin Console", icon: Shield }] : []),
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  pathname === href
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        )}
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

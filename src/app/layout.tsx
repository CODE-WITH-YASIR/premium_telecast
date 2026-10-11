import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Premium Live TV — The Next-Gen Streaming Experience",
    template: "%s · Premium Live TV",
  },
  description: "Experience liquid-glass live IPTV television streaming with personal profiles, curated channels, and instantaneous playback.",
};

export const viewport: Viewport = {
  themeColor: "#060709",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <ToastProvider>
          <AuthProvider>
            <Header />
            {/* Skip-nav link for keyboard/screen reader users */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-black focus:shadow-lg"
            >
              Skip to main content
            </a>
            <main id="main-content" tabIndex={-1}>{children}</main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

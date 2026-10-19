import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tamil Kids TV Live — Cartoons & Animation Streams",
  description:
    "Watch live Tamil kids TV broadcasts, animation, and children's content discovered from verified Indian & Tamil IPTV streams.",
};

export default function TamilKidsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

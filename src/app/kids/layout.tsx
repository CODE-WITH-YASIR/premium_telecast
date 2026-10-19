import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kids & Cartoons TV Live — Free Animation & Shows",
  description:
    "Watch live kids TV channels, cartoons, and animated series including POGO, Cartoon Network, Nick, Sony YAY, Chutti TV, and more.",
};

export default function KidsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

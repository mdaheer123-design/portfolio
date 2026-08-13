import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mohamed Daheer | AI / ML Engineer",
  description: "Portfolio of Mohamed Daheer, an AI / ML Engineer building Generative AI, RAG systems, intelligent agents, and production-oriented AI applications.",
  themeColor: "#0A0A0C",
  openGraph: {
    title: "Mohamed Daheer | AI / ML Engineer",
    description: "Production-oriented Generative AI, RAG systems, and intelligent agents.",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Mohamed Daheer - AI / ML Engineer" }],
  },
  twitter: { card: "summary_large_image", title: "Mohamed Daheer | AI / ML Engineer", description: "Building intelligent systems with AI.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${mono.variable}`}>{children}</body></html>;
}

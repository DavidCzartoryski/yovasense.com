import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://yovasense.com"),
  title: "YovaSense — Autonomous operations for GPU infrastructure",
  description: "YovaSense diagnoses GPU infrastructure incidents across GPUs, hosts, networking, schedulers and workloads, runs approved recovery actions and verifies the capacity is healthy.",
  applicationName: "YovaSense",
  authors: [{ name: "David Czartoryski" }, { name: "Thomas Czartoryski" }],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "YovaSense", url: "https://yovasense.com", title: "YovaSense — Autonomous operations for GPU infrastructure" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#02070A", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${martian.variable}`}>
      <body className="yovasense">
        <div id="top">{children}</div>
      </body>
    </html>
  );
}

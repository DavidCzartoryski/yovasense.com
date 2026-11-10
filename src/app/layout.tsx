import type { Metadata, Viewport } from "next";
import { Archivo, Martian_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const martian = Martian_Mono({ subsets: ["latin"], axes: ["wdth"], variable: "--font-martian", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://yovasense.com"),
  title: "YovaSense — Autonomous operations for GPU infrastructure",
  description: "Built for GPU cloud providers and research computing teams. YovaSense finds the root cause, automates the fix and escalates what remains.",
  applicationName: "YovaSense",
  authors: [{ name: "David Czartoryski" }, { name: "Thomas Czartoryski" }],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "YovaSense", url: "https://yovasense.com", title: "YovaSense — Autonomous operations for GPU infrastructure" },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
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

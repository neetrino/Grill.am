import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";

import { notoSansArmenian, notoSerifArmenian } from "@/lib/fonts/armenian";
import { mirageBoldFree } from "@/lib/fonts/mirage-bold";

import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Grill.am",
    template: "%s · Grill.am",
  },
  description: "Fresh grilled food delivery in Armenia",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "128x128" },
      { url: "/favicon.png", type: "image/png", sizes: "128x128" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy" className="h-full" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${geistMono.variable} ${mirageBoldFree.variable} ${notoSerifArmenian.variable} ${notoSansArmenian.variable} flex min-h-dvh flex-col overflow-x-hidden bg-white font-sans antialiased`}
        style={
          {
            "--font-display": "var(--font-montserrat)",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist_Mono, Montserrat } from "next/font/google";

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
    icon: [{ url: "/favicon.webp", type: "image/webp" }],
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
        className={`${montserrat.variable} ${geistMono.variable} ${mirageBoldFree.variable} flex min-h-dvh flex-col overflow-x-hidden bg-[#f2f0f0] font-sans antialiased`}
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

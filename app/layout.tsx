import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC, Space_Grotesk } from "next/font/google";

import { APP_NAME } from "@/lib/constants";

import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Noto_Sans_TC({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "A mobile-first FRC event analyzer that scores teams from -10 to 10 using server-side The Blue Alliance data.",
  applicationName: APP_NAME,
};

export const viewport: Viewport = {
  themeColor: "#071018",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${displayFont.variable} ${bodyFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

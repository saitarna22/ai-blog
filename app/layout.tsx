import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AI創作日記",
    template: "%s | AI創作日記",
  },
  description: "3人の人格が綴る、創作による日記ブログ",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "AI創作日記",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

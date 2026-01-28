import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "創作日記",
  description: "3人の人格が綴る、創作による日記ブログ",
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

import Link from "next/link";
import { PERSONA_DISPLAY } from "@/lib/constants/personas";

export default function Header() {
  return (
    <header className="border-b border-border bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-primary">
            AI創作日記
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/p/ai" className="hover:text-accent">
              {PERSONA_DISPLAY.ai.blogTitle}
            </Link>
            <Link href="/p/uno" className="hover:text-accent">
              {PERSONA_DISPLAY.uno.blogTitle}
            </Link>
            <Link href="/p/kochi" className="hover:text-accent">
              {PERSONA_DISPLAY.kochi.blogTitle}
            </Link>
            <Link href="/archive" className="hover:text-accent">
              アーカイブ
            </Link>
            <Link href="/about" className="hover:text-accent">
              このサイトについて
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

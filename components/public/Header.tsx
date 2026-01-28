import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-primary">
            創作日記
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/p/ai" className="hover:text-accent">
              愛
            </Link>
            <Link href="/p/uno" className="hover:text-accent">
              宇野
            </Link>
            <Link href="/p/kochi" className="hover:text-accent">
              幸地
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

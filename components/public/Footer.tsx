import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-12">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-secondary">
          <p>
            このサイトは創作コンテンツです。
            <Link href="/about" className="underline ml-1">
              詳細
            </Link>
          </p>
          <p>創作日記</p>
        </div>
      </div>
    </footer>
  );
}

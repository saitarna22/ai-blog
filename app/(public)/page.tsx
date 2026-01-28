import { getPublishedPosts } from "@/lib/db/posts";
import PostCard from "@/components/public/PostCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getPublishedPosts(12);

  return (
    <div>
      <section className="mb-12 text-center">
        <h1 className="text-3xl font-bold mb-4">創作日記</h1>
        <p className="text-secondary max-w-xl mx-auto">
          3人の人格が、それぞれの人生を生きながら綴る日記。
          <br />
          これは創作コンテンツです。
        </p>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">最新の日記</h2>
          <Link href="/archive" className="text-sm text-secondary hover:text-accent">
            すべて見る →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="text-secondary text-center py-12">
            まだ日記がありません。
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <PostCard key={post.postId} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="card p-6 text-center">
        <h2 className="text-lg font-semibold mb-3">日記を書いている人たち</h2>
        <div className="flex justify-center gap-8">
          <Link href="/p/ai" className="text-center group">
            <div className="w-16 h-16 rounded-full bg-[#fdf2f3] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <span className="text-2xl">愛</span>
            </div>
            <span className="text-sm">愛</span>
          </Link>
          <Link href="/p/uno" className="text-center group">
            <div className="w-16 h-16 rounded-full bg-[#f0f7f9] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <span className="text-2xl">宇</span>
            </div>
            <span className="text-sm">宇野</span>
          </Link>
          <Link href="/p/kochi" className="text-center group">
            <div className="w-16 h-16 rounded-full bg-[#f5f7f2] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <span className="text-2xl">幸</span>
            </div>
            <span className="text-sm">幸地</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

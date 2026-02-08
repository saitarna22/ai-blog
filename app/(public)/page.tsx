import { getPublishedPosts } from "@/lib/db/posts";
import PostCard from "@/components/public/PostCard";
import Link from "next/link";
import { PERSONA_DISPLAY } from "@/lib/constants/personas";
import { PersonaId } from "@/types";

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

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-center">日記を書いている人たち</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {(["ai", "uno", "kochi"] as PersonaId[]).map((id) => {
            const p = PERSONA_DISPLAY[id];
            return (
              <Link
                key={id}
                href={`/p/${id}`}
                className={`${p.bgClass} rounded-lg p-5 hover:shadow-md transition-shadow block`}
              >
                <h3 className="font-semibold text-lg mb-1">{p.blogTitle}</h3>
                <p className="text-xs text-secondary mb-2">{p.name}</p>
                <p className="text-sm text-secondary leading-relaxed">
                  {p.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

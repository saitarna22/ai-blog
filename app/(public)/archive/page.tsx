import Link from "next/link";
import { getArchiveMonths, getPostsForMonth } from "@/lib/db/posts";
import { formatMonthDisplay } from "@/lib/utils/date";
import PostCard from "@/components/public/PostCard";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { month } = await searchParams;

  if (month) {
    return {
      title: `${formatMonthDisplay(month)}のアーカイブ | 創作日記`,
    };
  }

  return {
    title: "アーカイブ | 創作日記",
  };
}

export default async function ArchivePage({ searchParams }: PageProps) {
  const { month } = await searchParams;
  const months = await getArchiveMonths();

  let posts: Awaited<ReturnType<typeof getPostsForMonth>> = [];
  if (month) {
    posts = await getPostsForMonth(month);
  }

  return (
    <div>
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">アーカイブ</h1>
        <p className="text-secondary">過去の日記を月別に閲覧</p>
      </header>

      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {months.map((m) => (
          <Link
            key={m}
            href={`/archive?month=${m}`}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              month === m
                ? "bg-primary text-white"
                : "bg-muted text-secondary hover:bg-border"
            }`}
          >
            {formatMonthDisplay(m)}
          </Link>
        ))}
      </div>

      {month ? (
        <>
          <h2 className="text-xl font-semibold mb-6 text-center">
            {formatMonthDisplay(month)}の日記
          </h2>
          {posts.length === 0 ? (
            <p className="text-secondary text-center py-12">
              この月の日記はありません。
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.postId} post={post} />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-secondary text-center py-12">
          上の月を選択して日記を表示
        </p>
      )}
    </div>
  );
}

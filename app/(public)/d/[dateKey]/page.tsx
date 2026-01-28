import { notFound } from "next/navigation";
import { getPostsByDate } from "@/lib/db/posts";
import { isValidDateKey } from "@/lib/utils/validators";
import { formatDateDisplay } from "@/lib/utils/date";
import PostCard from "@/components/public/PostCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ dateKey: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { dateKey } = await params;

  if (!isValidDateKey(dateKey)) {
    return { title: "Not Found" };
  }

  return {
    title: `${formatDateDisplay(dateKey)}の日記 | 創作日記`,
  };
}

export default async function DatePage({ params }: PageProps) {
  const { dateKey } = await params;

  if (!isValidDateKey(dateKey)) {
    notFound();
  }

  const posts = await getPostsByDate(dateKey);

  return (
    <div>
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">{formatDateDisplay(dateKey)}</h1>
        <p className="text-secondary">この日の日記</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-secondary text-center py-12">
          この日の日記はありません。
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.postId} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

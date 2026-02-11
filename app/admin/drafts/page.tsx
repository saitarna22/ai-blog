import Link from "next/link";
import { getPostsByStatusAndPersona } from "@/lib/db/posts";
import { formatDateDisplay } from "@/lib/utils/date";
import { PersonaId, PostStatus } from "@/types";
import { personaNames } from "@/lib/constants/personas";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ persona?: string; status?: string }>;
}

export default async function AdminPostsListPage({ searchParams }: PageProps) {
  const { persona, status } = await searchParams;
  const currentStatus: PostStatus = status === "published" ? "published" : "draft";
  const posts = await getPostsByStatusAndPersona(
    currentStatus,
    persona as PersonaId | undefined
  );

  function buildHref(params: { status?: string; persona?: string }) {
    const sp = new URLSearchParams();
    if (params.status) sp.set("status", params.status);
    if (params.persona) sp.set("persona", params.persona);
    const qs = sp.toString();
    return `/admin/drafts${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">投稿一覧</h1>
        <Link href="/admin/generate" className="btn btn-primary">
          新規生成
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        <Link
          href={buildHref({ persona })}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            currentStatus === "draft"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-muted text-secondary hover:bg-border"
          }`}
        >
          下書き
        </Link>
        <Link
          href={buildHref({ status: "published", persona })}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            currentStatus === "published"
              ? "bg-green-100 text-green-800"
              : "bg-muted text-secondary hover:bg-border"
          }`}
        >
          公開済み
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <Link
          href={buildHref({ status: currentStatus === "published" ? "published" : undefined })}
          className={`px-4 py-2 rounded-lg text-sm ${
            !persona ? "bg-primary text-white" : "bg-muted text-secondary hover:bg-border"
          }`}
        >
          すべて
        </Link>
        {(["ai", "uno", "kochi"] as PersonaId[]).map((id) => (
          <Link
            key={id}
            href={buildHref({
              status: currentStatus === "published" ? "published" : undefined,
              persona: id,
            })}
            className={`px-4 py-2 rounded-lg text-sm ${
              persona === id ? "bg-primary text-white" : "bg-muted text-secondary hover:bg-border"
            }`}
          >
            {personaNames[id]}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-secondary">
            {currentStatus === "draft" ? "下書きはありません" : "公開済みの投稿はありません"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Link
              key={post.postId}
              href={`/admin/posts/${post.postId}`}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{post.title}</h2>
                  <p className="text-sm text-secondary mt-1">
                    {formatDateDisplay(post.dateKey)} · {personaNames[post.personaId]}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-muted rounded-full text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {post.image?.url ? (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      画像あり
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                      画像なし
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

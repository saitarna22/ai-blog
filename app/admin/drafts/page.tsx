import Link from "next/link";
import { getDrafts } from "@/lib/db/posts";
import { formatDateDisplay } from "@/lib/utils/date";
import { PersonaId } from "@/types";

const personaNames: Record<PersonaId, string> = {
  ai: "愛",
  uno: "宇野",
  kochi: "幸地",
};

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ persona?: string }>;
}

export default async function AdminDraftsPage({ searchParams }: PageProps) {
  const { persona } = await searchParams;
  const drafts = await getDrafts(persona as PersonaId | undefined);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">下書き一覧</h1>
        <Link href="/admin/generate" className="btn btn-primary">
          新規生成
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <Link
          href="/admin/drafts"
          className={`px-4 py-2 rounded-lg text-sm ${
            !persona ? "bg-primary text-white" : "bg-muted text-secondary hover:bg-border"
          }`}
        >
          すべて
        </Link>
        {(["ai", "uno", "kochi"] as PersonaId[]).map((id) => (
          <Link
            key={id}
            href={`/admin/drafts?persona=${id}`}
            className={`px-4 py-2 rounded-lg text-sm ${
              persona === id ? "bg-primary text-white" : "bg-muted text-secondary hover:bg-border"
            }`}
          >
            {personaNames[id]}
          </Link>
        ))}
      </div>

      {drafts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-secondary">下書きはありません</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {drafts.map((draft) => (
            <Link
              key={draft.postId}
              href={`/admin/posts/${draft.postId}`}
              className="card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold truncate">{draft.title}</h2>
                  <p className="text-sm text-secondary mt-1">
                    {formatDateDisplay(draft.dateKey)} · {personaNames[draft.personaId]}
                  </p>
                  {draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {draft.tags.slice(0, 5).map((tag) => (
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
                  {draft.image?.url ? (
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

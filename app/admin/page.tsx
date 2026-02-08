import Link from "next/link";
import { getDrafts } from "@/lib/db/posts";
import { getJobs } from "@/lib/db/jobs";
import { getAllPersonas } from "@/lib/db/personas";
import { formatDateDisplay, getTodayDateKey } from "@/lib/utils/date";
import { getPostingPersonas } from "@/lib/scheduler/schedule";
import { personaNames } from "@/lib/constants/personas";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [drafts, recentJobs, personas] = await Promise.all([
    getDrafts(),
    getJobs(5),
    getAllPersonas(),
  ]);

  const today = getTodayDateKey();
  const todayPersonas = getPostingPersonas(today);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">ダッシュボード</h1>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="card p-6">
          <h2 className="text-sm text-secondary mb-2">今日の日付</h2>
          <p className="text-lg font-semibold">{formatDateDisplay(today)}</p>
          <p className="text-sm text-secondary mt-1">
            投稿予定: {todayPersonas.map((id) => personaNames[id]).join("、") || "なし"}
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-sm text-secondary mb-2">下書き</h2>
          <p className="text-3xl font-bold">{drafts.length}</p>
          <Link href="/admin/drafts" className="text-sm text-accent hover:underline">
            下書き一覧 →
          </Link>
        </div>

        <div className="card p-6">
          <h2 className="text-sm text-secondary mb-2">登録人格</h2>
          <p className="text-3xl font-bold">{personas.length}</p>
          <Link href="/admin/personas" className="text-sm text-accent hover:underline">
            人格一覧 →
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最近の下書き</h2>
            <Link href="/admin/drafts" className="text-sm text-accent hover:underline">
              すべて見る
            </Link>
          </div>
          {drafts.length === 0 ? (
            <p className="text-secondary text-sm">下書きはありません</p>
          ) : (
            <ul className="space-y-3">
              {drafts.slice(0, 5).map((draft) => (
                <li key={draft.postId}>
                  <Link
                    href={`/admin/posts/${draft.postId}`}
                    className="block hover:bg-muted -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <p className="font-medium truncate">{draft.title}</p>
                    <p className="text-sm text-secondary">
                      {formatDateDisplay(draft.dateKey)} · {personaNames[draft.personaId]}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最近のジョブ</h2>
            <Link href="/admin/jobs" className="text-sm text-accent hover:underline">
              すべて見る
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-secondary text-sm">ジョブはありません</p>
          ) : (
            <ul className="space-y-3">
              {recentJobs.map((job) => (
                <li
                  key={job.jobId}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{job.type}</p>
                    <p className="text-xs text-secondary">{job.dateKey}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      job.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : job.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : job.status === "running"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {job.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/admin/generate" className="btn btn-primary">
          新規生成
        </Link>
      </div>
    </div>
  );
}

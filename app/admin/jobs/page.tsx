import { getJobs } from "@/lib/db/jobs";
import { Job } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const jobs = await getJobs(50);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">ジョブログ</h1>

      {jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-secondary">ジョブはありません</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-medium">ジョブID</th>
                <th className="text-left p-4 font-medium">種類</th>
                <th className="text-left p-4 font-medium">日付</th>
                <th className="text-left p-4 font-medium">人格</th>
                <th className="text-left p-4 font-medium">ステータス</th>
                <th className="text-left p-4 font-medium">作成日時</th>
                <th className="text-left p-4 font-medium">エラー</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <JobRow key={job.jobId} job={job} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function JobRow({ job }: { job: Job }) {
  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  const typeLabels: Record<string, string> = {
    generate_daily: "日次生成",
    generate_single: "個別生成",
    regenerate: "再生成",
  };

  return (
    <tr className="hover:bg-muted/50">
      <td className="p-4 font-mono text-xs">{job.jobId.slice(0, 16)}...</td>
      <td className="p-4">{typeLabels[job.type] || job.type}</td>
      <td className="p-4">{job.dateKey}</td>
      <td className="p-4">{job.personaId || "-"}</td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-xs ${statusColors[job.status]}`}>
          {job.status}
        </span>
      </td>
      <td className="p-4 text-secondary">
        {formatDateTime(job.createdAt)}
      </td>
      <td className="p-4 text-xs text-red-600 max-w-xs truncate">
        {job.result?.error || "-"}
      </td>
    </tr>
  );
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(date);
}

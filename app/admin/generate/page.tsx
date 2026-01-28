"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { PersonaId } from "@/types";

const personaNames: Record<PersonaId, string> = {
  ai: "愛",
  uno: "宇野",
  kochi: "幸地",
};

export default function AdminGeneratePage() {
  const { getToken } = useAuth();

  const [mode, setMode] = useState<"daily" | "single">("daily");
  const [dateKey, setDateKey] = useState(getTodayDateKey());
  const [personaId, setPersonaId] = useState<PersonaId>("ai");
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: unknown;
  } | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setResult(null);

    try {
      const token = await getToken();

      const url = mode === "daily" ? "/api/v1/generate/daily" : "/api/v1/generate";
      const body =
        mode === "daily" ? { dateKey, force } : { dateKey, personaId, force };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: mode === "daily" ? "日次生成が完了しました" : "生成が完了しました",
          data: data.data,
        });
      } else {
        setResult({
          success: false,
          message: data.error || "生成に失敗しました",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "エラーが発生しました",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">投稿生成</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">生成設定</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">生成モード</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "daily"}
                    onChange={() => setMode("daily")}
                  />
                  <span>日次生成</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "single"}
                    onChange={() => setMode("single")}
                  />
                  <span>個別生成</span>
                </label>
              </div>
              <p className="text-xs text-secondary mt-1">
                {mode === "daily"
                  ? "指定日に投稿予定の全人格を自動生成"
                  : "特定の人格のみ生成"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">日付</label>
              <input
                type="date"
                value={dateKey}
                onChange={(e) => setDateKey(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {mode === "single" && (
              <div>
                <label className="block text-sm font-medium mb-2">人格</label>
                <select
                  value={personaId}
                  onChange={(e) => setPersonaId(e.target.value as PersonaId)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {(["ai", "uno", "kochi"] as PersonaId[]).map((id) => (
                    <option key={id} value={id}>
                      {personaNames[id]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                />
                <span className="text-sm">強制再生成</span>
              </label>
              <p className="text-xs text-secondary mt-1">
                既存の下書きがあっても上書きする
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full btn btn-primary py-3"
            >
              {loading ? "生成中..." : "生成開始"}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">結果</h2>

          {loading && (
            <div className="text-center py-8">
              <p className="text-secondary">生成中です。しばらくお待ちください...</p>
              <p className="text-xs text-secondary mt-2">
                テキスト生成と画像生成があるため、時間がかかる場合があります
              </p>
            </div>
          )}

          {result && (
            <div
              className={`p-4 rounded-lg ${
                result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              <p className="font-medium">{result.message}</p>
              {result.data !== undefined && (
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {!loading && !result && (
            <p className="text-secondary text-center py-8">
              生成を開始すると結果がここに表示されます
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 card p-6">
        <h2 className="text-lg font-semibold mb-4">投稿スケジュール</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg bg-[#fdf2f3]">
            <h3 className="font-semibold">愛</h3>
            <p className="text-sm text-secondary mt-1">奇数日（1日、3日、5日...）</p>
          </div>
          <div className="p-4 rounded-lg bg-[#f0f7f9]">
            <h3 className="font-semibold">宇野</h3>
            <p className="text-sm text-secondary mt-1">月・水・金・日曜日</p>
            <p className="text-xs text-secondary">日曜日は甘味回</p>
          </div>
          <div className="p-4 rounded-lg bg-[#f5f7f2]">
            <h3 className="font-semibold">幸地</h3>
            <p className="text-sm text-secondary mt-1">偶数日（2日、4日、6日...）</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTodayDateKey(): string {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const jstDate = new Date(utcTime + jstOffset);
  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, "0");
  const day = String(jstDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

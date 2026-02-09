"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function SeedButton() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleSeed() {
    setLoading(true);
    setResult(null);

    try {
      const token = await getToken();
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setResult({
          success: true,
          message: `初期データを投入しました: ${data.created.join(", ")}`,
        });
      } else {
        setResult({ success: false, message: data.error });
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
    <div className="card p-6">
      <h2 className="text-lg font-semibold mb-2">初期データ投入</h2>
      <p className="text-sm text-secondary mb-4">
        3人のペルソナ（愛・宇野・幸地）の初期データを一括登録します。既にデータがある場合はスキップされます。
      </p>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "投入中..." : "ペルソナ初期データを投入"}
      </button>
      {result && (
        <div
          className={`mt-4 p-3 rounded-lg text-sm ${
            result.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}

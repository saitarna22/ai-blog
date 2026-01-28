"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AdminLoginPage() {
  const { user, loading, isAdmin, signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.push("/admin");
    }
  }, [user, loading, isAdmin, router]);

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);

    try {
      await signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました");
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary">読み込み中...</p>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="card p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold mb-4">アクセス権限がありません</h1>
          <p className="text-secondary mb-6">
            このアカウント（{user.email}）には管理者権限がありません。
            管理者に連絡してください。
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn btn-secondary"
          >
            トップページに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="card p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">管理画面ログイン</h1>
        <p className="text-secondary text-center mb-6">
          管理者アカウントでログインしてください
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full btn btn-primary py-3"
        >
          {signingIn ? "ログイン中..." : "Googleでログイン"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else if (user && !isAdmin && pathname !== "/admin/login") {
        router.push("/admin/login");
      }
    }
  }, [user, loading, isAdmin, pathname, router, mounted]);

  // Login page doesn't need the admin layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary">読み込み中...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const navItems = [
    { href: "/admin", label: "ダッシュボード" },
    { href: "/admin/drafts", label: "下書き" },
    { href: "/admin/personas", label: "人格" },
    { href: "/admin/generate", label: "生成" },
    { href: "/admin/jobs", label: "ジョブ" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-lg font-semibold text-primary">
                管理画面
              </Link>
              <nav className="flex items-center gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm ${
                      pathname === item.href
                        ? "text-primary font-medium"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-secondary">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-secondary hover:text-primary"
              >
                ログアウト
              </button>
              <Link href="/" className="text-sm text-secondary hover:text-primary">
                サイトを見る
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}

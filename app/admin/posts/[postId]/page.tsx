"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Post, PostSection } from "@/types";
import { formatDateDisplay } from "@/lib/utils/date";
import { useAuth } from "@/lib/auth/AuthContext";
import { personaNames } from "@/lib/constants/personas";

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default function AdminPostEditPage({ params }: PageProps) {
  const { postId } = use(params);
  const router = useRouter();
  const { getToken } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [regeneratingImage, setRegeneratingImage] = useState(false);
  const [regeneratingText, setRegeneratingText] = useState(false);
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<PostSection[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  async function fetchPost() {
    try {
      const res = await fetch(`/api/admin/posts/${postId}`);
      if (!res.ok) throw new Error("Post not found");
      const data = await res.json();
      setPost(data.post);
      setTitle(data.post.title);
      setSections(data.post.content.sections);
      setTags(data.post.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: { sections },
          tags,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      await fetchPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!confirm("この下書きを公開しますか？")) return;

    setPublishing(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/posts/${postId}/publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to publish");
      router.push("/admin/drafts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function handleRegenerateImage() {
    if (!confirm("画像を再生成しますか？")) return;

    setRegeneratingImage(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/posts/${postId}/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parts: ["image"] }),
      });

      if (!res.ok) throw new Error("Failed to regenerate image");
      await fetchPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate failed");
    } finally {
      setRegeneratingImage(false);
    }
  }

  async function handleRegenerateText() {
    if (!confirm("テキストを再生成しますか？現在の内容は上書きされます。")) return;

    setRegeneratingText(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`/api/v1/posts/${postId}/regenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parts: ["text"],
          ...(additionalInstructions && { additionalInstructions }),
        }),
      });

      if (!res.ok) throw new Error("Failed to regenerate text");
      await fetchPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Regenerate text failed");
    } finally {
      setRegeneratingText(false);
    }
  }

  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`/api/admin/posts/${postId}/upload-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload image");
      await fetchPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function getImagePrompt(): string {
    if (post?.image?.prompt) return post.image.prompt;
    if (!post) return "";
    return `${post.title} - ${personaNames[post.personaId]}の日記イラスト`;
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(getImagePrompt());
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  function updateSection(index: number, updates: Partial<PostSection>) {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], ...updates };
    setSections(newSections);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-secondary">読み込み中...</p>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => router.back()} className="btn btn-secondary mt-4">
          戻る
        </button>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="text-sm text-secondary hover:text-primary mb-2"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold">投稿編集</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-secondary"
          >
            {saving ? "保存中..." : "保存"}
          </button>
          {post.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="btn btn-primary"
            >
              {publishing ? "公開中..." : "公開"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <label className="block text-sm font-medium mb-2">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {sections.map((section, index) => (
            <div key={section.key} className="card p-6">
              <label className="block text-sm font-medium mb-2">
                {section.title || section.key}
              </label>
              {section.type === "text" ? (
                <textarea
                  value={section.text || ""}
                  onChange={(e) => updateSection(index, { text: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              ) : (
                <textarea
                  value={(section.bullets || []).join("\n")}
                  onChange={(e) =>
                    updateSection(index, {
                      bullets: e.target.value.split("\n").filter((b) => b.trim()),
                    })
                  }
                  rows={6}
                  placeholder="1行に1項目"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              )}
            </div>
          ))}

          <div className="card p-6">
            <label className="block text-sm font-medium mb-2">タグ</label>
            <input
              type="text"
              value={tags.join(", ")}
              onChange={(e) =>
                setTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
              }
              placeholder="カンマ区切りで入力"
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">投稿情報</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-secondary">日付</dt>
                <dd>{formatDateDisplay(post.dateKey)}</dd>
              </div>
              <div>
                <dt className="text-secondary">人格</dt>
                <dd>{personaNames[post.personaId]}</dd>
              </div>
              <div>
                <dt className="text-secondary">ステータス</dt>
                <dd>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      post.status === "published"
                        ? "bg-green-100 text-green-700"
                        : post.status === "draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {post.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-secondary">フォーマット</dt>
                <dd>{post.formatId}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold mb-4">テキスト再生成</h3>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={3}
              placeholder="例: バレンタインの話題を入れてください"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
            <p className="text-xs text-secondary mt-1 mb-3">
              追加指示（任意）
            </p>
            <button
              onClick={handleRegenerateText}
              disabled={regeneratingText}
              className="w-full btn btn-secondary text-sm"
            >
              {regeneratingText ? "テキスト再生成中..." : "テキスト再生成"}
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">画像</h3>
              <div className="flex gap-2">
                <label className={`text-sm cursor-pointer ${uploadingImage ? "text-secondary" : "text-accent hover:underline"}`}>
                  {uploadingImage ? "アップロード中..." : "アップロード"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleRegenerateImage}
                  disabled={regeneratingImage}
                  className="text-sm text-accent hover:underline"
                >
                  {regeneratingImage ? "再生成中..." : "再生成"}
                </button>
              </div>
            </div>
            {post.image?.url ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={post.image.url}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                <p className="text-secondary text-sm">画像なし</p>
              </div>
            )}
            {post.image?.styleKey && (
              <p className="text-xs text-secondary mt-2">
                スタイル: {post.image.styleKey}
              </p>
            )}
            <div className="mt-3">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="text-xs text-secondary hover:text-primary"
              >
                {showPrompt ? "プロンプトを隠す ▲" : "プロンプトを表示 ▼"}
              </button>
              {showPrompt && (
                <div className="mt-2">
                  <pre className="text-xs bg-muted p-3 rounded-lg whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                    {getImagePrompt()}
                  </pre>
                  <button
                    onClick={handleCopyPrompt}
                    className="text-xs text-accent hover:underline mt-1"
                  >
                    {promptCopied ? "コピーしました" : "コピー"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

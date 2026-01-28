"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Persona, PersonaId } from "@/types";
import { useAuth } from "@/lib/auth/AuthContext";

interface PageProps {
  params: Promise<{ personaId: string }>;
}

export default function AdminPersonaEditPage({ params }: PageProps) {
  const { personaId } = use(params);
  const router = useRouter();
  const { getToken } = useAuth();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonText, setJsonText] = useState("");

  useEffect(() => {
    fetchPersona();
  }, [personaId]);

  async function fetchPersona() {
    try {
      const res = await fetch(`/api/admin/personas/${personaId}`);
      if (!res.ok) throw new Error("Persona not found");
      const data = await res.json();
      setPersona(data.persona);
      setJsonText(JSON.stringify(data.persona, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load persona");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      // Parse JSON to validate
      const parsed = JSON.parse(jsonText);

      const token = await getToken();
      const res = await fetch(`/api/admin/personas/${personaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parsed),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      await fetchPersona();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-secondary">読み込み中...</p>
      </div>
    );
  }

  if (error && !persona) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => router.back()} className="btn btn-secondary mt-4">
          戻る
        </button>
      </div>
    );
  }

  if (!persona) return null;

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
          <h1 className="text-2xl font-bold">{persona.name}の編集</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="font-semibold mb-4">人格JSON</h2>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={30}
              className="w-full px-4 py-2 font-mono text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <div className="card p-6">
            <h2 className="font-semibold mb-4">人格情報</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-secondary">ID</dt>
                <dd className="font-mono">{persona.personaId}</dd>
              </div>
              <div>
                <dt className="text-secondary">名前</dt>
                <dd>{persona.name}</dd>
              </div>
              <div>
                <dt className="text-secondary">年齢</dt>
                <dd>{persona.age}歳</dd>
              </div>
              <div>
                <dt className="text-secondary">職業</dt>
                <dd>{persona.occupation}</dd>
              </div>
              <div>
                <dt className="text-secondary">フォーマット数</dt>
                <dd>{persona.formats.length}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6 mt-6">
            <h2 className="font-semibold mb-4">書き方ルール</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-secondary">
              {persona.writingRules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

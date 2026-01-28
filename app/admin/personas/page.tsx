import Link from "next/link";
import { getAllPersonas } from "@/lib/db/personas";

export const dynamic = "force-dynamic";

export default async function AdminPersonasPage() {
  const personas = await getAllPersonas();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">人格一覧</h1>
      </div>

      {personas.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-secondary mb-4">人格が登録されていません</p>
          <p className="text-sm text-secondary">
            Firestoreの personas コレクションに直接追加するか、
            下のサンプルデータを参考にしてください。
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {personas.map((persona) => (
            <Link
              key={persona.personaId}
              href={`/admin/personas/${persona.personaId}`}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{persona.name}</h2>
                  <p className="text-sm text-secondary mt-1">
                    {persona.age}歳 · {persona.occupation}
                  </p>
                  <p className="text-sm text-secondary mt-2 line-clamp-2">
                    {persona.personality}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-muted rounded">
                  {persona.personaId}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {persona.formats.map((format) => (
                  <span
                    key={format.formatId}
                    className="text-xs px-2 py-1 bg-muted rounded"
                  >
                    {format.name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 card p-6">
        <h2 className="text-lg font-semibold mb-4">サンプル人格データ</h2>
        <p className="text-sm text-secondary mb-4">
          以下のJSONをFirestoreの personas コレクションに追加してください。
        </p>
        <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
          {JSON.stringify(samplePersona, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const samplePersona = {
  personaId: "ai",
  name: "愛",
  nameReading: "あい",
  age: 28,
  occupation: "会社員",
  personality: "穏やかで前向き。小さな幸せを見つけるのが得意。",
  background: "東京在住。一人暮らし。休日は散歩や読書を楽しむ。",
  writingRules: [
    "一人称は「私」",
    "です・ます調は使わない",
    "絵文字は使わない",
    "具体的な固有名詞（店名、地名など）は避ける",
    "日常の小さな発見を大切に描写する",
  ],
  formats: [
    {
      formatId: "ai_default",
      name: "通常日記",
      weight: 1,
      sections: [
        { key: "intro", title: "今日のこと", type: "text", required: true },
        { key: "body", title: "", type: "text", required: true },
        { key: "reflection", title: "思ったこと", type: "text", required: false },
      ],
    },
  ],
  imageHint: "Focus on a personal everyday moment and emotional warmth.",
};

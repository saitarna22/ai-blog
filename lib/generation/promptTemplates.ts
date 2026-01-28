import { Persona, PersonaFormat } from "@/types";

export const SYSTEM_PROMPT = `あなたは創作日記ライターです。与えられた人格（ペルソナ）になりきって、その人の視点で日記を書きます。

重要なルール:
1. 出力は必ず有効なJSONのみ（説明文や前置きは不要）
2. 日本語で書く
3. 人格の設定と書き方ルールを厳守する
4. フォーマットのセクションを順番通りに埋める
5. AI感を消し、人間が書いたような自然な文章にする
6. 情報提供ではなく、人格の日常や感情を描く`;

export function buildTextPrompt(params: {
  persona: Persona;
  format: PersonaFormat;
  dateKey: string;
  isFirstPost: boolean;
  previousContext?: string;
}): string {
  const { persona, format, dateKey, isFirstPost, previousContext } = params;

  const writingRulesText = persona.writingRules.map((r, i) => `${i + 1}. ${r}`).join("\n");

  const sectionsSchema = format.sections
    .map((s) => {
      const typeDesc = s.type === "text" ? "string (自由文)" : "string[] (箇条書き)";
      return `  "${s.key}": { title: "${s.title || ""}", type: "${s.type}", value: ${typeDesc} ${s.required ? "(必須)" : "(任意)"} }`;
    })
    .join(",\n");

  let prompt = `# 人格情報
名前: ${persona.name}
年齢: ${persona.age}歳
職業: ${persona.occupation}
性格: ${persona.personality}
背景: ${persona.background}

# 書き方ルール
${writingRulesText}

# 日付
${dateKey}

# フォーマット: ${format.name}
以下のセクション構成で書いてください:
${sectionsSchema}

`;

  if (isFirstPost) {
    prompt += `# 特別指示
これは${persona.name}の最初の記事です。
自己紹介を兼ねた内容にしてください。
自分がどんな人間で、どんな日常を送っているか、読者に伝わるように書いてください。

`;
  }

  if (previousContext) {
    prompt += `# 前回の日記の要約
${previousContext}

これを踏まえて、続きの日常を書いてください。

`;
  }

  prompt += `# 出力形式
以下のJSON形式で出力してください（他の説明は不要）:
{
  "title": "日記のタイトル（短く印象的に）",
  "sections": [
${format.sections.map((s) => `    { "key": "${s.key}", "title": "${s.title || ""}", "type": "${s.type}", ${s.type === "text" ? '"text": "本文..."' : '"bullets": ["項目1", "項目2", ...]'} }`).join(",\n")}
  ],
  "tags": ["タグ1", "タグ2", "タグ3"],
  "imageDescription": "この日記に合う画像の説明（日本語、具体的なシーンや雰囲気を描写）"
}`;

  return prompt;
}

export interface GeneratedContent {
  title: string;
  sections: {
    key: string;
    title?: string;
    type: "text" | "bullets";
    text?: string;
    bullets?: string[];
  }[];
  tags: string[];
  imageDescription: string;
}

export function parseGeneratedContent(output: string): GeneratedContent {
  // Remove markdown code blocks if present
  let cleaned = output.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned);

  // Validate required fields
  if (!parsed.title || typeof parsed.title !== "string") {
    throw new Error("Invalid title in generated content");
  }
  if (!Array.isArray(parsed.sections)) {
    throw new Error("Invalid sections in generated content");
  }
  if (!Array.isArray(parsed.tags)) {
    parsed.tags = [];
  }
  if (!parsed.imageDescription || typeof parsed.imageDescription !== "string") {
    parsed.imageDescription = parsed.title;
  }

  return parsed as GeneratedContent;
}

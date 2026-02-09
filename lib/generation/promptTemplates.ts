import { Persona, PersonaFormat } from "@/types";
import { getSeasonalContext } from "@/lib/scheduler/schedule";

export const SYSTEM_PROMPT = `あなたは創作日記ライターです。与えられた人格（ペルソナ）になりきって、その人の視点で日記を書きます。

重要なルール:
1. 出力は必ず有効なJSONのみ（説明文や前置きは不要）
2. 日本語で書く
3. 人格の設定と書き方ルールを厳守する
4. フォーマットのセクションを順番通りに埋める
5. AI感を消し、人間が書いたような自然な文章にする
6. 情報提供ではなく、人格の日常や感情を描く
7. ストーリーラインがある場合、前回からの連続性を意識する。突然リセットせず、前回の出来事を踏まえた自然な続きにする
8. 季節・天候・行事の情報が与えられたら、日記の中で自然に反映する（無理に全部入れる必要はない）
9. ブログタイトルが与えられた場合、そのブログの雰囲気に合った文体にする`;

export function buildTextPrompt(params: {
  persona: Persona;
  format: PersonaFormat;
  dateKey: string;
  isFirstPost: boolean;
  previousContext?: string;
  additionalInstructions?: string;
}): string {
  const { persona, format, dateKey, isFirstPost, previousContext, additionalInstructions } = params;

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

`;

  // ブログタイトル
  if (persona.blogTitle) {
    prompt += `# ブログタイトル
「${persona.blogTitle}」というタイトルのブログに書く記事です。ブログの雰囲気に合わせてください。

`;
  }

  // ストーリーライン
  if (persona.storyline) {
    const sl = persona.storyline;
    prompt += `# ストーリーライン（現在の状況）
${sl.currentSituation}

`;
    if (sl.ongoingThreads.length > 0) {
      const activeThreads = sl.ongoingThreads.filter((t) => t.status === "active");
      if (activeThreads.length > 0) {
        prompt += `進行中のストーリー:
${activeThreads.map((t) => `- ${t.description}`).join("\n")}

`;
      }
    }
    if (sl.recentEvents.length > 0) {
      prompt += `最近の出来事:
${sl.recentEvents.map((e) => `- ${e}`).join("\n")}

`;
    }
    if (sl.recentMood) {
      prompt += `最近の気分: ${sl.recentMood}

`;
    }
  }

  // 季節・行事情報
  const seasonal = getSeasonalContext(dateKey);
  prompt += `# 季節・イベント情報
季節: ${seasonal.season}（${seasonal.seasonDescription}）
天候のヒント: ${seasonal.weatherHint}
`;
  if (seasonal.events.length > 0) {
    prompt += `この時期の行事: ${seasonal.events.join("、")}
`;
  }
  prompt += "\n";

  // フォーマット指定
  prompt += `# フォーマット: ${format.name}
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

  if (additionalInstructions) {
    prompt += `# 追加指示
${additionalInstructions}

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

/**
 * ストーリーライン更新用のプロンプトを生成
 */
export function buildStorylineUpdatePrompt(params: {
  persona: Persona;
  generatedTitle: string;
  generatedContent: string;
}): string {
  const { persona, generatedTitle, generatedContent } = params;

  const currentStoryline = persona.storyline;

  let prompt = `以下は「${persona.name}」（${persona.occupation}、${persona.age}歳）が書いた日記です。

# 日記タイトル
${generatedTitle}

# 日記内容
${generatedContent}

`;

  if (currentStoryline) {
    prompt += `# 現在のストーリーライン
状況: ${currentStoryline.currentSituation}
最近の気分: ${currentStoryline.recentMood}
進行中のストーリー:
${currentStoryline.ongoingThreads.map((t) => `- [${t.status}] ${t.description}`).join("\n")}
最近の出来事:
${currentStoryline.recentEvents.map((e) => `- ${e}`).join("\n")}

`;
  }

  prompt += `この日記の内容を踏まえて、ストーリーラインを更新してください。
以下のJSON形式で出力してください（他の説明は不要）:

{
  "currentSituation": "現在の状況の要約（1-2文）",
  "ongoingThreads": [
    {
      "threadId": "スレッドID（既存のものは維持、新しいものはsnake_caseで生成）",
      "description": "ストーリーの説明",
      "status": "active | resolved | dormant"
    }
  ],
  "recentEvents": ["最近の出来事1", "最近の出来事2", "最近の出来事3"],
  "recentMood": "最近の気分を一言で"
}

注意:
- ongoingThreadsは最大5つまで。古いresolvedなものは削除してよい
- recentEventsは最新3-5個のみ残す
- 新しいストーリー展開があれば追加する
- 解決したストーリーはresolvedにする`;

  return prompt;
}

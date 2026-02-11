import { Persona, PersonaFormat, PersonaId } from "@/types";
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
9. ブログタイトルが与えられた場合、そのブログの雰囲気に合った文体にする

文章の深みを出すための指針:
10. 五感（視覚・聴覚・嗅覚・味覚・触覚）の描写を積極的に含める。「おいしかった」ではなく、温度・食感・香りまで書く
11. 出来事を羅列せず、一つのエピソードを深く掘り下げる。その瞬間に何を感じ、何を思い出し、何に気づいたかを描く
12. 具体的なディテールを入れる。色、温度、音、匂い、時間帯、光の加減など、その場にいるかのような描写を心がける
13. 感情を直接書くのではなく、行動・仕草・風景に託す。「嬉しかった」より「思わず小さく笑ってしまった」
14. ふとした気づきや心の揺れを大切にする。日常の中に潜む小さな発見や、過去の記憶との繋がりを描く
15. 各テキストセクションは300文字以上を目安にしっかり書く。短くまとめすぎない

読者への価値提供:
16. 日記の中に、人格の専門性や趣味に基づいた豆知識・雑学を自然に織り込む。説明口調ではなく、日常の体験の中で「ふと思い出した」「調べてみたら」のように自然に登場させる
17. 豆知識は具体的で正確な情報にする。読者が「へぇ、知らなかった」と思えるような内容を目指す`;

// ペルソナ別の豆知識・雑学テーマ
const PERSONA_KNOWLEDGE_THEMES: Record<PersonaId, string> = {
  ai: `- 料理の豆知識（お弁当の詰め方のコツ、食材の意外な使い方、海外料理の由来、オリジナルレシピのアイデア）
- 美容・健康の雑学（スキンケアの科学、季節ごとのケア、食べ物と美容の関係）
- 猫・動物の豆知識（猫の行動の意味、品種の特徴、動物の不思議な生態）
- デザインの小ネタ（色の心理効果、フォントの歴史、日常に潜むデザイン）`,
  uno: `- 日本語の雑学（ことわざの由来と本来の意味、難読漢字、美しい日本語表現、季語の話）
- 文学・読書（おすすめの小説や随筆の紹介、作家のエピソード、名文の引用）
- 和菓子・甘味の知識（和菓子の歴史、季節の菓子、茶道との関係、名店の話）
- 京都・歴史の雑学（地名の由来、寺社の豆知識、年中行事の本来の意味）`,
  kochi: `- 旅行の豆知識（穴場スポット、地元民だけが知る名所、旅の裏ワザ、絶景ポイント）
- ローカル鉄道の知識（車窓の見どころ、廃線跡、珍しい駅、鉄道の歴史）
- B級グルメ・郷土料理（各地のソウルフード、料理の由来、地域限定の食文化）
- 銭湯・温泉の雑学（泉質の違い、入浴の効能、レトロ銭湯の魅力、番台文化）`,
};

export interface RecentPostSummary {
  dateKey: string;
  title: string;
  topics: string;
}

export function buildTextPrompt(params: {
  persona: Persona;
  format: PersonaFormat;
  dateKey: string;
  isFirstPost: boolean;
  recentPosts?: RecentPostSummary[];
  additionalInstructions?: string;
}): string {
  const { persona, format, dateKey, isFirstPost, recentPosts, additionalInstructions } = params;

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

  // 豆知識・雑学テーマ
  const knowledgeThemes = PERSONA_KNOWLEDGE_THEMES[persona.personaId as PersonaId];
  if (knowledgeThemes) {
    prompt += `# 豆知識・雑学
日記の中に、以下のテーマから1つ選んで豆知識や雑学を自然に織り込んでください。
説明口調にならず、日常の体験の延長として「ふと思い出した」「前に調べたことがあるんだけど」のように自然に登場させてください。

${knowledgeThemes}

`;
  }

  if (isFirstPost) {
    prompt += `# 特別指示
これは${persona.name}の最初の記事です。
自己紹介を兼ねた内容にしてください。
自分がどんな人間で、どんな日常を送っているか、読者に伝わるように書いてください。

`;
  }

  if (recentPosts && recentPosts.length > 0) {
    prompt += `# 最近の投稿（重複回避のため必ず確認）
${recentPosts.map((p) => `- ${p.dateKey}「${p.title}」: ${p.topics}`).join("\n")}

重要: 上記の投稿と同じテーマ・話題・エピソードは絶対に書かないでください。
前回の内容を踏まえつつ、まったく別の出来事・視点・エピソードで新しい日記を書いてください。
同じ食べ物、同じ場所、同じ行動の繰り返しは避け、この人格の日常の「別の一面」を描いてください。

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
${format.sections.map((s) => `    { "key": "${s.key}", "title": "${s.title || ""}", "type": "${s.type}", ${s.type === "text" ? '"text": "（300文字以上の本文をここに書く。五感の描写や感情の変化を含めて丁寧に書くこと）"' : '"bullets": ["項目1", "項目2", "項目3", "項目4", "項目5"]'} }`).join(",\n")}
  ],
  "tags": ["タグ1", "タグ2", "タグ3"],
  "imageDescription": "この日記に合う画像の説明（日本語、具体的なシーンや雰囲気を描写）"
}

重要: 各textセクションは必ず300文字以上書いてください。短い要約ではなく、情景・感情・五感を込めた読み応えのある文章にしてください。`;

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

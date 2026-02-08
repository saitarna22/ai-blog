# 実装進捗状況

## 最終更新
2026年2月8日

## 実装完了項目

### 1. プロジェクト初期化
- [x] Next.js 16 + TypeScript + Tailwind CSS
- [x] App Router構成
- [x] 依存パッケージ（firebase, firebase-admin, openai）

### 2. Firebase初期化
- [x] `lib/firebase/client.ts` - クライアント側Firebase
- [x] `lib/firebase/admin.ts` - サーバー側Firebase Admin
- [x] `lib/firebase/auth.ts` - 認証ヘルパー

### 3. Firestoreアクセス層
- [x] `lib/db/personas.ts` - 人格CRUD
- [x] `lib/db/posts.ts` - 投稿CRUD
- [x] `lib/db/jobs.ts` - ジョブ管理
- [x] `lib/db/admins.ts` - 管理者チェック

### 4. 認証・権限
- [x] `lib/auth/AuthContext.tsx` - クライアント認証コンテキスト
- [x] `lib/auth/verifyAdmin.ts` - API認証ガード
- [x] `app/api/v1/auth/check/route.ts` - 管理者チェックAPI

### 5. ユーティリティ
- [x] `lib/utils/date.ts` - 日付処理（JST対応）
- [x] `lib/utils/validators.ts` - バリデーション

### 6. 公開ページ
- [x] `app/(public)/page.tsx` - トップページ
- [x] `app/(public)/p/[slug]/page.tsx` - 人格別一覧
- [x] `app/(public)/post/[postId]/page.tsx` - 記事詳細
- [x] `app/(public)/d/[dateKey]/page.tsx` - 日付別ページ
- [x] `app/(public)/archive/page.tsx` - アーカイブ
- [x] `app/(public)/about/page.tsx` - このサイトについて
- [x] `components/public/Header.tsx`
- [x] `components/public/Footer.tsx`
- [x] `components/public/PostCard.tsx`

### 7. 生成機能
- [x] `lib/generation/promptTemplates.ts` - プロンプトテンプレート
- [x] `lib/generation/textPrompt.ts` - テキスト生成
- [x] `lib/generation/imagePrompt.ts` - 画像生成
- [x] `lib/generation/pickFormat.ts` - フォーマット選択
- [x] `lib/generation/generatePost.ts` - 投稿生成統合

### 8. スケジュール
- [x] `lib/scheduler/schedule.ts` - 投稿スケジュール判定

### 9. API
- [x] `app/api/v1/health/route.ts` - ヘルスチェック
- [x] `app/api/v1/generate/route.ts` - 個別生成
- [x] `app/api/v1/generate/daily/route.ts` - 日次生成
- [x] `app/api/v1/posts/[postId]/regenerate/route.ts` - 再生成
- [x] `app/api/admin/posts/[postId]/route.ts` - 投稿取得・更新
- [x] `app/api/admin/posts/[postId]/publish/route.ts` - 公開
- [x] `app/api/admin/personas/[personaId]/route.ts` - 人格取得・更新

### 10. 管理画面
- [x] `app/admin/layout.tsx` - 管理画面レイアウト
- [x] `app/admin/login/page.tsx` - ログイン
- [x] `app/admin/page.tsx` - ダッシュボード
- [x] `app/admin/drafts/page.tsx` - 下書き一覧
- [x] `app/admin/posts/[postId]/page.tsx` - 投稿編集
- [x] `app/admin/personas/page.tsx` - 人格一覧
- [x] `app/admin/personas/[personaId]/page.tsx` - 人格編集
- [x] `app/admin/generate/page.tsx` - 手動生成
- [x] `app/admin/jobs/page.tsx` - ジョブログ

### 11. 設定ファイル
- [x] `types/index.ts` - 型定義（StoryThread, StorylineState追加済み）
- [ ] `.env.example` - 環境変数サンプル（ファイル未作成）
- [x] `next.config.ts` - Next.js設定
- [x] `app/globals.css` - グローバルスタイル

### 12. ペルソナ再設計（2026/2/8追加）
- [x] `lib/constants/personas.ts` - ペルソナ表示情報の一元管理（PERSONA_DISPLAY）
- [x] `types/index.ts` - StoryThread / StorylineState型、PersonaにblogTitle / storyline追加
- [x] `lib/db/personas.ts` - docToPersonaにblogTitle / storyline対応
- [x] `lib/scheduler/schedule.ts` - getSeasonalContext()（季節・行事カレンダー）、isWeekend()
- [x] `lib/generation/pickFormat.ts` - 各ペルソナ4フォーマット、週末ルール追加
- [x] `lib/generation/imagePrompt.ts` - ペルソナ別ヒントをより具体的に更新
- [x] `lib/generation/promptTemplates.ts` - ブログタイトル / ストーリーライン / 季節情報をプロンプトに追加
- [x] `lib/generation/generatePost.ts` - ストーリーライン自動更新処理（非同期）
- [x] 全公開ページ・コンポーネント・管理画面のpersonaNames一元化

## ビルドステータス
- [x] TypeScriptコンパイル成功
- [x] 本番ビルド成功（2026/2/8再確認済み）

## ペルソナ仕様

| ID | 名前 | ブログタイトル | 投稿日 |
|----|------|---------------|--------|
| ai | 高橋 愛（28歳） | 愛のひとりごと | 奇数日 |
| uno | 宇野 康二（63歳） | 宇野康二の散歩日和 | 月水金日 |
| kochi | 幸地 仁（35歳） | 珍道中BLOG | 偶数日 |

### フォーマット一覧
| ペルソナ | フォーマット | weight | 備考 |
|---------|------------|--------|------|
| ai | ai_daily（日常日記） | 3 | |
| ai | ai_bento（お弁当日記） | 2 | |
| ai | ai_mochi（もち観察日記） | 2 | |
| ai | ai_weekend（週末おでかけ日記） | 1 | 土日のみ選択可能 |
| uno | uno_daily（日常日記） | 3 | |
| uno | uno_sweets_sunday（甘味巡り） | 0 | 日曜固定 |
| uno | uno_walk（散歩記録） | 2 | |
| uno | uno_teacher（元教師の独り言） | 1 | |
| kochi | kochi_daily（日常日記） | 2 | |
| kochi | kochi_travel（旅レポ） | 3 | |
| kochi | kochi_incident（珍道中エピソード） | 2 | |
| kochi | kochi_gourmet（B級グルメ探訪） | 2 | |

## 画像生成仕様
- 手描き風イラストのコンセプト
- スタイルプリセット: pencil_sketch, watercolor, urban_sketch, diary_doodle
- DALL-E 3使用

## セットアップ手順

### 1. 環境変数設定
```bash
cp .env.example .env.local
```

必要な環境変数:
- `OPENAI_API_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_*`

### 2. Firebaseセットアップ
1. Firebase Consoleでプロジェクト作成
2. Firestore Database有効化
3. Authentication（Google）有効化
4. Cloud Storage有効化
5. サービスアカウントキー取得

### 3. 管理者登録
Firestoreの `admins` コレクションに以下の形式でドキュメント追加:
```json
{
  "uid": "Firebase Auth UID",
  "email": "admin@example.com",
  "displayName": "管理者名"
}
```

### 4. 人格データ登録
管理画面（/admin/personas）にサンプルJSONあり

### 5. 開発サーバー起動
```bash
npm run dev
```

## 未実装タスク

### デプロイ前に必須
- [ ] Vercelデプロイ設定（プロジェクト作成・環境変数・動作確認）
- [ ] `.env.example` の作成

### 優先度：高
- [ ] Vercel Cronによる日次自動生成
- [ ] Firestoreへのペルソナ初期データ投入（blogTitleフィールド含む）
- [ ] SEO最適化（sitemap.ts / robots.ts / JSON-LD / OGPメタタグ）

### 優先度：中
- [ ] RSS/Atomフィード
- [ ] SNS共有ボタン
- [ ] アナリティクス導入
- [ ] エラーハンドリング強化

### 優先度：低
- [ ] テスト基盤（vitest等）
- [ ] 収益化機能
- [ ] コメント機能
- [ ] いいね/お気に入り機能

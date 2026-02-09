# AI Blog - プロジェクト要約・タスク管理

## プロジェクト概要

AI（人工知能）が自動生成する日記ブログアプリケーション。3人の架空キャラクター（ペルソナ）がそれぞれのスケジュールで日記を投稿する仕組み。管理者が管理画面から生成・レビュー・公開を行うワークフローを持つ。

### ペルソナ

| ID | 名前 | ブログタイトル | 投稿日 | 特徴 |
|----|------|---------------|--------|------|
| ai | 高橋 愛（28歳） | 愛のひとりごと | 奇数日 | UIデザイナー。下北沢で保護猫「もち」と暮らす。お弁当作りと古着屋巡りが趣味 |
| uno | 宇野 康二（63歳） | 宇野康二の散歩日和 | 月水金日 | 元国語教師。京都・北白川で妻と暮らす。散歩と甘味処巡りが日課。日曜は「甘味回」固定 |
| kochi | 幸地 仁（35歳） | 珍道中BLOG | 偶数日 | フリーランス・トラベルライター。沖縄出身、日本各地を放浪中。ローカル鉄道とB級グルメ好き |

※ ブログタイトルには「AI」「人工知能」のアナグラムが仕込まれている

テキストはOpenAI GPT-4oで生成し、画像はDALL-E 3で手描き風イラストを自動生成する。

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16.1.6（App Router） |
| 言語 | TypeScript 5 |
| UI | React 19.2.3 + Tailwind CSS 4 |
| データベース | Firebase Firestore |
| 認証 | Firebase Auth（Google OAuth） |
| ストレージ | Firebase Cloud Storage |
| テキスト生成 | OpenAI GPT-4o |
| 画像生成 | OpenAI DALL-E 3 |
| デプロイ先 | Vercel（予定） |

---

## ディレクトリ構成

```
ai-blog/
├── app/
│   ├── (public)/          # 公開ページ（トップ、人格別、記事詳細、アーカイブ等）
│   ├── admin/             # 管理画面（ログイン、ダッシュボード、編集、生成等）
│   ├── api/               # APIエンドポイント（生成、認証、CRUD）
│   ├── layout.tsx         # ルートレイアウト
│   └── globals.css        # グローバルスタイル
├── components/public/     # 共通UIコンポーネント（Header, Footer, PostCard）
├── lib/
│   ├── constants/         # 共通定数（ペルソナ表示情報の一元管理）
│   ├── firebase/          # Firebase初期化（client, admin, auth）
│   ├── auth/              # 認証コンテキスト・APIガード
│   ├── db/                # Firestoreアクセス層（posts, personas, jobs, admins）
│   ├── generation/        # AI生成ロジック（テキスト、画像、プロンプト、フォーマット選択）
│   ├── scheduler/         # 投稿スケジュール・季節カレンダー
│   └── utils/             # ユーティリティ（日付処理、バリデーション）
├── types/                 # TypeScript型定義
└── public/                # 静的アセット
```

---

## Firestoreコレクション

| コレクション | 用途 |
|-------------|------|
| `posts` | 日記投稿（draft / published / archived） |
| `personas` | ペルソナ定義（名前、性格、書き方ルール、フォーマット等） |
| `jobs` | 生成ジョブのログ管理 |
| `admins` | 管理者ユーザー登録 |

---

## 主要APIエンドポイント

| メソッド | パス | 機能 |
|---------|------|------|
| GET | `/api/cron/daily` | Vercel Cron日次自動生成（CRON_SECRET認証） |
| GET | `/api/v1/health` | ヘルスチェック |
| POST | `/api/v1/generate` | 個別ペルソナの投稿生成 |
| POST | `/api/v1/generate/daily` | 日次バッチ生成 |
| POST | `/api/v1/posts/[postId]/regenerate` | テキスト/画像の再生成 |
| GET | `/api/v1/auth/check` | 管理者ステータス確認 |
| GET/PATCH | `/api/admin/posts/[postId]` | 投稿の取得・更新 |
| POST | `/api/admin/posts/[postId]/publish` | 投稿の公開 |
| GET/PUT | `/api/admin/personas/[personaId]` | ペルソナの取得・更新 |

---

## タスク管理

### 完了済みタスク

- [x] **プロジェクト初期化** - Next.js 16 + TypeScript + Tailwind CSS セットアップ
- [x] **Firebase初期化** - client / admin / auth ヘルパー
- [x] **Firestoreアクセス層** - posts / personas / jobs / admins の CRUD
- [x] **認証・権限** - Google OAuth ログイン、管理者チェック、APIガード
- [x] **ユーティリティ** - 日付処理（JST対応）、バリデーション
- [x] **公開ページ一式** - トップ / 人格別一覧 / 記事詳細 / 日付別 / アーカイブ / About
- [x] **共通UIコンポーネント** - Header / Footer / PostCard
- [x] **AI生成機能** - テキスト生成（GPT-4o）、画像生成（DALL-E 3）、プロンプトテンプレート
- [x] **フォーマット選択ロジック** - 重み付きランダム選択、連続回避ルール
- [x] **投稿スケジュール判定** - ペルソナ別の投稿日判定ロジック
- [x] **API実装** - ヘルスチェック / 生成 / 日次生成 / 再生成 / 認証チェック / CRUD
- [x] **管理画面** - ログイン / ダッシュボード / 下書き一覧 / 投稿編集 / 人格管理 / 手動生成 / ジョブログ
- [x] **公開ワークフロー** - 下書き → レビュー → 公開（承認者記録付き）
- [x] **画像リトライロジック** - 最大2回の再試行
- [x] **型定義** - TypeScript型の一元管理
- [x] **スタイリング** - 日記風の暖色パレット、ペルソナ別カラースキーム
- [x] **ビルド確認** - TypeScriptコンパイル成功、本番ビルド成功
- [x] **ペルソナ再設計**（2026/2/8）
  - ペルソナ3人の設定を大幅リニューアル（名前・職業・性格・背景を具体化）
  - ブログタイトル追加: 愛のひとりごと / 宇野康二の散歩日和 / 珍道中BLOG
  - ペルソナ表示情報を`lib/constants/personas.ts`に一元化（6箇所以上の重複定義を解消）
  - 各ペルソナに4種のフォーマット定義（計12フォーマット）
  - ストーリーライン記憶システム（`StorylineState`型 + 生成後の自動更新）
  - 季節・行事カレンダー（`getSeasonalContext()` - 12ヶ月分の行事データ内蔵）
  - プロンプト強化（ブログタイトル / ストーリーライン / 季節情報をプロンプトに注入）
  - 画像プロンプトのペルソナ別ヒントをより具体的に更新
  - 全ページ・コンポーネント・管理画面のUI更新
- [x] **Vercelデプロイ準備 + Cron自動化 + SEO対応**（2026/2/8）
  - `.env.example` 新規作成（全12環境変数をカテゴリ別に記載）
  - `vercel.json` 新規作成（UTC 21:00 = JST 06:00 の日次cron設定）
  - `app/api/cron/daily/route.ts` 新規作成（`CRON_SECRET`認証、`maxDuration=300`、`force: false`固定）
  - `app/sitemap.ts` 新規作成（静的ページ + ペルソナページ + 全公開記事、dynamic）
  - `app/robots.ts` 新規作成（全クローラー許可、`/api/` `/admin/` 除外）
  - `app/layout.tsx` 修正（`metadataBase`、`title.template`、OGP・Twitter Card設定）
  - `app/(public)/post/[postId]/page.tsx` 修正（記事OGP: `og:image`、`article`タイプ、Twitter Card）

---

### 未完了タスク（今後の拡張）

#### 優先度：最高（デプロイ前に必須）
- [ ] **Vercelデプロイ実施**
  - Vercel プロジェクト作成・環境変数設定・初回デプロイ
  - 動作確認（SSR / API Routes / Cron が正常に動くこと）
- [ ] **Firestoreへのペルソナ初期データ投入**
  - 管理画面のサンプルJSONをFirestoreに登録
  - `blogTitle` フィールドが既存データにない場合の対応確認

#### 優先度：高
- [ ] **構造化データ（JSON-LD）** - BlogPosting スキーマの埋め込み（SEO残タスク）
- [ ] **RSS/Atom フィード** - `/feed` エンドポイントでフィード配信
- [ ] **SNS共有機能** - Twitter/X、LINE等のシェアボタン設置
- [ ] **エラーハンドリング強化**
  - OpenAI API エラー時のユーザー向けメッセージ改善
  - 画像生成失敗時のフォールバック画像表示

#### 優先度：中
- [ ] **アナリティクス導入** - ページビュー・ユーザー行動の計測（Google Analytics等）
- [ ] **テスト基盤** - vitest 等の導入。主要ロジック（スケジュール判定、フォーマット選択、季節カレンダー）のユニットテスト

#### 優先度：低（将来検討）
- [ ] **収益化機能** - 広告表示、スポンサーシップ等
- [ ] **コメント機能** - 読者からのコメント・リアクション
- [ ] **いいね/お気に入り機能** - 読者のエンゲージメント向上
- [ ] **多言語対応** - 英語版等の国際化

---

## セットアップ手順（参考）

1. `.env.example` を `.env.local` にコピーし、環境変数を設定
2. Firebase Console でプロジェクト作成（Firestore / Auth / Storage 有効化）
3. Firestore `admins` コレクションに管理者を登録
4. 管理画面 `/admin/personas` からペルソナデータを登録
5. `npm run dev` で開発サーバー起動

---

*最終更新: 2026年2月8日（Vercelデプロイ準備 + Cron自動化 + SEO対応）*



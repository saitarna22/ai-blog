# Vercel デプロイ手順書

---

## Step 0: 前提準備

以下の3つのサービスのセットアップを先に完了させる。

### 0-1: Vercel アカウント作成

1. https://vercel.com にアクセス
2. 「Sign Up」をクリック
3. **「Continue with GitHub」** を選択（GitHub連携が最もスムーズ）
4. GitHub の認可画面が表示されたら「Authorize Vercel」をクリック
5. Vercel のダッシュボードが表示されれば完了

> プラン選択: まずは **Hobby（無料）** で問題ない。
> ただし Hobby プランでは Serverless Function のタイムアウトが最大60秒のため、
> 画像生成（DALL-E 3）を含む日次生成がタイムアウトする可能性がある。
> 運用開始後に問題があれば **Pro プラン（$20/月）** へのアップグレードを検討。

### 0-2: Firebase プロジェクト作成

#### プロジェクト作成

1. https://console.firebase.google.com にアクセス（Google アカウントでログイン）
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `ai-blog`）
4. Google Analytics の設定 → 今回は不要なのでオフでOK → 「プロジェクトを作成」
5. 作成完了したら「続行」をクリック

#### Firestore 有効化

1. 左メニュー「構築」→「Firestore Database」をクリック
2. 「データベースを作成」をクリック
3. ロケーション選択: **asia-northeast1（東京）** を推奨
4. セキュリティルール: 「テストモードで開始」を選択（後で本番ルールに変更する）
5. 「作成」をクリック

#### Authentication 有効化

1. 左メニュー「構築」→「Authentication」をクリック
2. 「始める」をクリック
3. ログイン方法タブ → 「Google」をクリック
4. 「有効にする」トグルをオンにする
5. プロジェクトのサポートメール: 自分のメールアドレスを選択
6. 「保存」をクリック

#### Cloud Storage 有効化

1. 左メニュー「構築」→「Storage」をクリック
2. 「始める」をクリック
3. セキュリティルール: 「テストモードで開始」を選択
4. ロケーション: Firestore と同じ **asia-northeast1** を選択
5. 「完了」をクリック

#### Web アプリ登録（Client SDK 用の設定値を取得）

1. プロジェクト概要ページ（左上の家アイコン）に戻る
2. 「アプリを追加」→ **Web（`</>`アイコン）** をクリック
3. アプリのニックネーム: `ai-blog-web`（任意）
4. 「Firebase Hosting を設定」はチェック不要
5. 「アプリを登録」をクリック
6. 表示される `firebaseConfig` の値を控える:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",           // → NEXT_PUBLIC_FIREBASE_API_KEY
     authDomain: "xxx.firebaseapp.com",  // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     projectId: "ai-blog-xxx",   // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
     storageBucket: "ai-blog-xxx.firebasestorage.app", // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   };
   ```
7. 「コンソールに進む」をクリック

#### サービスアカウントキーの取得（Admin SDK 用）

1. Firebase Console 左上の歯車アイコン → 「プロジェクトの設定」
2. 「サービス アカウント」タブをクリック
3. 「新しい秘密鍵の生成」ボタンをクリック
4. 確認ダイアログで「キーを生成」をクリック → JSON ファイルがダウンロードされる
5. JSON を開いて以下の値を控える:
   ```json
   {
     "project_id": "ai-blog-xxx",   // → FIREBASE_PROJECT_ID
     "client_email": "firebase-adminsdk-xxxxx@ai-blog-xxx.iam.gserviceaccount.com", // → FIREBASE_CLIENT_EMAIL
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" // → FIREBASE_PRIVATE_KEY
   }
   ```

> **重要**: ダウンロードした JSON はパスワード同然。Git にコミットしないこと。
> 環境変数に設定したら、ローカルの JSON は安全な場所に保管するか削除する。

### 0-3: OpenAI API キーの取得

1. https://platform.openai.com にアクセス（アカウントがなければ Sign Up）
2. 右上のアイコン → 「Your profile」→ 左メニュー「API keys」
   （直接 URL: https://platform.openai.com/api-keys ）
3. 「Create new secret key」をクリック
4. Name: `ai-blog`（任意）→ 「Create secret key」
5. 表示されたキー（`sk-...`）をコピーして控える

> **重要**: キーは一度しか表示されない。コピーし忘れたら再生成が必要。

#### 料金について

| モデル | 用途 | 目安コスト（1記事あたり） |
|--------|------|-------------------------|
| GPT-4o | テキスト生成 | 約 $0.01〜0.03 |
| DALL-E 3 | 画像生成 | 約 $0.04（1024x1024） |

- 3人分の日記を毎日生成した場合: 月 **約 $5〜7** 程度
- OpenAI の Usage ページ（ https://platform.openai.com/usage ）で使用量を確認可能
- 予算上限の設定を推奨: Settings → Limits → 「Set a monthly budget」

---

## Step 1: Vercel プロジェクト作成

1. https://vercel.com/dashboard にアクセス
2. 「Add New...」→「Project」をクリック
3. GitHub リポジトリ `ai-blog` を Import
4. Framework Preset: **Next.js**（自動検出されるはず）
5. **まだ Deploy しない** → 先に Step 2 で環境変数を設定

---

## Step 2: 環境変数の設定

Vercel の Project Settings → Environment Variables に以下を登録する。

### Firebase Client SDK（4つ）

| 変数名 | 取得場所 |
|--------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | 同上 |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | 同上 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | 同上 |

### Firebase Admin SDK（3つ）

| 変数名 | 取得場所 |
|--------|---------|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Project Settings → Service accounts → Generate new private key → JSON 内の `client_email` |
| `FIREBASE_PRIVATE_KEY` | 同 JSON 内の `private_key`。**Vercel では改行を含む値をそのままペースト可能**（コード側で `replace(/\\n/g, '\n')` 処理済み） |

> `FIREBASE_PRIVATE_KEY` の設定方法:
> 1. ダウンロードした JSON を開く
> 2. `private_key` の値（`"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`）をコピー
> 3. Vercel の環境変数フォームにそのままペースト（前後のダブルクォーテーションは除く）

### OpenAI（3つ）

| 変数名 | 値 |
|--------|-----|
| `OPENAI_API_KEY` | OpenAI ダッシュボードから取得した API キー |
| `OPENAI_TEXT_MODEL` | 省略可（デフォルト: `gpt-4o`） |
| `OPENAI_IMAGE_MODEL` | 省略可（デフォルト: `dall-e-3`） |

### Cron 認証（1つ）

| 変数名 | 値 |
|--------|-----|
| `CRON_SECRET` | 任意のランダム文字列（例: `openssl rand -hex 32` で生成） |

> Vercel Cron は `Authorization: Bearer <CRON_SECRET>` ヘッダーを自動送信する。
> Vercel の Settings → Environment Variables で `CRON_SECRET` を設定すれば自動で紐づく。

### サイト URL（1つ）

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_BASE_URL` | デプロイ後のサイト URL（例: `https://ai-blog-xxx.vercel.app`）。末尾スラッシュなし |

> 初回デプロイ時はまだ URL が分からないので、仮に `https://example.com` を設定 → デプロイ後に正しい URL に更新 → 再デプロイ。
> カスタムドメインを設定する場合はそのドメインを使用。

---

## Step 3: 初回デプロイ

1. 環境変数をすべて設定したら「Deploy」をクリック
2. ビルドが成功することを確認
3. デプロイ URL を取得（例: `https://ai-blog-xxx.vercel.app`）
4. `NEXT_PUBLIC_BASE_URL` を正しい URL に更新して再デプロイ

---

## Step 4: Firebase 側の設定

### 4-1: Auth の承認済みドメイン追加

1. Firebase Console → Authentication → Settings → Authorized domains
2. Vercel のデプロイ URL を追加（例: `ai-blog-xxx.vercel.app`）
3. カスタムドメインを使う場合はそれも追加

### 4-2: 管理者ユーザーの登録

1. まず Google アカウントで `/admin/login` にアクセスしてログイン（初回は権限エラーになるが、Auth にユーザーが作られる）
2. Firebase Console → Firestore → `admins` コレクションを手動作成
3. ドキュメント追加:
   - ドキュメント ID: Google アカウントの UID（Firebase Console → Authentication → Users で確認）
   - フィールド:
     - `email`（string）: ログインした Google アカウントのメールアドレス
     - `name`（string）: 管理者名（任意）
     - `role`（string）: `admin`
     - `createdAt`（timestamp）: 現在時刻

### 4-3: Firestore セキュリティルール（推奨）

Firebase Console → Firestore → Rules に以下を設定:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 公開記事は誰でも読める
    match /posts/{postId} {
      allow read: if resource.data.status == "published";
    }
    // ペルソナは誰でも読める
    match /personas/{personaId} {
      allow read: if true;
    }
    // その他はすべて拒否（Admin SDKはルール無視で動作する）
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Step 5: ペルソナ初期データ投入

管理画面にログイン後、ブラウザの開発者ツール（Console）から実行:

```js
const res = await fetch('/api/admin/seed', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + await firebase.auth().currentUser.getIdToken()
  }
});
console.log(await res.json());
```

もしくは管理画面 `/admin/personas` でサンプル JSON をコピーして Firebase Console から直接登録。

> シードAPIは既存データがある場合はスキップするため、二重投入の心配はない。

---

## Step 6: 動作確認チェックリスト

- [ ] トップページ `/` が表示される
- [ ] `/admin/login` で Google ログインできる
- [ ] `/admin` ダッシュボードが表示される
- [ ] `/admin/personas` に 3 人のペルソナが表示される
- [ ] `/admin/generate` から手動生成が成功する
- [ ] 生成された下書きが `/admin/drafts` に表示される
- [ ] 下書きを公開して `/` に記事が表示される
- [ ] `/sitemap.xml` が正しく返される
- [ ] `/robots.txt` が正しく返される
- [ ] Vercel ダッシュボード → Cron Jobs に `/api/cron/daily` が登録されている

---

## Cron 自動生成について

- `vercel.json` の設定により、毎日 **UTC 21:00（= JST 翌 06:00）** に `/api/cron/daily` が自動実行される
- `getTodayDateKey()` は JST 基準なので、JST 06:00 実行で当日分として正しく処理される
- `force: false` 固定のため、同日に再実行しても重複生成されない（冪等）
- Vercel の Cron Jobs 画面で実行履歴を確認可能
- **Vercel Hobby プランでは1日1回の Cron が上限**。Pro プランでは頻度を上げられる

---

## トラブルシューティング

### ビルドエラー: `FIREBASE_PRIVATE_KEY`
- 改行文字 `\n` がエスケープされていないか確認
- Vercel の Sensitive タイプで設定すると安全

### Cron が動かない
- `CRON_SECRET` が Vercel の環境変数に設定されているか確認
- Vercel ダッシュボード → Cron Jobs で状態を確認
- ログは Vercel Functions → Logs で確認可能

### 画像生成がタイムアウト
- `maxDuration = 300`（5分）を設定済み
- Vercel Hobby プランでは最大 60 秒。**画像生成を含むため Pro プラン推奨**
- Hobby プランの場合、画像生成が間に合わない可能性がある

# Vercel デプロイ手順書

## 前提条件

- GitHub にリポジトリが push 済みであること
- Vercel アカウントを持っていること
- Firebase プロジェクトが作成済みであること（Firestore / Auth / Storage 有効化済み）
- OpenAI API キーを取得済みであること

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

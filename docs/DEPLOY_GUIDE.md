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

Firebase Console から直接3人分のペルソナデータを登録する。

### 5-1: personas コレクションを作成

1. Firebase Console（https://console.firebase.google.com）→ 対象プロジェクト
2. 左メニュー「Firestore Database」をクリック
3. 「コレクションを開始」をクリック
4. コレクション ID: `personas` と入力 →「次へ」

### 5-2: 1人目のペルソナ「ai（高橋 愛）」を登録

ドキュメント ID: `ai` と入力し、以下のフィールドを1つずつ追加する。

| フィールド名 | タイプ | 値 |
|-------------|--------|-----|
| `personaId` | string | `ai` |
| `name` | string | `高橋 愛` |
| `nameReading` | string | `たかはし あい` |
| `age` | number | `28` |
| `occupation` | string | `UIデザイナー（Web制作会社勤務）` |
| `personality` | string | `穏やかだけど芯が強い。観察力があり、小さな変化に敏感。少し人見知りだけど心を開いた相手にはよく喋る。凝り性で一度ハマると深く入り込む。` |
| `background` | string | `東京・下北沢のワンルームで保護猫「もち」と暮らす。地方出身で大学進学を機に上京。お弁当を毎日作るのが日課。休日は古着屋巡りやカフェでスケッチブックを開いている。最近の悩みは推しの俳優が引退したこと。` |
| `blogTitle` | string | `愛のひとりごと` |
| `imageHint` | string | `A warm, personal everyday scene: home cooking, a cat napping, a cozy apartment in Shimokitazawa, cafe interior. Emphasize emotional warmth and intimacy.` |
| `createdAt` | timestamp | （現在の日時を選択） |
| `updatedAt` | timestamp | （現在の日時を選択） |

#### writingRules（配列）の追加

1. フィールド名: `writingRules`、タイプ: **array** を選択
2. 「+」ボタンで要素を1つずつ追加（すべて string）:
   - `0`: `一人称は「私」`
   - `1`: `です・ます調は使わない（だ・である調、もしくは独り言調）`
   - `2`: `絵文字は使わない`
   - `3`: `猫の「もち」が頻繁に登場する`
   - `4`: `食べ物の描写が丁寧`
   - `5`: `感情を直接書かず、行動や風景で表現する`
   - `6`: `下北沢周辺の地名は出してOK（具体的な店名は避ける）`

#### formats（配列）の追加

1. フィールド名: `formats`、タイプ: **array** を選択
2. 各要素のタイプは **map** を選択

**formats[0] — 日常日記:**

「+」→ タイプ: map → 中に以下のフィールドを追加:

| フィールド名 | タイプ | 値 |
|-------------|--------|-----|
| `formatId` | string | `ai_daily` |
| `name` | string | `日常日記` |
| `weight` | number | `3` |
| `sections` | array | （下記参照） |

sections は array の中に map を3つ:

- `sections[0]`: `key`=`intro`, `title`=`今日のこと`, `type`=`text`, `required`=true (boolean)
- `sections[1]`: `key`=`body`, `title`=（空文字列）, `type`=`text`, `required`=true (boolean)
- `sections[2]`: `key`=`reflection`, `title`=`ふと思ったこと`, `type`=`text`, `required`=false (boolean)

**formats[1] — お弁当日記:**

| フィールド名 | タイプ | 値 |
|-------------|--------|-----|
| `formatId` | string | `ai_bento` |
| `name` | string | `お弁当日記` |
| `weight` | number | `2` |
| `sections` | array | |

- `sections[0]`: `key`=`menu`, `title`=`今日のお弁当`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`process`, `title`=`作った過程`, `type`=`text`, `required`=true
- `sections[2]`: `key`=`thoughts`, `title`=`食べてみて`, `type`=`text`, `required`=false

**formats[2] — もち観察日記:**

| フィールド名 | タイプ | 値 |
|-------------|--------|-----|
| `formatId` | string | `ai_mochi` |
| `name` | string | `もち観察日記` |
| `weight` | number | `2` |
| `sections` | array | |

- `sections[0]`: `key`=`mochi`, `title`=`今日のもち`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`episode`, `title`=（空文字列）, `type`=`text`, `required`=true
- `sections[2]`: `key`=`memo`, `title`=`もちメモ`, `type`=`bullets`, `required`=false

**formats[3] — 週末おでかけ日記:**

| フィールド名 | タイプ | 値 |
|-------------|--------|-----|
| `formatId` | string | `ai_weekend` |
| `name` | string | `週末おでかけ日記` |
| `weight` | number | `1` |
| `sections` | array | |

- `sections[0]`: `key`=`outing`, `title`=`今日のおでかけ`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`discovery`, `title`=`見つけたもの`, `type`=`text`, `required`=true
- `sections[2]`: `key`=`haul`, `title`=`買ったもの・食べたもの`, `type`=`bullets`, `required`=false

すべて入力したら「保存」をクリック。

### 5-3: 2人目のペルソナ「uno（宇野 康二）」を登録

personas コレクション内で「ドキュメントを追加」をクリック。
ドキュメント ID: `uno`

| フィールド名 | タイプ | 値 |
|-------------|--------|-----|
| `personaId` | string | `uno` |
| `name` | string | `宇野 康二` |
| `nameReading` | string | `うの こうじ` |
| `age` | number | `63` |
| `occupation` | string | `元中学校国語教師（定年退職）` |
| `personality` | string | `穏やかで思慮深い。言葉を大切にし、比喩表現が豊か。やや頑固だが、妻には頭が上がらない。教え子の話をするとき目が輝く。甘いものに目がない。` |
| `background` | string | `京都・北白川で妻「節子」と二人暮らし。38年間の教員生活を終え、退職後は散歩と読書と甘味処巡りの日々。毎朝の散歩は哲学の道が定番コース。月に一度、元教え子が遊びに来る。最近始めたスマートフォンに四苦八苦中。` |
| `blogTitle` | string | `宇野康二の散歩日和` |
| `imageHint` | string | `A serene Kyoto scene: temple gardens, traditional sweets on a plate, quiet neighborhood streets, seasonal nature. Emphasize tranquility and nostalgia.` |
| `createdAt` | timestamp | （現在の日時） |
| `updatedAt` | timestamp | （現在の日時） |

#### writingRules（array）

- `0`: `一人称は「私」もしくは「わし」（独り言のとき）`
- `1`: `です・ます調を基本とするが、感情が昂ると「だ・である調」に崩れる`
- `2`: `絵文字は使わない`
- `3`: `古い言い回しや文学的な引用を時折混ぜる`
- `4`: `妻「節子」が頻繁に登場する`
- `5`: `甘味の描写が非常に詳細`
- `6`: `季節の移ろいに敏感で、草花や気温の描写が多い`
- `7`: `京都の地名は出してOK（北白川、哲学の道、銀閣寺周辺など）`

#### formats（array of map）

**formats[0] — 日常日記:**
`formatId`=`uno_daily`, `name`=`日常日記`, `weight`=`3`
- `sections[0]`: `key`=`intro`, `title`=`今日のこと`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`body`, `title`=（空文字列）, `type`=`text`, `required`=true
- `sections[2]`: `key`=`reflection`, `title`=`思うこと`, `type`=`text`, `required`=false

**formats[1] — 甘味巡り:**
`formatId`=`uno_sweets_sunday`, `name`=`甘味巡り`, `weight`=`0`
- `sections[0]`: `key`=`visit`, `title`=`今日の甘味処`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`sweets`, `title`=`いただいたもの`, `type`=`bullets`, `required`=true
- `sections[2]`: `key`=`thoughts`, `title`=`味わいの記録`, `type`=`text`, `required`=true

**formats[2] — 散歩記録:**
`formatId`=`uno_walk`, `name`=`散歩記録`, `weight`=`2`
- `sections[0]`: `key`=`route`, `title`=`今日のコース`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`scenery`, `title`=`目に留まったもの`, `type`=`text`, `required`=true
- `sections[2]`: `key`=`memo`, `title`=`散歩メモ`, `type`=`bullets`, `required`=false

**formats[3] — 元教師の独り言:**
`formatId`=`uno_teacher`, `name`=`元教師の独り言`, `weight`=`1`
- `sections[0]`: `key`=`trigger`, `title`=`きっかけ`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`memory`, `title`=`思い出すこと`, `type`=`text`, `required`=true
- `sections[2]`: `key`=`now`, `title`=`今だから思うこと`, `type`=`text`, `required`=false

### 5-4: 3人目のペルソナ「kochi（幸地 仁）」を登録

「ドキュメントを追加」→ ドキュメント ID: `kochi`

| フィールド名 | タイプ | 値 |
|-------------|--------|-----|
| `personaId` | string | `kochi` |
| `name` | string | `幸地 仁` |
| `nameReading` | string | `こうち じん` |
| `age` | number | `35` |
| `occupation` | string | `フリーランス・トラベルライター` |
| `personality` | string | `好奇心旺盛で行動力抜群。少しおっちょこちょいで、旅先でトラブルに巻き込まれやすいが、本人はそれを楽しんでいる。人懐っこく、地元の人とすぐ仲良くなる。沖縄出身で、時々うちなーぐちが混ざる。` |
| `background` | string | `沖縄・那覇出身。大学卒業後に出版社勤務を経て、30歳でフリーに。定住先を持たず、ゲストハウスやマンスリーマンションを転々としながら日本各地を取材旅行。ローカル鉄道とB級グルメと銭湯が三大テーマ。実家には月1で電話する親孝行者。` |
| `blogTitle` | string | `珍道中BLOG` |
| `imageHint` | string | `A travel scene somewhere in Japan: local trains, guesthouses, street food stalls, unexpected encounters. Emphasize adventure and curiosity.` |
| `createdAt` | timestamp | （現在の日時） |
| `updatedAt` | timestamp | （現在の日時） |

#### writingRules（array）

- `0`: `一人称は「俺」`
- `1`: `です・ます調は使わない（口語的な「だ・である調」）`
- `2`: `絵文字は使わない`
- `3`: `感嘆符「！」をよく使う`
- `4`: `食レポが得意で味の表現が独特`
- `5`: `地元の人との会話をよく挿入する`
- `6`: `沖縄方言が時々混ざる（「なんくるないさ」「だからよ〜」等）`
- `7`: `具体的な地名を出してOK（旅先として自然）`

#### formats（array of map）

**formats[0] — 日常日記:**
`formatId`=`kochi_daily`, `name`=`日常日記`, `weight`=`2`
- `sections[0]`: `key`=`intro`, `title`=`今日のこと`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`body`, `title`=（空文字列）, `type`=`text`, `required`=true
- `sections[2]`: `key`=`reflection`, `title`=`思ったこと`, `type`=`text`, `required`=false

**formats[1] — 旅レポ:**
`formatId`=`kochi_travel`, `name`=`旅レポ`, `weight`=`3`
- `sections[0]`: `key`=`place`, `title`=`今いるところ`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`experience`, `title`=`体験したこと`, `type`=`text`, `required`=true
- `sections[2]`: `key`=`tips`, `title`=`旅のメモ`, `type`=`bullets`, `required`=false

**formats[2] — 珍道中エピソード:**
`formatId`=`kochi_incident`, `name`=`珍道中エピソード`, `weight`=`2`
- `sections[0]`: `key`=`situation`, `title`=`何が起きたか`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`reaction`, `title`=`どうなったか`, `type`=`text`, `required`=true
- `sections[2]`: `key`=`lesson`, `title`=`教訓`, `type`=`text`, `required`=false

**formats[3] — B級グルメ探訪:**
`formatId`=`kochi_gourmet`, `name`=`B級グルメ探訪`, `weight`=`2`
- `sections[0]`: `key`=`shop`, `title`=`今日の一軒`, `type`=`text`, `required`=true
- `sections[1]`: `key`=`food`, `title`=`食べたもの`, `type`=`text`, `required`=true
- `sections[2]`: `key`=`rating`, `title`=`幸地メモ`, `type`=`bullets`, `required`=false

### 5-5: 登録確認

3ドキュメント（`ai`, `uno`, `kochi`）が personas コレクションに表示されていればOK。
デプロイ済みサイトの `/admin/personas` にアクセスして、3人のペルソナが表示されることを確認する。

> **補足: もっと簡単な方法**
>
> 上記の手動登録は項目が多く手間がかかる。
> 代わりに、管理画面にログインできた後であれば、
> ブラウザの開発者ツール（F12 → Console）から以下を実行するだけで3人分を一括投入できる:
>
> ```js
> const token = await (await fetch('/api/v1/auth/check', {credentials:'include'})).json().then(r => document.cookie.match(/token=([^;]+)/)?.[1]) // もしcookie方式でない場合は別途取得
> // Firebase Auth からトークン取得が必要な場合:
> // Chromeの開発者ツール → Application → IndexedDB → firebaseLocalStorage でトークンを探す
>
> const res = await fetch('/api/admin/seed', { method: 'POST' });
> console.log(await res.json());
> ```
>
> ※ 認証方式により実行方法が異なる。手動登録が確実。

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

---

## 付録: カスタムドメインの設定

### A-1: ドメインの取得

好みのレジストラでドメインを購入する。主な選択肢:

| レジストラ | 特徴 | `.com` 年額目安 |
|-----------|------|----------------|
| **Cloudflare Registrar** | 原価販売で最安。DNS管理もセット | 約 $10 |
| **Google Domains → Squarespace** | Google Domains から移管済み。UIがシンプル | 約 $12 |
| **お名前.com** | 日本語対応。初年度安いが更新料に注意 | 約 ¥1,500（初年度） |
| **Namecheap** | 海外では定番。Whois Privacy 無料 | 約 $9 |

> 迷ったら **Cloudflare Registrar** を推奨。
> 原価で更新でき、DNS設定もCloudflareダッシュボード内で完結する。

#### Cloudflare でのドメイン購入手順

1. https://dash.cloudflare.com にアクセス（アカウントがなければ Sign Up）
2. 左メニュー「Domain Registration」→「Register Domains」
3. 欲しいドメイン名を検索（例: `sosaku-nikki.com`）
4. 空いていれば「Purchase」をクリック
5. 登録者情報を入力（住所・名前など。Whois Privacy は自動で有効）
6. 支払い情報を入力 → 「Complete purchase」
7. 購入完了後、Cloudflare の DNS 管理画面にドメインが表示される

### A-2: Vercel にカスタムドメインを追加

1. Vercel ダッシュボード → 対象プロジェクト → 「Settings」タブ
2. 左メニュー「Domains」をクリック
3. 入力欄に取得したドメインを入力（例: `sosaku-nikki.com`）→「Add」
4. Vercel が推奨する設定が表示される:

   ```
   推奨構成:
     sosaku-nikki.com       → Aレコードまたはリダイレクト
     www.sosaku-nikki.com   → CNAMEレコード
   ```

5. 通常は以下の2パターンのどちらかが表示される:
   - **apex ドメイン（`sosaku-nikki.com`）を使う場合** → A レコード設定
   - **www 付き（`www.sosaku-nikki.com`）を使う場合** → CNAME 設定

> **apex ドメイン（www なし）を推奨**。Vercel が自動で `www` → apex のリダイレクトも設定してくれる。

### A-3: DNS レコードの設定

Vercel が指示する DNS レコードをレジストラ側で設定する。

#### Cloudflare の場合

1. Cloudflare ダッシュボード → 対象ドメイン → 「DNS」→「Records」
2. 以下のレコードを追加:

**apex ドメイン（`sosaku-nikki.com`）:**

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `76.76.21.21` | **DNS only**（プロキシOFF） |

**www サブドメイン:**

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `www` | `cname.vercel-dns.com` | **DNS only**（プロキシOFF） |

> **重要**: Cloudflare のプロキシ（オレンジ雲）は **必ず OFF（DNS only / グレー雲）** にする。
> Vercel は自前で SSL を発行するため、Cloudflare のプロキシが有効だと SSL 競合が起きる。

#### お名前.com / 他のレジストラの場合

レジストラの DNS 管理画面で同様のレコードを設定する。画面 UI は異なるが設定内容は同じ:
- A レコード: `@` → `76.76.21.21`
- CNAME レコード: `www` → `cname.vercel-dns.com`

### A-4: SSL 証明書の自動発行を確認

1. DNS 設定後、Vercel ダッシュボード → Settings → Domains に戻る
2. ドメインの横のステータスが以下のように変わるのを待つ:
   - **「Invalid Configuration」** → DNS 反映待ち（最大48時間、通常は数分〜数時間）
   - **「Valid Configuration」** → DNS 反映完了
3. DNS が反映されると Vercel が自動で **Let's Encrypt の SSL 証明書** を発行する
4. 最終的にステータスが **チェックマーク（緑）** になれば完了

> DNS 反映には時間がかかる場合がある。設定直後に「Invalid」でも焦らず待つ。

### A-5: アプリ側の設定更新

ドメインが有効になったら、以下の3箇所を更新する。

#### 1. Vercel 環境変数

| 変数名 | 新しい値 |
|--------|---------|
| `NEXT_PUBLIC_BASE_URL` | `https://sosaku-nikki.com`（取得したドメインに置き換え） |

設定変更後、Vercel ダッシュボードから **Redeploy** する（Settings → Deployments → 最新の「...」→ Redeploy）。

#### 2. Firebase Auth の承認済みドメイン

1. Firebase Console → Authentication → Settings → Authorized domains
2. 「ドメインを追加」で カスタムドメインを追加（例: `sosaku-nikki.com`）

> これを忘れると、カスタムドメインからの Google ログインが `auth/unauthorized-domain` エラーになる。

#### 3. Firebase Auth のリダイレクト URI（必要に応じて）

1. Google Cloud Console（https://console.cloud.google.com）にアクセス
2. 対象プロジェクトを選択
3. 左メニュー「API とサービス」→「認証情報」
4. OAuth 2.0 クライアント ID → Web client をクリック
5. 「承認済みのリダイレクト URI」に以下を追加:
   - `https://sosaku-nikki.com/__/auth/handler`

> Firebase Auth がリダイレクト方式の場合に必要。ポップアップ方式のみなら不要な場合もあるが、念のため追加しておくと安全。

### A-6: 確認チェックリスト

- [ ] `https://sosaku-nikki.com` にアクセスしてサイトが表示される
- [ ] `https://www.sosaku-nikki.com` が apex ドメインにリダイレクトされる
- [ ] ブラウザのアドレスバーに鍵マーク（SSL有効）が表示される
- [ ] `/admin/login` で Google ログインが成功する
- [ ] `/sitemap.xml` 内の URL がカスタムドメインになっている
- [ ] OGP 確認ツール（https://ogp.me/ 等）で `og:url` がカスタムドメインになっている

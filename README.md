# GitCord

GitHub の issue アサインを Discord で通知し、スラッシュコマンドで自分宛の open issue を一覧できるシンプルなサーバーレス Bot です。フォークしてそのまま Vercel へデプロイすれば、チームの Discord に統合できます。

- `/api/discord`: Discord Interaction エンドポイント。`/my-issues` コマンドで自分にアサインされた open issue を取得。
- `/api/githubWebhook`: GitHub Webhook 受信エンドポイント。`issues` の `assigned` イベントを、Discord Webhook へ通知。

## 必要なもの

- Node.js 18+ / npm
- Discord Application（Interactions と Webhook 用）
- GitHub の Personal Access Token（`public_repo` 権限で十分）
- Discord Webhook URL（通知投稿先）
- `config/users.json`（Discord ID と GitHub ログインの対応表）

## 環境変数

Vercel/ローカルのどちらでも以下を設定します。

- `DISCORD_PUBLIC_KEY`: Discord Application の「Public Key」
- `DISCORD_WEBHOOK_URL`: 通知を送る Discord Webhook URL
- `GITHUB_TOKEN`: GitHub API 用の PAT
- `GITHUB_WEBHOOK_SECRET`: GitHub Webhook のシークレット
- `GITHUB_REPO` (任意): `/my-issues` の結果を特定リポジトリ（`owner/repo` 形式）に絞りたい場合に指定

## ユーザー対応表

`USERS_JSON` 環境変数で渡すか、`config/users.json`（フォーク先にコミットしても OK）で Discord ユーザー ID と GitHub ログイン名を紐付けます。形式はどちらも同じです。`config/users.example.json` をコピーして編集できます。

```json
{
  "users": [
    {
      "discordId": "222222222222222222",
      "githubLogin": "another-user"
    }
  ]
}
```

例: 環境変数に渡す場合
`USERS_JSON='{"users":[{"discordId":"222222222222222222","githubLogin":"another-user"}]}'`

## デプロイ手順（フォークから Vercel まで）

1. このリポジトリをフォークする。
2. ユーザー対応表を準備する
   - 環境変数で管理する場合は後述の `USERS_JSON` に設定。
   - ファイル管理したい場合は `config/users.json` を作成しコミット。
3. Vercel で「Import Project」を選び、フォーク先リポジトリを選択。
4. **Environment Variables** に前述の変数（`USERS_JSON` を含め必要なもの）を追加してデプロイ。
5. デプロイ後の URL を控え、Discord/GitHub 側の Webhook 設定で使う。

## Discord 設定

1. Discord Developer Portal で Application を作成。
2. **Interactions Endpoint URL** に `https://<your-vercel-domain>/api/discord` を設定。
3. Public Key を環境変数 `DISCORD_PUBLIC_KEY` として Vercel に登録。
4. スラッシュコマンドを登録
   - Name: `my-issues`
   - Description: Show assigned GitHub issues
   - Type: Chat Input (標準)
     Application Commands の登録は Discord Portal で GUI から設定できます。
5. Bot をサーバーに追加（必要なスコープ: `applications.commands`）。

## GitHub Webhook 設定

1. 通知したいリポジトリ（または Org）で **Settings > Webhooks** を開く。
2. **Payload URL** に `https://<your-vercel-domain>/api/githubWebhook` を設定。
3. **Content type** は `application/json`。
4. **Secret** に `GITHUB_WEBHOOK_SECRET` と同じ文字列を設定。
5. **Let me select individual events** から `Issues` を選択して保存。

## 使い方

- Discord で `/my-issues` を実行すると、実行ユーザーの Discord ID と `USERS_JSON` または `config/users.json` で紐付けられた GitHub アカウントにアサインされた open issue を最大 10 件返します。
- GitHub の issue が誰か（紐付け済みの GitHub ログイン）に `assigned` されると、`DISCORD_WEBHOOK_URL` へ通知します。

## ローカル開発

```bash
npm install
npm run build
npm start
```

- `npm start` は `dist/api/discord.js` を起動します（`npm run build` が必要）。
- 開発中に Interaction の署名検証が必要な場合、`ngrok` などで `api/discord` を公開し Discord に URL を設定してください。
- `USERS_JSON` を使う場合は `export USERS_JSON='{"users":[...]}'` のように設定してください。
- `npm start` は `dist/api/discord.js` を起動します。TypeScript を直接動かす場合は `ts-node` を利用してください。

## トラブルシュート

- `/my-issues` が失敗する: `GITHUB_TOKEN` が不足していないか、PAT に `public_repo` 権限があるか確認。
- 何も通知されない: `USERS_JSON` / `config/users.json` に対象の GitHub ログインが含まれているか、Webhook Secret が一致しているか確認。
- 署名エラー: Discord/GitHub 双方で設定した URL と鍵/シークレットが一致しているか確認。

# GitCord

GitHub の issue アサインを Discord で通知し、スラッシュコマンドで自分宛の open issue とレビュー依頼を一覧できるシンプルな Bot です。Vercel Functions と通常の Node.js HTTP サーバーのどちらでも動作します。

- `/api/discord`: Discord Interaction エンドポイント。`/my-issues` と `/my-reviews` を処理。
- `/api/githubWebhook`: GitHub Webhook 受信エンドポイント。`issues` の `assigned` イベントを、Discord Webhook へ通知。

現在は1デプロイにつき1つのDiscord Application、通知先、GitHub設定を扱う単一チーム向け構成です。設計の詳細と意思決定は[docs/architecture.md](./docs/architecture.md)を参照してください。

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

## Vercelへのデプロイ手順

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
4. `.env` または環境変数へ `DISCORD_APPLICATION_ID`、`DISCORD_GUILD_ID`、`DISCORD_BOT_TOKEN` を設定し、`npm run register:discord-commands` でスラッシュコマンドを登録。
5. Bot をサーバーに追加（必要なスコープ: `applications.commands`）。

## GitHub Webhook 設定

1. 通知したいリポジトリ（または Org）で **Settings > Webhooks** を開く。
2. **Payload URL** に `https://<your-vercel-domain>/api/githubWebhook` を設定。
3. **Content type** は `application/json`。
4. **Secret** に `GITHUB_WEBHOOK_SECRET` と同じ文字列を設定。
5. **Let me select individual events** から `Issues` を選択して保存。

## 使い方

- Discord で `/my-issues` を実行すると、実行ユーザーの Discord ID と `USERS_JSON` または `config/users.json` で紐付けられた GitHub アカウントにアサインされた open issue を最大 100 件返します。
- Discord で `/my-reviews` を実行すると、同じGitHubアカウントへレビュー依頼されている open PR を最大 50 件返します。
- GitHub の issue が誰か（紐付け済みの GitHub ログイン）に `assigned` されると、`DISCORD_WEBHOOK_URL` へ通知します。

## ローカル開発

```bash
npm install
npm run dev
```

既定では `http://localhost:3000` で起動し、Vercelと同じエンドポイントを公開します。

- Discord Interaction: `http://localhost:3000/api/discord`
- GitHub Webhook: `http://localhost:3000/api/githubWebhook`

DiscordとGitHubからローカル環境へ接続するには、`ngrok`などでHTTPサーバーを公開してください。待ち受け先は`HOST`、ポートは`PORT`で変更できます。

本番相当の起動は次のとおりです。

```bash
npm run build
npm start
```

- `npm start` はコンパイル済みのNode.js HTTPサーバーを起動します（`npm run build` が必要）。
- `USERS_JSON` を使う場合は `export USERS_JSON='{"users":[...]}'` のように設定してください。

## トラブルシュート

- `/my-issues` が失敗する: `GITHUB_TOKEN` が不足していないか、PAT に `public_repo` 権限があるか確認。
- 何も通知されない: `USERS_JSON` / `config/users.json` に対象の GitHub ログインが含まれているか、Webhook Secret が一致しているか確認。
- 署名エラー: Discord/GitHub 双方で設定した URL と鍵/シークレットが一致しているか確認。

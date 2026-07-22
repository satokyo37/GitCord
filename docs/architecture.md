# アーキテクチャ概要

GitCordは、GitHubとDiscordから受け取るHTTPリクエストを、Vercelと通常のNode.jsサーバーのどちらでも処理できる構成にします。

## 現在の前提

- 1デプロイにつき1つのDiscord Applicationと通知先を扱う
- GitHubの認証には1つのPersonal Access Tokenを使う
- DiscordユーザーIDとGitHubログイン名の対応は、`USERS_JSON`または`config/users.json`から読み込む
- DB、管理画面、複数Discordサーバー対応はまだ含めない
- Discord Gatewayへの常時接続は使わず、Discord InteractionとGitHub WebhookをHTTPで受信する

## 責務

- `api/`: Vercel Functions用の薄いアダプター
- `src/server.ts`: 通常のNode.js HTTPサーバー
- `src/http/`: 配置先に依存しないHTTP処理、署名検証、レスポンス生成
- `src/core/`: DiscordコマンドとGitHubイベントのユースケース
- `src/github/`: GitHub APIクライアント
- `src/notifiers/`: Discord Webhookへの通知
- `src/config/`: DiscordユーザーとGitHubユーザーの対応解決

## リクエストの流れ

```text
Vercel Function ─┐
                 ├─> src/http ─> src/core ─> GitHub API / Discord Webhook
Node.js Server ──┘
```

VercelとNode.jsは、受信したリクエストを共通の`HttpRequest`へ変換し、共通処理から返された`HttpResponse`を各実行環境のレスポンスへ変換します。署名検証には変換前の生ボディが必要なため、どちらの入口も`Buffer`として本文を読み取ります。

## 配置形態

### Vercel

- `/api/discord`: Discord Interaction
- `/api/githubWebhook`: GitHub Webhook
- `api/`はVercelのRequest/Response型を共通処理へ変換するだけに留める

### 通常のNode.js

- `npm run build && npm start`で`src/server.ts`のコンパイル結果を起動する
- `HOST`の既定値は`0.0.0.0`
- `PORT`の既定値は`3000`
- パスはVercelと同じ`/api/discord`、`/api/githubWebhook`を使う

## 今後の変更候補

- Node.js版をコンテナへ配置するためのDockerfileとCompose設定
- Discordサーバー、GitHubリポジトリ、通知先、ユーザー対応のDB管理
- 複数チーム対応
- GitHub App認証
- DiscordコマンドまたはWeb管理画面による設定

これらは現在の実装範囲には含めず、採用時に個別の意思決定として記録します。

## 意思決定記録

採用した設計と理由は[`docs/decisions`](./decisions/README.md)に記録します。実装を変える判断をした場合は、コードと同時に該当する記録を追加または更新します。

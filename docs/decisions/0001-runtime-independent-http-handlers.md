# 0001: HTTP処理を配置先から分離する

- 状態: Accepted
- 決定日: 2026-07-23

## 背景

GitCordはVercel Functions向けに作られており、Discord InteractionとGitHub Webhookの入口が`VercelRequest`、`VercelResponse`へ直接依存していました。`npm start`もVercel用ハンドラーを直接読み込むだけで、通常のNode.js HTTPサーバーとしては起動できませんでした。

今後は、現在の単一チーム向け機能を維持しながら、Vercelと自宅サーバーの両方へ配置できる構成を目指します。複数チーム化やDB導入まで同時に行うと変更範囲が大きくなるため、最初に実行環境への依存だけを分離する必要があります。

## 決定

- Discord InteractionとGitHub Webhookの署名検証・解析・応答生成を`src/http/`の共通処理へ移す
- 共通処理はVercelやNode.jsのRequest/Response型を受け取らず、GitCord独自の`HttpRequest`と`HttpResponse`を使う
- Vercel Functionsは、VercelのRequest/Responseと共通型を変換する薄いアダプターとして維持する
- 通常のNode.js HTTPサーバーを`src/server.ts`に追加し、Vercelと同じURLパスを公開する
- DiscordとGitHubの署名検証に必要な生ボディを`Buffer`のまま共通処理へ渡す
- この段階では単一チーム設定を維持し、DBや複数チーム対応を含めない

## 採用理由

- 既存のVercel配置を維持したままNode.jsで起動できる
- 署名検証やコマンド分岐を配置先ごとに重複させずに済む
- デプロイ非依存化と、将来のマルチテナント化を別々に検証できる
- Node.js版の動作確認後にDocker対応を小さな変更として追加できる

## 検討した選択肢

### Vercel FunctionsをそのままNode.jsから呼び出す

採用しません。VercelのRequest/Response型を再現する必要があり、Node.js版もVercel固有仕様へ依存し続けるためです。

### ExpressなどのWebフレームワークへ統一する

現時点では採用しません。必要なエンドポイントは2つだけで、Node.js標準の`node:http`で十分です。ルーティングやミドルウェアが増えた時点で再検討します。

### 複数チーム化とDB導入も同時に行う

採用しません。設定モデル、認証、データ移行まで同時に変わり、現行機能を維持できているか判断しにくくなるためです。

## 結果

- `api/`と`src/server.ts`はHTTP実行環境の違いだけを担当する
- GitCordのHTTP処理は`src/http/`で共有される
- Node.js版でもVercelと同じDiscord/GitHub側のURL設定を利用できる
- 現在の環境変数とユーザー対応表は引き続き1組だけであり、複数チーム対応は別の意思決定として残る

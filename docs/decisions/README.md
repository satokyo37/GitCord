# 意思決定記録

GitCordの設計判断を、決定時の背景、採用内容、結果とともに残します。

## 状態

- `Proposed`: 検討中で、まだ実装の前提にしない
- `Accepted`: 採用済みで、現在の実装の前提
- `Superseded`: 後の意思決定によって置き換えられた
- `Rejected`: 検討したが採用しなかった

## 一覧

- [0001: HTTP処理を配置先から分離する](./0001-runtime-independent-http-handlers.md) — Accepted

新しい判断は連番のMarkdownファイルとして追加します。過去の記録は削除せず、置き換えた場合は新旧双方に参照を残します。

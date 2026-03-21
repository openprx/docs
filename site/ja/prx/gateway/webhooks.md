---
title: Webhook
description: PRX イベントと統合のためのアウトバウンド Webhook 通知
---

# Webhook

PRX はエージェントイベントを外部サービスに通知するためのアウトバウンド Webhook をサポートします。Webhook により CI/CD システム、監視ツール、カスタムワークフローとの統合が可能になります。

## 概要

設定されると、PRX は特定のイベントが発生した際に登録された Webhook URL に HTTP POST リクエストを送信します:

- **session.created** -- 新しいエージェントセッションが開始された
- **session.completed** -- エージェントセッションが完了した
- **tool.executed** -- ツールが呼び出され完了した
- **error.occurred** -- エラーが発生した

## 設定

```toml
[[gateway.webhooks]]
url = "https://example.com/webhook"
secret = "your-webhook-secret"
events = ["session.completed", "error.occurred"]
timeout_secs = 10
max_retries = 3
```

## ペイロードフォーマット

Webhook ペイロードは標準フィールドを持つ JSON オブジェクトです:

```json
{
  "event": "session.completed",
  "timestamp": "2026-03-21T10:00:00Z",
  "data": { }
}
```

## 署名検証

各 Webhook リクエストには、設定されたシークレットを使用してペイロードの HMAC-SHA256 署名を含む `X-PRX-Signature` ヘッダーが含まれます。

## 関連ページ

- [ゲートウェイ概要](./)
- [HTTP API](./http-api)

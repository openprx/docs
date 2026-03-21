---
title: HTTP API
description: PRX ゲートウェイの RESTful HTTP API リファレンス
---

# HTTP API

PRX ゲートウェイは、エージェントセッションの管理、メッセージの送信、システムステータスのクエリのための RESTful HTTP API を公開します。

## ベース URL

デフォルトでは、API は `http://127.0.0.1:3120/api/v1` で利用可能です。

## エンドポイント

### セッション

| メソッド | パス | 説明 |
|--------|------|-------------|
| `POST` | `/sessions` | 新しいエージェントセッションを作成 |
| `GET` | `/sessions` | アクティブなセッション一覧を取得 |
| `GET` | `/sessions/:id` | セッションの詳細を取得 |
| `DELETE` | `/sessions/:id` | セッションを終了 |

### メッセージ

| メソッド | パス | 説明 |
|--------|------|-------------|
| `POST` | `/sessions/:id/messages` | エージェントにメッセージを送信 |
| `GET` | `/sessions/:id/messages` | メッセージ履歴を取得 |

### システム

| メソッド | パス | 説明 |
|--------|------|-------------|
| `GET` | `/health` | ヘルスチェック |
| `GET` | `/info` | システム情報 |
| `GET` | `/metrics` | Prometheus メトリクス |

## 認証

API リクエストにはベアラートークンが必要です:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/sessions
```

## 関連ページ

- [ゲートウェイ概要](./)
- [WebSocket](./websocket)
- [ミドルウェア](./middleware)

---
title: API リファレンス
description: PRX ゲートウェイの完全な REST API リファレンス -- セッション、チャネル、フック、MCP、プラグイン、スキル、ステータス、設定、ログ
---

# API リファレンス

このページでは、PRX ゲートウェイが公開するすべての REST API エンドポイントを記述します。API は Axum で構築されており、リクエストとレスポンスのボディに JSON を使用します。すべてのエンドポイントは `/api/v1` のプレフィックスが付きます。

## ベース URL

```
http://127.0.0.1:3120/api/v1
```

ホストとポートは設定可能です:

```toml
[gateway]
host = "127.0.0.1"
port = 3120
```

## 認証

特に記載がない限り、すべての API エンドポイントにはベアラートークンが必要です。

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/status
```

トークンの生成:

```bash
prx auth token
```

## セッション

エージェントセッションの管理 -- 作成、一覧取得、詳細確認、終了。

### POST /api/v1/sessions

新しいエージェントセッションを作成します。

**リクエスト:**

```json
{
  "channel": "api",
  "user_id": "user_123",
  "metadata": {
    "source": "web-app"
  }
}
```

**レスポンス (201):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "metadata": {
    "source": "web-app"
  }
}
```

### GET /api/v1/sessions

アクティブなセッション一覧を取得します。

**クエリパラメータ:**

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|---------|-------------|
| `status` | `String` | `"active"` | ステータスでフィルタ: `"active"`、`"idle"`、`"terminated"` |
| `channel` | `String` | *すべて* | チャネル名でフィルタ |
| `limit` | `usize` | `50` | 返却する最大件数 |
| `offset` | `usize` | `0` | ページネーションオフセット |

**レスポンス (200):**

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "channel": "api",
      "user_id": "user_123",
      "status": "active",
      "created_at": "2026-03-21T10:00:00Z",
      "last_activity": "2026-03-21T10:15:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/v1/sessions/:id

特定のセッションの詳細情報を取得します。

**レスポンス (200):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "last_activity": "2026-03-21T10:15:00Z",
  "turn_count": 12,
  "token_usage": {
    "input": 4500,
    "output": 3200
  },
  "metadata": {
    "source": "web-app"
  }
}
```

### DELETE /api/v1/sessions/:id

セッションを終了します。

**レスポンス (204):** コンテンツなし。

## チャネル

メッセージングチャネル接続のクエリと管理。

### GET /api/v1/channels

すべての設定されたチャネルとその接続ステータスを一覧表示します。

**レスポンス (200):**

```json
{
  "channels": [
    {
      "name": "telegram",
      "status": "connected",
      "connected_at": "2026-03-21T08:00:00Z",
      "active_sessions": 3
    },
    {
      "name": "discord",
      "status": "disconnected",
      "error": "Invalid bot token"
    }
  ]
}
```

### POST /api/v1/channels/:name/restart

特定のチャネル接続を再起動します。

**レスポンス (200):**

```json
{
  "name": "telegram",
  "status": "reconnecting"
}
```

### GET /api/v1/channels/:name/health

特定のチャネルのヘルスチェック。

**レスポンス (200):**

```json
{
  "name": "telegram",
  "healthy": true,
  "latency_ms": 45,
  "last_message_at": "2026-03-21T10:14:55Z"
}
```

## フック

外部統合のための Webhook エンドポイントの管理。

### GET /api/v1/hooks

登録された Webhook を一覧表示します。

**レスポンス (200):**

```json
{
  "hooks": [
    {
      "id": "hook_001",
      "url": "https://example.com/webhook",
      "events": ["session.created", "session.terminated"],
      "active": true,
      "created_at": "2026-03-20T12:00:00Z"
    }
  ]
}
```

### POST /api/v1/hooks

新しい Webhook を登録します。

**リクエスト:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "secret": "whsec_xxxxxxxxxxx"
}
```

**レスポンス (201):**

```json
{
  "id": "hook_002",
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "active": true,
  "created_at": "2026-03-21T10:20:00Z"
}
```

### DELETE /api/v1/hooks/:id

Webhook を削除します。

**レスポンス (204):** コンテンツなし。

## MCP

Model Context Protocol サーバー接続の管理。

### GET /api/v1/mcp

接続済みの MCP サーバーを一覧表示します。

**レスポンス (200):**

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "status": "connected",
      "tools": ["read_file", "write_file", "list_directory"],
      "connected_at": "2026-03-21T08:00:00Z"
    }
  ]
}
```

### POST /api/v1/mcp/:name/reconnect

MCP サーバーに再接続します。

**レスポンス (200):**

```json
{
  "name": "filesystem",
  "status": "reconnecting"
}
```

## プラグイン

WASM プラグインの管理。

### GET /api/v1/plugins

インストール済みプラグインとそのステータスを一覧表示します。

**レスポンス (200):**

```json
{
  "plugins": [
    {
      "name": "weather",
      "version": "1.2.0",
      "status": "loaded",
      "capabilities": ["tool:get_weather", "tool:get_forecast"],
      "memory_usage_bytes": 2097152
    }
  ]
}
```

### POST /api/v1/plugins/:name/reload

プラグインをリロードします（アンロードして再ロード）。

**レスポンス (200):**

```json
{
  "name": "weather",
  "status": "loaded",
  "version": "1.2.0"
}
```

### POST /api/v1/plugins/:name/disable

プラグインをアンロードせずに無効化します。

**レスポンス (200):**

```json
{
  "name": "weather",
  "status": "disabled"
}
```

## スキル

登録されたエージェントスキルのクエリ。

### GET /api/v1/skills

利用可能なすべてのスキルを一覧表示します。

**レスポンス (200):**

```json
{
  "skills": [
    {
      "name": "code_review",
      "source": "builtin",
      "description": "Review code changes and provide feedback",
      "triggers": ["/review", "review this"]
    },
    {
      "name": "summarize",
      "source": "plugin:productivity",
      "description": "Summarize long text or conversations",
      "triggers": ["/summarize", "tldr"]
    }
  ]
}
```

## ステータス

システムステータスとヘルス情報。

### GET /api/v1/status

システム全体のステータスを取得します。

**レスポンス (200):**

```json
{
  "status": "healthy",
  "version": "0.12.0",
  "uptime_secs": 86400,
  "active_sessions": 5,
  "channels": {
    "connected": 3,
    "total": 4
  },
  "plugins": {
    "loaded": 2,
    "total": 2
  },
  "memory": {
    "backend": "sqlite",
    "entries": 1542
  },
  "provider": {
    "name": "anthropic",
    "model": "claude-sonnet-4-20250514"
  }
}
```

### GET /api/v1/status/health

軽量ヘルスチェック（ロードバランサーのプローブに適しています）。

**レスポンス (200):**

```json
{
  "healthy": true
}
```

## 設定

ランタイム設定の読み取りと更新。

### GET /api/v1/config

現在のランタイム設定を取得します（シークレットは隠蔽されます）。

**レスポンス (200):**

```json
{
  "agent": {
    "max_turns": 50,
    "max_tool_calls_per_turn": 10,
    "session_timeout_secs": 3600
  },
  "memory": {
    "backend": "sqlite"
  },
  "channels_config": {
    "telegram": {
      "bot_token": "***REDACTED***",
      "allowed_users": ["123456789"]
    }
  }
}
```

### PATCH /api/v1/config

ランタイムで設定値を更新します。変更はホットリロードで適用されます。

**リクエスト:**

```json
{
  "agent.max_turns": 100,
  "memory.top_k": 15
}
```

**レスポンス (200):**

```json
{
  "updated": ["agent.max_turns", "memory.top_k"],
  "reload_required": false
}
```

一部の設定変更はホットリロードできず、完全な再起動が必要です。レスポンスの `"reload_required": true` でこれが示されます。

## ログ

エージェントログと診断のクエリ。

### GET /api/v1/logs

最近のログエントリのストリームまたはクエリ。

**クエリパラメータ:**

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|---------|-------------|
| `level` | `String` | `"info"` | 最小ログレベル: `"trace"`、`"debug"`、`"info"`、`"warn"`、`"error"` |
| `module` | `String` | *すべて* | モジュール名でフィルタ（例: `"agent"`、`"channel::telegram"`） |
| `since` | `String` | *1時間前* | ISO 8601 タイムスタンプまたは期間（例: `"1h"`、`"30m"`） |
| `limit` | `usize` | `100` | 返却する最大エントリ数 |
| `stream` | `bool` | `false` | true の場合、Server-Sent Events ストリームを返却 |

**レスポンス (200):**

```json
{
  "entries": [
    {
      "timestamp": "2026-03-21T10:15:30.123Z",
      "level": "info",
      "module": "agent::loop",
      "message": "Tool call completed: shell (45ms)",
      "session_id": "sess_abc123"
    }
  ],
  "total": 1
}
```

### GET /api/v1/logs/stream

リアルタイムログテーリング用の Server-Sent Events ストリーム。

```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/logs/stream?level=info
```

## エラーレスポンス

すべてのエンドポイントは統一されたフォーマットでエラーを返します:

```json
{
  "error": {
    "code": "not_found",
    "message": "Session sess_xyz not found",
    "details": null
  }
}
```

| HTTP ステータス | エラーコード | 説明 |
|-------------|-----------|-------------|
| 400 | `bad_request` | 不正なリクエストパラメータまたはボディ |
| 401 | `unauthorized` | ベアラートークンが未設定または無効 |
| 403 | `forbidden` | トークンに必要な権限がない |
| 404 | `not_found` | リソースが存在しない |
| 409 | `conflict` | リソースの状態の競合（例: セッションが既に終了） |
| 429 | `rate_limited` | リクエスト過多。指定された遅延後にリトライ |
| 500 | `internal_error` | 予期しないサーバーエラー |

## レート制限

API はトークンごとにレート制限を適用します:

| エンドポイントグループ | 制限 |
|---------------|-------|
| セッション（書き込み） | 10 リクエスト/秒 |
| セッション（読み取り） | 50 リクエスト/秒 |
| 設定（書き込み） | 5 リクエスト/秒 |
| その他のエンドポイント | 30 リクエスト/秒 |

レート制限ヘッダーはすべてのレスポンスに含まれます:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1711015230
```

## 関連ページ

- [ゲートウェイ概要](./)
- [HTTP API](./http-api) -- HTTP API レイヤーの概要
- [WebSocket](./websocket) -- リアルタイム WebSocket API
- [Webhook](./webhooks) -- アウトバウンド Webhook 設定
- [ミドルウェア](./middleware) -- リクエスト/レスポンスミドルウェアパイプライン

---
title: prx gateway
description: チャネルや cron なしでスタンドアロン HTTP/WebSocket ゲートウェイサーバーを起動します。
---

# prx gateway

HTTP/WebSocket ゲートウェイサーバーをスタンドアロンプロセスとして起動します。[`prx daemon`](./daemon) とは異なり、このコマンドはゲートウェイのみを起動します -- チャネル、cron スケジューラ、進化エンジンは含まれません。

これは、完全なデーモンなしで PRX API を公開したい場合や、チャネルとスケジューリングを別プロセスとして実行する場合に便利です。

## 使い方

```bash
prx gateway [OPTIONS]
```

## オプション

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 設定ファイルのパス |
| `--port` | `-p` | `3120` | リッスンポート |
| `--host` | `-H` | `127.0.0.1` | バインドアドレス |
| `--log-level` | `-l` | `info` | ログの詳細度: `trace`, `debug`, `info`, `warn`, `error` |
| `--cors-origin` | | `*` | 許可する CORS オリジン（カンマ区切り） |
| `--tls-cert` | | | TLS 証明書ファイルのパス |
| `--tls-key` | | | TLS 秘密鍵ファイルのパス |

## エンドポイント

ゲートウェイは以下のエンドポイントグループを公開します：

| パス | メソッド | 説明 |
|------|--------|-------------|
| `/health` | GET | ヘルスチェック（`200 OK` を返す） |
| `/api/v1/chat` | POST | チャットメッセージの送信 |
| `/api/v1/chat/stream` | POST | チャットメッセージの送信（ストリーミング SSE） |
| `/api/v1/sessions` | GET, POST | セッション管理 |
| `/api/v1/sessions/:id` | GET, DELETE | 単一セッション操作 |
| `/api/v1/tools` | GET | 使用可能なツールの一覧 |
| `/api/v1/memory` | GET, POST | メモリ操作 |
| `/ws` | WS | リアルタイム通信用 WebSocket エンドポイント |
| `/webhooks/:channel` | POST | チャネル用受信 Webhook レシーバー |

完全な API ドキュメントについては、[ゲートウェイ HTTP API](/ja/prx/gateway/http-api) と [ゲートウェイ WebSocket](/ja/prx/gateway/websocket) を参照してください。

## 使用例

```bash
# デフォルトポートで起動
prx gateway

# すべてのインターフェースのポート 8080 にバインド
prx gateway --host 0.0.0.0 --port 8080

# TLS 付き
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# CORS を制限
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# デバッグログ
prx gateway --log-level debug
```

## リバースプロキシの背後で

本番環境では、TLS 終端とロードバランシングのためにゲートウェイをリバースプロキシ（Nginx、Caddy など）の背後に配置します：

```
# Caddy の例
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# Nginx の例
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## シグナル

| シグナル | 動作 |
|--------|----------|
| `SIGHUP` | 設定のリロード |
| `SIGTERM` | グレースフルシャットダウン（処理中のリクエストを完了） |

## 関連ドキュメント

- [prx daemon](./daemon) -- 完全なランタイム（ゲートウェイ + チャネル + cron + 進化）
- [ゲートウェイの概要](/ja/prx/gateway/) -- ゲートウェイアーキテクチャ
- [ゲートウェイ HTTP API](/ja/prx/gateway/http-api) -- REST API リファレンス
- [ゲートウェイ WebSocket](/ja/prx/gateway/websocket) -- WebSocket プロトコル

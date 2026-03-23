---
title: インストール
description: "OpenPR-WebhookをRustのソースからビルドし、設定してサービスとして実行。"
---

# インストール

## 前提条件

- Rustツールチェーン（エディション2024以降）
- Webhookイベントを送信できる実行中のOpenPRインスタンス

## ソースからビルド

リポジトリをクローンしてリリースモードでビルド：

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

バイナリは`target/release/openpr-webhook`に生成されます。

## 依存関係

OpenPR-Webhookは以下のコアライブラリで構築されています：

| クレート | 目的 |
|-------|---------|
| `axum` 0.8 | HTTPサーバーフレームワーク |
| `tokio` 1 | 非同期ランタイム |
| `reqwest` 0.12 | Webhook転送とコールバック用のHTTPクライアント |
| `hmac` + `sha2` | HMAC-SHA256署名検証 |
| `toml` 0.8 | 設定ファイルの解析 |
| `tokio-tungstenite` 0.28 | トンネルモード用WebSocketクライアント |
| `tracing` | 構造化ログ |

## 設定ファイル

`config.toml`ファイルを作成します。サービスは起動時にこのファイルを読み込みます。完全なスキーマは[設定リファレンス](../configuration/index.md)を参照してください。

最小設定例：

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "Notification Bot"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## 実行

```bash
# Default: loads config.toml from the current directory
./target/release/openpr-webhook

# Specify a custom config path
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## ログ

ログは`RUST_LOG`環境変数で制御されます。デフォルトレベルは`openpr_webhook=info`です。

```bash
# Debug logging
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# Trace-level logging (very verbose)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## ヘルスチェック

サービスはサーバーが実行中のときに`ok`を返す`GET /health`エンドポイントを公開します：

```bash
curl http://localhost:9000/health
# ok
```

## Systemdサービス（オプション）

Linux上のプロダクションデプロイメント向け：

```ini
[Unit]
Description=OpenPR Webhook Dispatcher
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## 次のステップ

- [クイックスタート](quickstart.md) -- 最初のエージェントをセットアップしてエンドツーエンドでテスト
- [設定リファレンス](../configuration/index.md) -- 完全なTOMLスキーマドキュメント

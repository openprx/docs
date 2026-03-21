---
title: ngrok 統合
description: 迅速な開発と Webhook テストのために ngrok を使用して PRX エージェントをインターネットに公開
---

# ngrok 統合

ngrok はローカル PRX インスタンスへのセキュアなイングレスを作成する人気のトンネリングサービスです。Webhook や外部統合を最速で開始する方法であり、単一のコマンドでローカルエージェントを指すパブリック HTTPS URL を取得できます。

## 概要

ngrok は以下の用途に最適です:

- **開発とテスト** -- アカウント設定なしで数秒でパブリック URL を取得
- **Webhook プロトタイピング** -- Telegram、Discord、GitHub、Slack 統合を素早くテスト
- **デモとプレゼンテーション** -- エージェントを紹介するための一時的なパブリック URL を共有
- **Cloudflare や Tailscale が利用できない環境**

本番デプロイメントには、より優れた信頼性、カスタムドメイン、ゼロトラストアクセス制御を提供する [Cloudflare トンネル](./cloudflare) または [Tailscale Funnel](./tailscale) を検討してください。

## 前提条件

1. PRX を実行するマシンに ngrok CLI がインストール済み
2. 認証トークン付きの ngrok アカウント（無料プランで十分）

### ngrok のインストール

```bash
# Debian / Ubuntu (via snap)
sudo snap install ngrok

# macOS
brew install ngrok

# Binary download (all platforms)
# https://ngrok.com/download

# Authenticate (one-time setup)
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

認証トークンは [ngrok ダッシュボード](https://dashboard.ngrok.com/get-started/your-authtoken) から取得できます。

## 設定

### 基本セットアップ

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
# Auth token. Can also be set via NGROK_AUTHTOKEN environment variable.
# If omitted, ngrok uses the token from its local config file.
authtoken = ""

# Region for the tunnel endpoint.
# Options: "us", "eu", "ap", "au", "sa", "jp", "in"
region = "us"
```

### カスタムドメイン（有料プラン）

ngrok の有料プランでは固定カスタムドメインをサポートします:

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Custom domain (requires ngrok paid plan)
domain = "agent.example.com"

# Alternatively, use a static ngrok subdomain (free on some plans)
# subdomain = "my-prx-agent"
```

### リザーブドドメイン

無料プランで安定した URL を使用するには、ngrok のリザーブドドメインを利用します:

```toml
[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Reserved domain assigned by ngrok (e.g., "example-agent.ngrok-free.app")
domain = "example-agent.ngrok-free.app"
```

## 設定リファレンス

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|---------|-------------|
| `authtoken` | string | -- | ngrok 認証トークン |
| `region` | string | `"us"` | トンネルリージョン: `"us"`、`"eu"`、`"ap"`、`"au"`、`"sa"`、`"jp"`、`"in"` |
| `domain` | string | -- | カスタムドメインまたはリザーブドドメイン（有料機能） |
| `subdomain` | string | -- | `ngrok-free.app` の固定サブドメイン |
| `ngrok_path` | string | `"ngrok"` | `ngrok` バイナリへのパス |
| `inspect` | boolean | `true` | ngrok インスペクションダッシュボードを有効化（localhost:4040） |
| `log_level` | string | `"info"` | ngrok ログレベル: `"debug"`、`"info"`、`"warn"`、`"error"` |
| `metadata` | string | -- | トンネルセッションに付加される任意のメタデータ文字列 |
| `basic_auth` | string | -- | HTTP ベーシック認証（`user:password` 形式） |
| `ip_restrictions` | list | `[]` | 許可する CIDR 範囲のリスト（例: `["203.0.113.0/24"]`） |
| `circuit_breaker` | float | -- | サーキットブレーカーをトリガーするエラー率閾値（0.0-1.0） |
| `compression` | boolean | `false` | レスポンス圧縮を有効化 |

## PRX による ngrok の管理

トンネル開始時、PRX は ngrok を子プロセスとしてスポーンします:

```bash
ngrok http 127.0.0.1:8080 \
  --authtoken=<token> \
  --region=us \
  --log=stdout \
  --log-format=json
```

その後、PRX は ngrok ローカル API（`http://127.0.0.1:4040/api/tunnels`）にクエリして、割り当てられたパブリック URL を取得します。この URL は保存され、Webhook 登録やチャネル設定に使用されます。

### URL の抽出

ngrok はポート 4040 でローカル API を公開します。PRX はタイムアウト付きでこのエンドポイントをポーリングします:

```
GET http://localhost:4040/api/tunnels
```

レスポンスにはパブリック URL が含まれます:

```json
{
  "tunnels": [
    {
      "public_url": "https://abc123.ngrok-free.app",
      "config": {
        "addr": "http://localhost:8080"
      }
    }
  ]
}
```

`startup_timeout_secs` 以内に API が利用できない場合、PRX は stdout からの URL パースにフォールバックします。

## 無料プランの制限

ngrok の無料プランにはいくつかの制限があります:

| 制限事項 | 無料プラン | PRX への影響 |
|------------|-----------|---------------|
| 同時トンネル数 | 1 | ngrok アカウントあたり 1 つの PRX インスタンスのみ |
| 1 分あたりの接続数 | 40 | 高トラフィックの Webhook がスロットリングされる可能性 |
| カスタムドメイン | 利用不可 | 再起動のたびに URL が変更 |
| IP 制限 | 利用不可 | ソース IP を制限できない |
| 帯域幅 | 制限あり | 大容量ファイル転送がスロットリングされる可能性 |
| インタースティシャルページ | 初回アクセス時に表示 | 一部の Webhook プロバイダーに干渉する可能性 |

インタースティシャルページ（ngrok のブラウザ警告ページ）は API/Webhook トラフィックには影響しません -- ブラウザからのリクエストにのみ表示されます。ただし、一部の Webhook プロバイダーはそれを含むレスポンスを拒否する場合があります。本番環境では有料プランまたは別のバックエンドを使用してください。

## ngrok インスペクションダッシュボード

`inspect = true`（デフォルト）の場合、ngrok は `http://localhost:4040` でローカル Web ダッシュボードを実行します。このダッシュボードは以下を提供します:

- **リクエストインスペクター** -- ヘッダー、ボディ、レスポンスを含むすべての受信リクエストを表示
- **リプレイ** -- デバッグのために任意のリクエストをリプレイ
- **トンネルステータス** -- 接続状態、リージョン、パブリック URL

これは開発中の Webhook 統合のデバッグに非常に有用です。

## セキュリティの考慮事項

- **認証トークンの保護** -- ngrok 認証トークンはアカウントへのトンネル作成アクセスを付与します。PRX シークレットマネージャーに保存するか、`NGROK_AUTHTOKEN` 環境変数で渡してください。
- **無料プランの URL は公開** -- URL を知っている人は誰でもエージェントに到達できます。アクセスを制限するには `basic_auth` または `ip_restrictions`（有料）を使用してください。
- **URL ローテーション** -- 無料プランの URL は再起動時に変更されます。Webhook プロバイダーが古い URL をキャッシュしている場合、イベントの配信に失敗します。安定した URL にはリザーブドドメインまたは別のバックエンドを使用してください。
- **TLS 終端** -- ngrok はエッジで TLS を終端します。ngrok とローカル PRX 間のトラフィックは ngrok のインフラを通過します。
- **データインスペクション** -- ngrok のインスペクションダッシュボードはリクエスト/レスポンスのボディを表示します。機密データが送信される場合は、本番環境で `inspect = false` で無効化してください。

## Webhook 統合パターン

開発時の一般的なパターン: ngrok で PRX を開始し、Webhook URL を登録してテスト:

```bash
# 1. PRX を開始（トンネルは自動的に開始）
prx start

# 2. PRX がパブリック URL をログに記録
# [INFO] Tunnel started: https://abc123.ngrok-free.app

# 3. サービスに Webhook URL を登録
# Telegram: https://abc123.ngrok-free.app/webhook/telegram
# GitHub:   https://abc123.ngrok-free.app/webhook/github

# 4. http://localhost:4040 でリクエストをインスペクト
```

## 他のバックエンドとの比較

| 機能 | ngrok | Cloudflare トンネル | Tailscale Funnel |
|---------|-------|-------------------|------------------|
| セットアップ時間 | 数秒 | 数分 | 数分 |
| カスタムドメイン | 有料 | 無料（ゾーン付き） | MagicDNS のみ |
| ゼロトラスト | なし | あり（Access） | あり（ACL） |
| 無料プラン | あり（制限付き） | あり | あり（個人） |
| インスペクションダッシュボード | あり | なし | なし |
| 本番環境対応 | 有料プラン | あり | あり |

## トラブルシューティング

| 症状 | 原因 | 解決策 |
|---------|-------|------------|
| 「authentication failed」 | 無効または未設定の認証トークン | `ngrok config add-authtoken <token>` を実行 |
| URL が検出されない | ngrok API が :4040 で応答しない | ポート 4040 が他のプロセスに使用されていないか確認 |
| 「tunnel session limit」 | 無料プランでは 1 トンネルのみ許可 | 他の ngrok セッションを停止するかアップグレード |
| Webhook が 502 を返す | PRX ゲートウェイがリッスンしていない | `local_addr` がゲートウェイと一致することを確認 |
| インタースティシャルページが表示される | 無料プランのブラウザ警告 | `--domain` を使用するか有料プランにアップグレード |
| ランダムな切断 | 無料プランの接続制限 | アップグレードするか Cloudflare/Tailscale に切り替え |

## 関連ページ

- [トンネル概要](./)
- [Cloudflare トンネル](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [セキュリティ概要](/ja/prx/security/)

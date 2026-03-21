---
title: Cloudflare トンネル
description: cloudflared を使用したゼロトラストイングレスのための PRX と Cloudflare Tunnel の統合
---

# Cloudflare トンネル

Cloudflare Tunnel（旧 Argo Tunnel）は、PRX インスタンスから Cloudflare のエッジネットワークへの暗号化されたアウトバウンド専用接続を作成します。パブリック IP、ファイアウォールポートの開放、ポートフォワーディングは不要です。Cloudflare が TLS を終端し、トンネルを通じてローカルエージェントにトラフィックをルーティングします。

## 概要

Cloudflare Tunnel は本番 PRX デプロイメントに推奨されるバックエンドです。以下の機能を提供します:

- **ゼロトラストアクセス** -- Cloudflare Access と統合して、エージェントに到達する前に ID 検証を要求
- **カスタムドメイン** -- 自動 HTTPS 証明書で独自ドメインを使用
- **DDoS 防御** -- トラフィックが Cloudflare のネットワークを通過し、オリジンを保護
- **高い信頼性** -- Cloudflare が冗長性のために複数のエッジ接続を維持
- **無料プラン** -- Cloudflare Tunnel は無料プランで利用可能

## 前提条件

1. Cloudflare アカウント（無料プランで十分）
2. PRX を実行するマシンに `cloudflared` CLI がインストール済み
3. Cloudflare アカウントにドメインが追加済み（名前付きトンネルの場合）

### cloudflared のインストール

```bash
# Debian / Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# macOS
brew install cloudflared

# Binary download (all platforms)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## 設定

### クイックトンネル（ドメイン不要）

最も簡単なセットアップは Cloudflare のクイックトンネルを使用し、ランダムな `*.trycloudflare.com` サブドメインが割り当てられます。`cloudflared` のインストール以外に Cloudflare アカウントの設定は不要です:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
# Quick tunnel mode: no token, no named tunnel.
# A random trycloudflare.com URL is assigned on each start.
mode = "quick"
```

クイックトンネルは開発やテストに最適です。URL は再起動のたびに変わるため、Webhook の登録をそれに応じて更新する必要があります。

### 名前付きトンネル（固定ドメイン）

本番環境では、安定したホスト名を持つ名前付きトンネルを使用します:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
mode = "named"

# The tunnel token obtained from `cloudflared tunnel create`.
# Can also be set via CLOUDFLARE_TUNNEL_TOKEN environment variable.
token = "eyJhIjoiNjY..."

# The public hostname that routes to this tunnel.
# Must be configured in the Cloudflare dashboard or via cloudflared CLI.
hostname = "agent.example.com"
```

### 名前付きトンネルの作成

```bash
# 1. Cloudflare アカウントで cloudflared を認証
cloudflared tunnel login

# 2. 名前付きトンネルを作成
cloudflared tunnel create prx-agent
# Output: Created tunnel prx-agent with id <TUNNEL_ID>

# 3. トンネルを指す DNS レコードを作成
cloudflared tunnel route dns prx-agent agent.example.com

# 4. トンネルトークンを取得（config.toml 用）
cloudflared tunnel token prx-agent
# Output: eyJhIjoiNjY...
```

## 設定リファレンス

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|---------|-------------|
| `mode` | string | `"quick"` | `"quick"` はランダム URL、`"named"` は固定ホスト名 |
| `token` | string | -- | 名前付きトンネルトークン（`mode = "named"` に必須） |
| `hostname` | string | -- | 名前付きトンネルのパブリックホスト名 |
| `cloudflared_path` | string | `"cloudflared"` | `cloudflared` バイナリへのパス |
| `protocol` | string | `"auto"` | トランスポートプロトコル: `"auto"`、`"quic"`、`"http2"` |
| `edge_ip_version` | string | `"auto"` | エッジ接続の IP バージョン: `"auto"`、`"4"`、`"6"` |
| `retries` | integer | `5` | 接続リトライ回数 |
| `grace_period_secs` | integer | `30` | アクティブ接続をシャットダウンする前の待機秒数 |
| `metrics_port` | integer | -- | 設定時、このポートで `cloudflared` メトリクスを公開 |
| `log_level` | string | `"info"` | `cloudflared` ログレベル: `"debug"`、`"info"`、`"warn"`、`"error"` |

## ゼロトラストアクセス

Cloudflare Access はトンネルの前に ID レイヤーを追加します。ユーザーは PRX インスタンスに到達する前に（SSO、メール OTP、またはサービストークンで）認証する必要があります。

### アクセスポリシーの設定

1. Cloudflare Zero Trust ダッシュボードに移動
2. トンネルのホスト名に対する Access アプリケーションを作成
3. 必要な ID 要件を持つ Access ポリシーを追加

```
Cloudflare Access Policy Example:
  Application: agent.example.com
  Rule: Allow
  Include:
    - Email ends with: @yourcompany.com
    - Service Token: prx-webhook-token
```

サービストークンは、対話型認証を実行できない自動 Webhook 送信者（GitHub、Slack）に便利です。Webhook プロバイダーのヘッダーにトークンを設定します:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

## ヘルスチェック

PRX は以下の方法で Cloudflare Tunnel のヘルスを監視します:

1. `cloudflared` 子プロセスが実行中であることを確認
2. パブリック URL に HTTP GET を送信し、2xx レスポンスを検証
3. `cloudflared` メトリクス（`metrics_port` が設定されている場合）を解析して接続状態を確認

トンネルが不健全になった場合、PRX は警告をログに記録し、`cloudflared` の再起動を試みます。再起動は指数バックオフ戦略に従います: 5秒、10秒、20秒、40秒、最大5分の間隔で試行されます。

## ログとデバッグ

`cloudflared` の stdout と stderr は `TunnelProcess` によってキャプチャされ、`DEBUG` レベルで PRX ログに書き込まれます。詳細度を上げるには:

```toml
[tunnel.cloudflare]
log_level = "debug"
```

一般的なログメッセージとその意味:

| ログメッセージ | 意味 |
|-------------|---------|
| `Connection registered` | Cloudflare エッジへのトンネルが確立 |
| `Retrying connection` | エッジ接続が切断、再接続を試行中 |
| `Serve tunnel error` | 致命的エラー、トンネルは再起動される |
| `Registered DNS record` | DNS ルートが正常に作成された |

## 例: 本番環境の完全セットアップ

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"
health_check_interval_secs = 30
max_failures = 3

[tunnel.cloudflare]
mode = "named"
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.mycompany.com"
protocol = "quic"
retries = 5
grace_period_secs = 30
log_level = "info"
```

```bash
# 環境変数でトークンを設定
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjY..."

# PRX を開始 -- トンネルは自動的に開始
prx start
```

## セキュリティノート

- トンネルトークンは名前付きトンネルへの完全なアクセスを付与します。PRX シークレットマネージャーに保存するか、環境変数で渡してください。バージョン管理にコミットしないでください。
- クイックトンネルは Access ポリシーをサポートしません。本番環境では名前付きトンネルを使用してください。
- `cloudflared` は PRX と同じユーザー権限を持つ子プロセスとして実行されます。最小権限の専用サービスアカウントで PRX を実行することを検討してください。
- `cloudflared` と Cloudflare エッジ間のすべてのトラフィックは TLS 1.3 または QUIC で暗号化されます。

## 関連ページ

- [トンネル概要](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [セキュリティ概要](/ja/prx/security/)
- [シークレット管理](/ja/prx/security/secrets)

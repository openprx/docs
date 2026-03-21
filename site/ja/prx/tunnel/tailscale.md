---
title: Tailscale Funnel
description: Tailscale メッシュネットワーク上の Tailscale Funnel を使用して PRX エージェントをインターネットに公開
---

# Tailscale Funnel

Tailscale Funnel は、Tailscale のリレーインフラを通じてローカル PRX インスタンスをパブリックインターネットに公開できます。サードパーティのエッジネットワークを必要とする従来のトンネルとは異なり、Funnel は既存の Tailscale メッシュを活用するため、PRX ノードが既に Tailscale で通信している場合に最適な選択です。

## 概要

Tailscale は PRX 接続のための 2 つの補完的な機能を提供します:

| 機能 | スコープ | ユースケース |
|---------|-------|----------|
| **Tailscale Serve** | プライベート（tailnet のみ） | Tailscale ネットワーク上の他のデバイスに PRX を公開 |
| **Tailscale Funnel** | パブリック（インターネット） | 外部 Webhook やサービスに PRX を公開 |

PRX は Webhook イングレスに Funnel を、tailnet 内のノード間通信に Serve を使用します。

### Funnel の仕組み

```
External Service (GitHub, Telegram, etc.)
         │
         ▼ HTTPS
┌─────────────────────┐
│  Tailscale DERP Relay│
│  (Tailscale infra)   │
└────────┬────────────┘
         │ WireGuard
┌────────▼────────────┐
│  tailscaled          │
│  (your machine)      │
└────────┬────────────┘
         │ localhost
┌────────▼────────────┐
│  PRX Gateway         │
│  (127.0.0.1:8080)   │
└─────────────────────┘
```

トラフィックは Tailscale MagicDNS ホスト名（例: `prx-host.tailnet-name.ts.net`）に到着し、WireGuard を介して Tailscale の DERP リレーネットワークを経由してルーティングされ、ローカル PRX ゲートウェイに転送されます。

## 前提条件

1. PRX を実行するマシンに Tailscale がインストールされ認証済み
2. tailnet で Tailscale Funnel が有効化（管理者の承認が必要）
3. マシンの Tailscale ノードが ACL ポリシーで Funnel 機能を持つ

### Tailscale のインストール

```bash
# Debian / Ubuntu
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# Authenticate
sudo tailscale up
```

### ACL ポリシーで Funnel を有効化

Funnel は tailnet の ACL ポリシーで明示的に許可する必要があります。Tailscale ACL ファイル（管理コンソール経由）に以下を追加します:

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

これはすべてのメンバーに Funnel 機能を付与します。より厳格な制御には、`autogroup:member` を特定のユーザーまたはタグに置き換えます:

```json
{
  "target": ["tag:prx-agent"],
  "attr": ["funnel"]
}
```

## 設定

### 基本的な Funnel セットアップ

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
# Funnel exposes the service to the public internet.
# Set to false to use Serve (tailnet-only access).
funnel = true

# Port to expose via Funnel. Tailscale Funnel supports
# ports 443, 8443, and 10000.
port = 443

# HTTPS is mandatory for Funnel. Tailscale provisions
# a certificate automatically via Let's Encrypt.
```

### Tailnet 限定（Serve）セットアップ

パブリック公開なしのプライベートなノード間通信:

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
funnel = false
port = 443
```

## 設定リファレンス

| パラメータ | 型 | デフォルト | 説明 |
|-----------|------|---------|-------------|
| `funnel` | boolean | `true` | `true` でパブリック Funnel、`false` で tailnet 限定の Serve |
| `port` | integer | `443` | パブリックポート（Funnel は 443、8443、10000 をサポート） |
| `tailscale_path` | string | `"tailscale"` | `tailscale` CLI バイナリへのパス |
| `hostname` | string | 自動検出 | MagicDNS ホスト名のオーバーライド |
| `reset_on_stop` | boolean | `true` | PRX 停止時に Funnel/Serve 設定を削除 |
| `background` | boolean | `true` | `tailscale serve` をバックグラウンドモードで実行 |

## PRX による Tailscale の管理

トンネル開始時、PRX は以下を実行します:

```bash
# Funnel（パブリック）の場合
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# Serve（プライベート）の場合
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

`--bg` フラグは `tailscaled` デーモン内でバックグラウンドで serve/funnel を実行します。PRX は子プロセスを維持する必要がなく、`tailscaled` が転送を処理します。

PRX が停止すると、以下を実行してクリーンアップします:

```bash
tailscale funnel --https=443 off
# または
tailscale serve --https=443 off
```

この動作は `reset_on_stop` パラメータで制御されます。

## パブリック URL

Funnel のパブリック URL は MagicDNS パターンに従います:

```
https://<machine-name>.<tailnet-name>.ts.net
```

例えば、マシン名が `prx-host` で tailnet が `example` の場合、URL は:

```
https://prx-host.example.ts.net
```

PRX は `tailscale status --json` の出力を解析してこのホスト名を自動検出し、完全なパブリック URL を構築します。

## ヘルスチェック

PRX は 2 つのチェックで Tailscale トンネルを監視します:

1. **Tailscale デーモンステータス** -- `tailscale status --json` がノードを接続済みと報告する必要がある
2. **Funnel の到達可能性** -- パブリック URL への HTTP GET が 2xx レスポンスを返す必要がある

ヘルスチェックが失敗した場合、PRX は `tailscale funnel` コマンドを再度実行して Funnel の再確立を試みます。`tailscaled` 自体がダウンしている場合、PRX はエラーをログに記録し、デーモンが復旧するまでトンネルを無効にします。

## ACL の考慮事項

Tailscale ACL は、どのデバイスが通信でき、どのデバイスが Funnel を使用できるかを制御します。PRX デプロイメントにおける重要な考慮事項:

### PRX ノードへの Funnel の制限

PRX マシンにタグを付け、Funnel アクセスを制限します:

```json
{
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  },
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ]
}
```

### ノード間トラフィックの許可

分散 PRX デプロイメントでは、PRX ノード間のトラフィックを許可します:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prx-agent"],
      "dst": ["tag:prx-agent:443"]
    }
  ]
}
```

## トラブルシューティング

| 症状 | 原因 | 解決策 |
|---------|-------|------------|
| 「Funnel not available」 | ACL ポリシーに funnel 属性がない | ACL のノードまたはユーザーに `funnel` 属性を追加 |
| 「not connected」ステータス | `tailscaled` が実行されていない | Tailscale デーモンを開始: `sudo tailscale up` |
| 証明書エラー | DNS が伝播されていない | MagicDNS の伝播を待機（通常 1 分未満） |
| ポートが既に使用中 | 同じポートに別の Serve/Funnel がある | 既存を削除: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | PRX ゲートウェイがリッスンしていない | `local_addr` がゲートウェイのリッスンアドレスと一致することを確認 |

## 関連ページ

- [トンネル概要](./)
- [Cloudflare トンネル](./cloudflare)
- [ngrok](./ngrok)
- [ノードペアリング](/ja/prx/nodes/pairing)
- [セキュリティ概要](/ja/prx/security/)

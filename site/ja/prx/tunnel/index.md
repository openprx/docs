---
title: トンネル概要
description: ローカルエージェントインスタンスを外部の Webhook、チャネル、サービスに公開するための PRX トンネリングシステムの概要
---

# トンネルと NAT トラバーサル

PRX エージェントはしばしばインバウンド接続を受信する必要があります -- GitHub からの Webhook コールバック、Telegram の更新、Slack イベント、ノード間通信など。NAT やファイアウォールの背後で実行する場合、トンネルサブシステムはトンネルプロバイダーへのアウトバウンド接続を確立し、パブリック URL をローカル PRX インスタンスにマッピングすることで自動的なイングレスを提供します。

## トンネリングが重要な理由

多くの PRX 機能にはパブリックに到達可能なエンドポイントが必要です:

- **Webhook チャネル** -- Telegram、Discord、Slack、GitHub はすべて指定された URL にイベントをプッシュします。パブリックエンドポイントがなければ、これらのチャネルはエージェントにメッセージを配信できません。
- **OAuth2 コールバック** -- プロバイダー認証フローはブラウザをローカル URL にリダイレクトします。トンネルにより PRX がプライベートネットワーク上で実行されていても機能します。
- **ノード間通信** -- 分散 PRX デプロイメントではノードが相互に到達する必要があります。トンネルは異なるネットワーク間のノードをブリッジします。
- **MCP サーバーホスティング** -- PRX が外部クライアント向け MCP サーバーとして機能する場合、トンネルがパブリックエンドポイントを提供します。

## サポートされるバックエンド

PRX には 4 つのトンネルバックエンドと no-op フォールバックが同梱されています:

| バックエンド | プロバイダー | 無料プラン | カスタムドメイン | 認証必須 | ゼロトラスト |
|---------|----------|-----------|---------------|---------------|------------|
| [Cloudflare トンネル](./cloudflare) | Cloudflare | あり | あり（ゾーン付き） | あり（`cloudflared`） | あり |
| [Tailscale Funnel](./tailscale) | Tailscale | あり（個人） | MagicDNS 経由 | あり（Tailscale アカウント） | あり |
| [ngrok](./ngrok) | ngrok | あり（制限付き） | あり（有料） | あり（認証トークン） | なし |
| カスタムコマンド | 任意 | プロバイダーによる | プロバイダーによる | プロバイダーによる | プロバイダーによる |
| なし | -- | -- | -- | -- | -- |

## アーキテクチャ

トンネルサブシステムは `Tunnel` トレイトを中心に構築されています:

```rust
#[async_trait]
pub trait Tunnel: Send + Sync {
    /// Start the tunnel and return the public URL.
    async fn start(&mut self) -> Result<String>;

    /// Stop the tunnel and clean up resources.
    async fn stop(&mut self) -> Result<()>;

    /// Check if the tunnel is healthy and the public URL is reachable.
    async fn health_check(&self) -> Result<bool>;
}
```

各バックエンドがこのトレイトを実装します。`TunnelProcess` 構造体は基盤となる子プロセス（例: `cloudflared`、`tailscale`、`ngrok`）を管理し、スポーン、stdout/stderr のキャプチャ、グレースフルシャットダウン、障害時の自動再起動を処理します。

```
┌─────────────────────────────────────────────┐
│                PRX Gateway                   │
│            (localhost:8080)                   │
└──────────────────┬──────────────────────────┘
                   │ (local)
┌──────────────────▼──────────────────────────┐
│              TunnelProcess                   │
│  ┌──────────────────────────────────┐       │
│  │  cloudflared / tailscale / ngrok │       │
│  │  (child process)                 │       │
│  └──────────────┬───────────────────┘       │
└─────────────────┼───────────────────────────┘
                  │ (outbound TLS)
┌─────────────────▼───────────────────────────┐
│         Tunnel Provider Edge Network         │
│    https://your-agent.example.com            │
└──────────────────────────────────────────────┘
```

## 設定

`config.toml` でトンネルを設定:

```toml
[tunnel]
# Backend selection: "cloudflare" | "tailscale" | "ngrok" | "custom" | "none"
backend = "cloudflare"

# Local address that the tunnel will forward traffic to.
# This should match your gateway listen address.
local_addr = "127.0.0.1:8080"

# Health check interval in seconds. The tunnel is restarted if
# the health check fails consecutively for `max_failures` times.
health_check_interval_secs = 30
max_failures = 3

# Auto-detect: if backend = "auto", PRX probes for available
# tunnel binaries in order: cloudflared, tailscale, ngrok.
# Falls back to "none" with a warning if nothing is found.
```

### バックエンド固有の設定

各バックエンドには独自の設定セクションがあります。詳細は個別のバックエンドページを参照:

- [Cloudflare トンネル](./cloudflare) -- `[tunnel.cloudflare]`
- [Tailscale Funnel](./tailscale) -- `[tunnel.tailscale]`
- [ngrok](./ngrok) -- `[tunnel.ngrok]`

### カスタムコマンドバックエンド

ネイティブにサポートされていないトンネルプロバイダーには `custom` バックエンドを使用:

```toml
[tunnel]
backend = "custom"

[tunnel.custom]
# The command to run. Must accept traffic on local_addr and print
# the public URL to stdout within startup_timeout_secs.
command = "bore"
args = ["local", "8080", "--to", "bore.pub"]
startup_timeout_secs = 15

# Optional: regex to extract the public URL from stdout.
# The first capture group is used as the URL.
url_pattern = "listening at (https?://[\\S]+)"
```

## 自動検出

`backend = "auto"` の場合、PRX は `$PATH` でトンネルバイナリを以下の順序で検索します:

1. `cloudflared` -- ゼロトラスト機能のため推奨
2. `tailscale` -- プライベートメッシュネットワーキングのため推奨
3. `ngrok` -- 広く利用可能、セットアップが簡単

いずれも見つからない場合、トンネルは無効化され PRX は警告をログに記録します。Webhook に依存するチャネルはトンネルまたはパブリック IP なしでは機能しません。

## TunnelProcess ライフサイクル

`TunnelProcess` 構造体は子プロセスのライフサイクルを管理します:

| フェーズ | 説明 |
|-------|-------------|
| **Spawn** | 設定された引数でトンネルバイナリを開始 |
| **URL 抽出** | stdout からパブリック URL をパース（`startup_timeout_secs` 以内） |
| **監視** | パブリック URL への HTTP GET による定期的なヘルスチェック |
| **再起動** | `max_failures` 回連続でヘルスチェックが失敗した場合、停止して再起動 |
| **シャットダウン** | SIGTERM を送信、5 秒待機、まだ実行中なら SIGKILL |

## 環境変数

トンネル設定は環境変数でも設定でき、`config.toml` より優先されます:

| 変数 | 説明 |
|----------|-------------|
| `PRX_TUNNEL_BACKEND` | トンネルバックエンドのオーバーライド |
| `PRX_TUNNEL_LOCAL_ADDR` | ローカル転送アドレスのオーバーライド |
| `PRX_TUNNEL_URL` | トンネル起動を完全にスキップしてこの URL を使用 |
| `CLOUDFLARE_TUNNEL_TOKEN` | Cloudflare トンネルトークン |
| `NGROK_AUTHTOKEN` | ngrok 認証トークン |

`PRX_TUNNEL_URL` を設定すると、既にリバースプロキシやロードバランサーで PRX を公開している場合に便利です。トンネルサブシステムはプロセス管理をスキップし、提供された URL を直接使用します。

## セキュリティの考慮事項

- **TLS 終端** -- すべてのサポートされるバックエンドはプロバイダーエッジで TLS を終端します。プロバイダーとローカル PRX インスタンス間のトラフィックは暗号化トンネルを通過します。
- **アクセス制御** -- Cloudflare と Tailscale はアイデンティティベースのアクセスポリシーをサポートします。機密性の高いエージェントエンドポイントを公開する場合に使用してください。
- **認証情報の保存** -- トンネルトークンと認証キーは PRX シークレットマネージャーに保存します。バージョン管理にコミットしないでください。
- **プロセス分離** -- `TunnelProcess` は別の子プロセスとして実行されます。PRX エージェントランタイムとメモリを共有しません。

## トラブルシューティング

| 症状 | 原因 | 解決策 |
|---------|-------|------------|
| トンネルは開始するが Webhook が失敗 | URL がチャネル設定に伝播されていない | `tunnel.public_url` がチャネルで使用されているか確認 |
| トンネルが繰り返し再起動 | ヘルスチェックが間違ったエンドポイントに接続 | `local_addr` がゲートウェイのリッスンアドレスと一致することを確認 |
| 「binary not found」エラー | トンネル CLI がインストールされていない | 適切なバイナリをインストール（`cloudflared`、`tailscale`、`ngrok`） |
| URL 抽出時のタイムアウト | トンネルバイナリの起動に時間がかかりすぎ | `startup_timeout_secs` を増加 |

## 関連ページ

- [Cloudflare トンネル](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [ゲートウェイ設定](/ja/prx/gateway)
- [セキュリティ概要](/ja/prx/security/)

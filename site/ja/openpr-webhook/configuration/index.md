---
title: 設定リファレンス
description: "OpenPR-WebhookのTOML設定ファイルの完全リファレンス。サーバー、セキュリティ、フィーチャーフラグ、ランタイム、トンネル、エージェントの全フィールド。"
---

# 設定リファレンス

OpenPR-WebhookはTOML設定ファイルを1つ使用します。デフォルトでは現在のディレクトリの`config.toml`を探します。最初のコマンドライン引数としてカスタムパスを指定できます。

## 完全スキーマ

```toml
# ─── Server ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # Bind address and port

# ─── Security ─────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # HMAC-SHA256 secrets (supports rotation)
allow_unsigned = false                     # Allow unsigned webhook requests (default: false)

# ─── Feature Flags ────────────────────────────────────────
[features]
tunnel_enabled = false                 # Enable WSS tunnel subsystem (default: false)
cli_enabled = false                    # Enable CLI agent executor (default: false)
callback_enabled = false               # Enable state-transition callbacks (default: false)

# ─── Runtime Tuning ───────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # Max concurrent CLI tasks (default: 1)
http_timeout_secs = 15                 # HTTP client timeout (default: 15)
tunnel_reconnect_backoff_max_secs = 60 # Max tunnel reconnect backoff (default: 60)

# ─── WSS Tunnel ───────────────────────────────────────────
[tunnel]
enabled = false                        # Enable this tunnel instance (default: false)
url = "wss://control.example.com/ws"   # WebSocket URL
agent_id = "my-agent"                  # Agent identifier
auth_token = "bearer-token"            # Bearer auth token
reconnect_secs = 3                     # Base reconnect interval (default: 3)
heartbeat_secs = 20                    # Heartbeat interval (default: 20, min: 3)
hmac_secret = "envelope-signing-key"   # Envelope HMAC signing secret
require_inbound_sig = false            # Require inbound message signatures (default: false)

# ─── Agents ───────────────────────────────────────────────

# --- OpenClaw Agent ---
[[agents]]
id = "notify-signal"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- OpenPRX Agent (HTTP API mode) ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- OpenPRX Agent (CLI mode) ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Webhook Agent ---
[[agents]]
id = "forward-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # Optional: sign outbound requests

# --- Custom Agent ---
[[agents]]
id = "custom-script"
name = "Custom Script"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- CLI Agent ---
[[agents]]
id = "ai-coder"
name = "AI Coder"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
```

## セクションリファレンス

### `[server]`

| フィールド | タイプ | 必須 | デフォルト | 説明 |
|-------|------|----------|---------|-------------|
| `listen` | String | はい | -- | `host:port`フォーマットのTCPバインドアドレス |

### `[security]`

| フィールド | タイプ | 必須 | デフォルト | 説明 |
|-------|------|----------|---------|-------------|
| `webhook_secrets` | String配列 | いいえ | `[]` | インバウンド検証用の有効なHMAC-SHA256シークレットのリスト。複数シークレットはキーローテーションをサポート。 |
| `allow_unsigned` | Boolean | いいえ | `false` | 署名検証なしで未署名リクエストを受け付ける。**プロダクションには非推奨。** |

**署名検証**は順に2つのヘッダーをチェックします：
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

ヘッダー値は`sha256={hex-digest}`フォーマットである必要があります。サービスは`webhook_secrets`の各シークレットを1つがマッチするまで試みます。

### `[features]`

すべてのフィーチャーフラグはデフォルトで`false`です。この多層防御アプローチにより、危険な機能は明示的にオプトインする必要があります。

| フィールド | タイプ | デフォルト | 説明 |
|-------|------|---------|-------------|
| `tunnel_enabled` | Boolean | `false` | WSSトンネルサブシステムを有効化 |
| `cli_enabled` | Boolean | `false` | CLIエージェントエグゼキュータを有効化 |
| `callback_enabled` | Boolean | `false` | 状態遷移コールバックを有効化 |

### `[runtime]`

| フィールド | タイプ | デフォルト | 説明 |
|-------|------|---------|-------------|
| `cli_max_concurrency` | Integer | `1` | 並行CLIエージェントタスクの最大数 |
| `http_timeout_secs` | Integer | `15` | アウトバウンドHTTPリクエストのタイムアウト（Webhook転送、コールバック、Signal API） |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | トンネル再接続の最大バックオフ間隔 |

### `[tunnel]`

詳細なドキュメントは[WSSトンネル](../tunnel/index.md)を参照してください。

### `[[agents]]`

詳細なドキュメントは[エージェントタイプ](../agents/index.md)と[エグゼキュータリファレンス](../agents/executors.md)を参照してください。

## 環境変数

| 変数 | 説明 |
|----------|-------------|
| `OPENPR_WEBHOOK_SAFE_MODE` | `1`、`true`、`yes`、または`on`に設定すると、設定に関わらずトンネル、CLI、コールバック機能を無効化。緊急ロックダウンに便利。 |
| `RUST_LOG` | ログの詳細度を制御。デフォルト：`openpr_webhook=info`。例：`openpr_webhook=debug`、`openpr_webhook=trace` |

## セーフモード

`OPENPR_WEBHOOK_SAFE_MODE=1`を設定すると以下が無効になります：

- CLIエージェント実行（`cli_enabled`が強制的に`false`）
- コールバック送信（`callback_enabled`が強制的に`false`）
- WSSトンネル（`tunnel_enabled`が強制的に`false`）

非危険なエージェント（openclaw、openprx、webhook、custom）は通常通り機能し続けます。これにより設定ファイルを変更せずにサービスを素早くロックダウンできます。

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## 最小設定

最小の有効な設定：

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

エージェントなし、署名検証なしでサービスを起動します。開発にのみ有効です。

## プロダクションチェックリスト

- [ ] `webhook_secrets`に少なくとも1つのエントリを設定
- [ ] `allow_unsigned = false`を設定
- [ ] 少なくとも1つのエージェントを設定
- [ ] CLIエージェントを使用する場合：`cli_enabled = true`を設定してエグゼキュータホワイトリストを確認
- [ ] トンネルを使用する場合：`wss://`（`ws://`ではない）を使用し、`hmac_secret`と`require_inbound_sig = true`を設定
- [ ] `RUST_LOG=openpr_webhook=info`を設定（パフォーマンスのためプロダクションでは`debug`/`trace`を避ける）
- [ ] 非CLI機能を確認するために最初は`OPENPR_WEBHOOK_SAFE_MODE=1`で実行することを検討

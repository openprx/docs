---
title: エグゼキュータリファレンス
description: "OpenPR-Webhookの5つのエグゼキュータタイプ（openclaw、openprx、webhook、custom、cli）の詳細なドキュメント。設定フィールド、動作、例。"
---

# エグゼキュータリファレンス

このページでは、5つのエグゼキュータタイプすべての設定フィールド、動作、例を詳しく説明します。

## openclaw

OpenClaw CLIツールを通じてメッセージングプラットフォーム（Signal、Telegram）に通知を送信します。

**動作：** OpenClawバイナリを`--channel`、`--target`、`--message`引数で呼び出すシェルコマンドを構築します。

**設定：**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # Path to the OpenClaw binary
channel = "signal"                     # Channel: "signal" or "telegram"
target = "+1234567890"                 # Phone number, group ID, or channel name
```

**フィールド：**

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `command` | はい | OpenClaw CLIバイナリへのパス |
| `channel` | はい | メッセージングチャンネル（`signal`、`telegram`） |
| `target` | はい | 受信者識別子（電話番号、グループIDなど） |

---

## openprx

OpenPRXメッセージングインフラを通じてメッセージを送信します。HTTPAPIモード（Signalデーモン）またはCLIコマンドの2つのモードをサポートします。

**モード1: Signal API（推奨）**

signal-cli REST APIデーモンにJSON POSTを送信：

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # signal-cli REST API base URL
account = "+1234567890"                 # Sender phone number
target = "+0987654321"                  # Recipient phone number or UUID
channel = "signal"                      # Default: "signal"
```

Signal APIに送信されるHTTPリクエスト：

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**モード2: CLIコマンド**

`signal_api`が設定されていない場合はシェルコマンドの実行にフォールバック：

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**フィールド：**

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `signal_api` | いいえ | Signal デーモンHTTP APIのベースURL |
| `account` | いいえ | アカウントの電話番号（`signal_api`と共に使用） |
| `target` | はい | 受信者の電話番号またはUUID |
| `channel` | いいえ | チャンネル名（デフォルト：`signal`） |
| `command` | いいえ | CLIコマンド（`signal_api`が設定されていない場合のフォールバック） |

`signal_api`または`command`の少なくとも一方を提供する必要があります。

---

## webhook

完全なWebhookペイロードをそのままHTTPエンドポイントに転送します。Slack、Discord、カスタムAPI、または別のWebhookサービスへのチェーンに便利です。

**動作：** 元のペイロードと共に設定されたURLにJSON POSTを送信します。オプションでHMAC-SHA256で送信リクエストに署名します。

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Optional: sign outbound requests
```

**フィールド：**

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `url` | はい | 送信先URL |
| `secret` | いいえ | 送信署名用HMAC-SHA256シークレット（`X-Webhook-Signature`ヘッダーとして送信） |

`secret`が設定されている場合、送信リクエストにはJSONボディで計算された`X-Webhook-Signature: sha256=...`ヘッダーが含まれ、受信側が真正性を検証できます。

---

## custom

フォーマットされたメッセージを引数として任意のシェルコマンドを実行します。カスタム統合、ログ記録、外部スクリプトのトリガーに便利です。

**動作：** `sh -c '{command} "{message}"'`を実行します。`{message}`はエスケープ済み特殊文字でレンダリングされたテンプレートです。

```toml
[[agents]]
id = "custom-logger"
name = "Log to File"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # Optional additional arguments
```

**フィールド：**

| フィールド | 必須 | 説明 |
|-------|----------|-------------|
| `command` | はい | 実行ファイルまたはシェルコマンドへのパス |
| `args` | いいえ | 追加のコマンドライン引数 |

**セキュリティ注意:** カスタムエグゼキュータはシェルコマンドを実行します。コマンドパスが信頼できるものであり、ユーザーが制御できないことを確認してください。

---

## cli

イシューを処理するためのAIコーディングエージェントを実行します。自動コード生成とイシュー解決のために設計された最も強力なエグゼキュータタイプです。

**必要条件：** 設定で`features.cli_enabled = true`が必要。`OPENPR_WEBHOOK_SAFE_MODE=1`の場合はブロックされます。

**サポートされるエグゼキュータ（ホワイトリスト）：**

| エグゼキュータ | バイナリ | コマンドパターン |
|----------|--------|-----------------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions [--mcp-config path] "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

このホワイトリストにないエグゼキュータは拒否されます。

**設定：**

```toml
[features]
cli_enabled = true
callback_enabled = true  # Required for state transitions

[[agents]]
id = "my-coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # One of: codex, claude-code, opencode
workdir = "/opt/projects/backend"      # Working directory for the CLI tool
timeout_secs = 900                     # Timeout in seconds (default: 900)
max_output_chars = 12000               # Max chars to capture from stdout/stderr (default: 12000)
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"

# State transitions (requires callback_enabled)
update_state_on_start = "in_progress"  # Set issue state when task starts
update_state_on_success = "done"       # Set issue state on success
update_state_on_fail = "todo"          # Set issue state on failure/timeout

# Callback configuration
callback = "mcp"                       # Callback mode: "mcp" or "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # Optional Bearer token for callback

# MCP クローズドループ (v0.3.0+)
skip_callback_state = true             # コールバックの状態更新をスキップ（AIがMCP経由で管理）
# mcp_instructions = "..."            # カスタムMCPツール指示（デフォルトを上書き）
# mcp_config_path = "/path/to/mcp.json"  # claude-code --mcp-config のパス

# エージェントごとの環境変数
[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
OPENPR_WORKSPACE_ID = "e5166fd1-..."
```

**フィールド：**

| フィールド | 必須 | デフォルト | 説明 |
|-------|----------|---------|-------------|
| `executor` | はい | -- | CLIツール名（`codex`、`claude-code`、`opencode`） |
| `workdir` | いいえ | -- | 作業ディレクトリ |
| `timeout_secs` | いいえ | 900 | プロセスタイムアウト |
| `max_output_chars` | いいえ | 12000 | 出力テールキャプチャ制限 |
| `prompt_template` | いいえ | `Fix issue {issue_id}: {title}\nContext: {reason}` | CLIツールに送信するプロンプト |
| `update_state_on_start` | いいえ | -- | タスク開始時のイシュー状態 |
| `update_state_on_success` | いいえ | -- | 成功時のイシュー状態 |
| `update_state_on_fail` | いいえ | -- | 失敗またはタイムアウト時のイシュー状態 |
| `callback` | いいえ | `mcp` | コールバックプロトコル（`mcp`または`api`） |
| `callback_url` | いいえ | -- | コールバックを送信するURL |
| `callback_token` | いいえ | -- | コールバック認証のBearerトークン |
| `skip_callback_state` | いいえ | `false` | コールバックの状態更新をスキップ（AIがMCP経由で状態を管理する場合） |
| `mcp_instructions` | いいえ | 組み込み | プロンプトに追記するカスタムMCPツール指示 |
| `mcp_config_path` | いいえ | -- | MCPコンフィグファイルへのパス（`--mcp-config`でclause-codeに渡す） |
| `env_vars` | いいえ | `{}` | エグゼキュータサブプロセスに注入する追加環境変数 |

**プロンプトテンプレートのプレースホルダー（cli固有）：**

| プレースホルダー | ソース |
|-------------|--------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**コールバックペイロード（MCPモード）：**

`callback = "mcp"`の場合、サービスは`callback_url`にJSON-RPCスタイルのPOSTを送信します：

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**状態遷移のライフサイクル：**

```
イベント受信
    |
    v
[update_state_on_start] --> イシュー状態 = "in_progress"
    |
    v
CLIツール実行（timeout_secsまで）
    |
    +-- 成功 --> [update_state_on_success] --> イシュー状態 = "done"
    |
    +-- 失敗 --> [update_state_on_fail] --> イシュー状態 = "todo"
    |
    +-- タイムアウト --> [update_state_on_fail] --> イシュー状態 = "todo"
```

`skip_callback_state = true`の場合、上記の状態遷移はすべて抑制されます。AIエージェントがMCPツールを通じてイシュー状態を直接管理することが期待されます。

---

### MCP クローズドループ自動化

AIエージェントがOpenPR MCPツールを利用できる場合、イシューのフルコンテキストを自律的に読み取り、問題を修正し、結果を書き戻すことができます。これにより完全なクローズドループが形成されます。

**動作の仕組み：**

1. openpr-webhookがボットタスクのWebhookイベントを受信する
2. `prompt_template`からプロンプトを構築し、MCPの指示（デフォルトまたはカスタム）を追記する
3. CLIエグゼキュータが注入された`env_vars`（例：`OPENPR_BOT_TOKEN`）付きで実行される
4. AIエージェントがMCPツールを使用してイシューの詳細を読み取り、コードを修正し、コメントを投稿し、状態を更新する
5. コールバックが実行メタデータ（所要時間、終了コード）を報告するが、状態更新はスキップする

**デフォルトMCP指示**（`mcp_instructions`、`mcp_config_path`、または`env_vars`が設定されている場合に自動追記）：

```
1. work_items.get を work_item_id="{issue_id}" で呼び出してイシューの全詳細を読み取る
2. comments.list を work_item_id="{issue_id}" で呼び出してすべてのコメントを読み取る
3. work_items.list_labels を work_item_id="{issue_id}" で呼び出してラベルを読み取る
4. 修正完了後、comments.create を呼び出してサマリーを投稿する
5. 成功した場合、work_items.update を呼び出して状態を "done" に設定する
```

カスタムの`mcp_instructions`フィールドでこれらを上書きできます。

**環境変数**（`env_vars`）：

エグゼキュータサブプロセスにエージェントごとの環境変数を注入します。異なるエージェントに異なるAPI URL、トークン、ワークスペースIDを提供する際に便利です：

```toml
[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_bot_token_here"
OPENPR_WORKSPACE_ID = "e5166fd1-..."
```

**MCPコンフィグパス**（`mcp_config_path`）：

`claude-code`エグゼキュータで、エージェントがグローバルでないMCP設定を必要とする場合、パスを指定します：

```toml
mcp_config_path = "/etc/openpr-webhook/mcp-config.json"
```

これにより`--mcp-config /etc/openpr-webhook/mcp-config.json`がclaudeコマンドに追加されます。

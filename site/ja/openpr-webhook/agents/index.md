---
title: エージェントタイプ
description: "OpenPR-Webhookの5種類のエージェントタイプ：openclaw、openprx、webhook、custom、cli。設定構造、メッセージテンプレート、エージェントマッチングロジック。"
---

# エージェントタイプ

エージェントはOpenPR-Webhookのコアのディスパッチユニットです。各エージェントはマッチしたWebhookイベントの処理方法を定義します。単一のデプロイメントで複数のエージェントを設定でき、イベントはWebhookペイロードの`bot_context`に基づいて適切なエージェントにルーティングされます。

## 概要

| タイプ | ユースケース | フィーチャーフラグが必要 |
|------|----------|----------------------|
| `openclaw` | OpenClaw CLIを使用してSignal/Telegramで通知を送信 | いいえ |
| `openprx` | OpenPRX Signal APIまたはCLIでメッセージを送信 | いいえ |
| `webhook` | HTTPエンドポイント（Slack、Discordなど）にイベントを転送 | いいえ |
| `custom` | 任意のシェルコマンドを実行 | いいえ |
| `cli` | AIコーディングエージェント（codex、claude-code、opencode）を実行 | はい（`cli_enabled`） |

## エージェント設定構造

すべてのエージェントは以下の共通フィールドを持ちます：

```toml
[[agents]]
id = "unique-id"              # Unique identifier, used for matching
name = "Human-Readable Name"  # Display name, also used for matching
agent_type = "openclaw"       # One of: openclaw, openprx, webhook, custom, cli
message_template = "..."      # Optional: custom message format
```

次に、`agent_type`に応じて、タイプ固有の設定ブロックを提供します：

- `[agents.openclaw]` -- openclawエージェント用
- `[agents.openprx]` -- openprxエージェント用
- `[agents.webhook]` -- webhookエージェント用
- `[agents.custom]` -- customエージェント用
- `[agents.cli]` -- cliエージェント用

## メッセージテンプレート

`message_template`フィールドはWebhookペイロードの値で置換されるプレースホルダーをサポートします：

| プレースホルダー | ソース | 例 |
|-------------|--------|---------|
| `{event}` | `payload.event` | `issue.updated` |
| `{title}` | `payload.data.issue.title` | `Fix login bug` |
| `{key}` | `payload.data.issue.key` | `PROJ-42` |
| `{issue_id}` | `payload.data.issue.id` | `123` |
| `{reason}` | `payload.bot_context.trigger_reason` | `assigned_to_bot` |
| `{actor}` | `payload.actor.name` | `alice` |
| `{project}` | `payload.project.name` | `backend` |
| `{workspace}` | `payload.workspace.name` | `IM` |
| `{state}` | `payload.data.issue.state` | `in_progress` |
| `{priority}` | `payload.data.issue.priority` | `high` |
| `{url}` | 派生 | `issue/123` |

デフォルトテンプレート（openclaw、openprx、webhook、custom用）：

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## エージェントマッチングロジック

`bot_context.is_bot_task = true`のWebhookイベントが届くと：

1. サービスは`bot_context.bot_name`と`bot_context.bot_agent_type`を抽出する
2. `id`または`name`（大文字小文字を区別しない）が`bot_name`と一致するエージェントを検索する
3. 名前でマッチしない場合は、`agent_type`が`bot_agent_type`と一致する最初のエージェントにフォールバックする
4. エージェントが一切マッチしない場合、イベントは確認されるがディスパッチされない

## マルチエージェントの例

```toml
# Agent 1: Notification via Telegram
[[agents]]
id = "notify-tg"
name = "Telegram Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "telegram"
target = "@my-channel"

# Agent 2: Forward to Slack
[[agents]]
id = "notify-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"

# Agent 3: AI coding agent
[[agents]]
id = "coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
```

この設定では、OpenPRはWebhookペイロードの`bot_name`フィールドを設定することで異なるエージェントに異なるイベントをルーティングできます。

## 次のステップ

- [エグゼキュータリファレンス](executors.md) -- 各エグゼキュータタイプの詳細なドキュメント
- [設定リファレンス](../configuration/index.md) -- 完全なTOMLスキーマ

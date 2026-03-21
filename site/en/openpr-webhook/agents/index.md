# Agent Types

Agents are the core dispatch units in OpenPR-Webhook. Each agent defines how to handle a matched webhook event. You can configure multiple agents in a single deployment, and events are routed to the appropriate agent based on the `bot_context` in the webhook payload.

## Overview

| Type | Use Case | Requires Feature Flag |
|------|----------|----------------------|
| `openclaw` | Send notifications via Signal/Telegram using OpenClaw CLI | No |
| `openprx` | Send messages via OpenPRX Signal API or CLI | No |
| `webhook` | Forward events to HTTP endpoints (Slack, Discord, etc.) | No |
| `custom` | Run arbitrary shell commands | No |
| `cli` | Execute AI coding agents (codex, claude-code, opencode) | Yes (`cli_enabled`) |

## Agent Configuration Structure

Every agent has these common fields:

```toml
[[agents]]
id = "unique-id"              # Unique identifier, used for matching
name = "Human-Readable Name"  # Display name, also used for matching
agent_type = "openclaw"       # One of: openclaw, openprx, webhook, custom, cli
message_template = "..."      # Optional: custom message format
```

Then, depending on `agent_type`, you provide the type-specific configuration block:

- `[agents.openclaw]` for openclaw agents
- `[agents.openprx]` for openprx agents
- `[agents.webhook]` for webhook agents
- `[agents.custom]` for custom agents
- `[agents.cli]` for cli agents

## Message Templates

The `message_template` field supports placeholders that are substituted with values from the webhook payload:

| Placeholder | Source | Example |
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
| `{url}` | derived | `issue/123` |

Default template (for openclaw, openprx, webhook, custom):

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## Agent Matching Logic

When a webhook event arrives with `bot_context.is_bot_task = true`:

1. The service extracts `bot_context.bot_name` and `bot_context.bot_agent_type`
2. It searches agents for one whose `id` or `name` (case-insensitive) matches `bot_name`
3. If no match by name, it falls back to the first agent whose `agent_type` matches `bot_agent_type`
4. If no agent matches at all, the event is acknowledged but not dispatched

## Multi-Agent Example

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

In this setup, OpenPR can route different events to different agents by setting the `bot_name` field in the webhook payload.

## Next Steps

- [Executor Reference](executors.md) -- detailed documentation for each executor type
- [Configuration Reference](../configuration/index.md) -- full TOML schema

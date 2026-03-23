# OpenPR-Webhook

OpenPR-Webhook is a webhook event dispatcher service for [OpenPR](https://github.com/openprx/openpr). It receives webhook events from the OpenPR platform, filters them based on bot context, and routes them to one or more configurable agents for processing.

## What It Does

When an event occurs in OpenPR (e.g., an issue is created or updated), the platform sends a webhook POST request to this service. OpenPR-Webhook then:

1. **Verifies the request** using HMAC-SHA256 signature validation
2. **Filters events** -- only events with `bot_context.is_bot_task = true` are processed
3. **Routes to agents** -- matches the event to a configured agent by name or type
4. **Dispatches** -- executes the agent's action (send a message, call a CLI tool, forward to another webhook, etc.)

## Architecture Overview

```
OpenPR Platform
    |
    | POST /webhook (HMAC-SHA256 signed)
    v
+-------------------+
| openpr-webhook    |
|                   |
| Signature verify  |
| Event filter      |
| Agent matching    |
+-------------------+
    |           |           |
    v           v           v
 openclaw    webhook     cli agent
 (Signal/    (HTTP       (codex /
  Telegram)  forward)    claude-code)
```

## Key Features

- **HMAC-SHA256 signature verification** on incoming webhooks with multi-secret rotation support
- **Bot-task filtering** -- silently ignores events not intended for bots
- **5 agent/executor types** -- openclaw, openprx, webhook, custom, cli
- **Message templates** with placeholder variables for flexible notification formatting
- **State transitions** -- automatically update issue state on task start, success, or failure
- **WSS Tunnel** (Phase B) -- active WebSocket connection to a control plane for push-based task dispatch
- **MCP closed-loop automation** -- AI agents read full issue context and write results back via OpenPR MCP tools
- **Per-agent environment variables** -- inject `OPENPR_BOT_TOKEN`, `OPENPR_API_URL`, etc. per agent
- **Safety-first defaults** -- dangerous features (tunnel, cli, callback) are OFF by default, gated behind feature flags and safe mode

## Supported Agent Types

| Type | Purpose | Protocol |
|------|---------|----------|
| `openclaw` | Send notifications via Signal/Telegram through OpenClaw CLI | Shell command |
| `openprx` | Send messages via OpenPRX Signal API or CLI | HTTP API / Shell |
| `webhook` | Forward the full event payload to an HTTP endpoint | HTTP POST |
| `custom` | Execute an arbitrary shell command with the message as argument | Shell command |
| `cli` | Run an AI coding agent (codex, claude-code, opencode) on the issue | Subprocess |

## Quick Links

- [Installation](getting-started/installation.md)
- [Quick Start](getting-started/quickstart.md)
- [Agent Types](agents/index.md)
- [Executor Reference](agents/executors.md)
- [WSS Tunnel](tunnel/index.md)
- [Configuration Reference](configuration/index.md)
- [Troubleshooting](troubleshooting/index.md)

## Repository

Source code: [github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

License: MIT OR Apache-2.0

---
title: Channels Overview
description: PRX connects to 19 messaging platforms. Overview of all channels, comparison matrix, configuration patterns, and DM policies.
---

# Channels

Channels are messaging platform integrations that connect PRX to the outside world. Each channel implements a unified interface for sending and receiving messages, handling media, managing typing indicators, and performing health checks. PRX can run multiple channels simultaneously from a single daemon process.

## Supported Channels

PRX supports 19 messaging channels spanning consumer platforms, enterprise tools, open-source protocols, and developer interfaces.

### Channel Comparison Matrix

| Channel | DM | Group | Media | Voice | E2EE | Platform | Status |
|---------|:--:|:-----:|:-----:|:-----:|:----:|----------|:------:|
| [Telegram](./telegram) | Yes | Yes | Yes | No | No | Cross-platform | Stable |
| [Discord](./discord) | Yes | Yes | Yes | No | No | Cross-platform | Stable |
| [Slack](./slack) | Yes | Yes | Yes | No | No | Cross-platform | Stable |
| [WhatsApp](./whatsapp) | Yes | Yes | Yes | No | Yes | Cloud API | Stable |
| [WhatsApp Web](./whatsapp-web) | Yes | Yes | Yes | No | Yes | Multi-device | Beta |
| [Signal](./signal) | Yes | Yes | Yes | No | Yes | Cross-platform | Stable |
| [iMessage](./imessage) | Yes | Yes | Yes | No | Yes | macOS only | Beta |
| [Matrix](./matrix) | Yes | Yes | Yes | No | Yes | Federated | Stable |
| [Email](./email) | Yes | No | Yes | No | No | IMAP/SMTP | Stable |
| [Lark / Feishu](./lark) | Yes | Yes | Yes | No | No | Cross-platform | Stable |
| [DingTalk](./dingtalk) | Yes | Yes | Yes | No | No | Cross-platform | Stable |
| [QQ](./qq) | Yes | Yes | Yes | No | No | Cross-platform | Beta |
| [Mattermost](./mattermost) | Yes | Yes | Yes | No | No | Self-hosted | Stable |
| [Nextcloud Talk](./nextcloud-talk) | Yes | Yes | Yes | No | No | Self-hosted | Beta |
| [IRC](./irc) | Yes | Yes | No | No | No | Federated | Stable |
| [LINQ](./linq) | Yes | Yes | Yes | No | No | Partner API | Alpha |
| [CLI](./cli) | Yes | No | No | No | N/A | Terminal | Stable |
| Terminal | Yes | No | No | No | N/A | Terminal | Stable |
| Wacli | Yes | Yes | Yes | No | Yes | JSON-RPC | Beta |

**Legend:**
- **Stable** -- Production-ready, fully tested
- **Beta** -- Functional with known limitations
- **Alpha** -- Experimental, API may change

## Common Configuration Pattern

All channels are configured under the `[channels]` section of `~/.config/openprx/openprx.toml`. Each channel has its own subsection with platform-specific settings.

### Basic Structure

```toml
[channels]
# Enable the built-in CLI channel (default: true)
cli = true

# Per-message processing timeout in seconds (default: 300)
message_timeout_secs = 300

# ── Telegram ──────────────────────────────────────────────
[channels.telegram]
bot_token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
allowed_users = ["alice", "bob"]
stream_mode = "edit"            # "edit" | "append" | "none"
mention_only = false

# ── Discord ───────────────────────────────────────────────
[channels.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXX"
guild_id = "1234567890"         # optional: restrict to one server
allowed_users = []              # empty = allow all
listen_to_bots = false
mention_only = false

# ── Slack ─────────────────────────────────────────────────
[channels.slack]
bot_token = "xoxb-..."
app_token = "xapp-..."
allowed_users = []
mention_only = true
```

### Channel-Specific Examples

**Lark / Feishu:**

```toml
[channels.lark]
app_id = "cli_xxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = []
use_feishu = false              # true for Feishu (China), false for Lark (International)
receive_mode = "websocket"      # "websocket" | "webhook"
mention_only = false
```

**Signal:**

```toml
[channels.signal]
phone_number = "+1234567890"
signal_cli_path = "/usr/local/bin/signal-cli"
allowed_users = ["+1987654321"]
```

**Matrix (with E2EE):**

```toml
[channels.matrix]
homeserver_url = "https://matrix.org"
username = "@prx-bot:matrix.org"
password = "secure-password"
allowed_users = ["@alice:matrix.org"]
```

**Email (IMAP/SMTP):**

```toml
[channels.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 587
username = "prx-bot@gmail.com"
password = "app-specific-password"
allowed_from = ["alice@example.com"]
```

**DingTalk:**

```toml
[channels.dingtalk]
app_key = "dingxxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
robot_code = "dingxxxxxxxxx"
allowed_users = []
```

## DM Policies

PRX provides fine-grained control over who can send direct messages to your agent. The DM policy is configured per-channel and determines how incoming direct messages are handled.

### Policy Types

| Policy | Behavior |
|--------|----------|
| `pairing` | Requires a pairing handshake before the sender is accepted. The user must complete a challenge-response flow to authenticate. Future feature -- currently falls back to `allowlist`. |
| `allowlist` | **(Default)** Only senders listed in the channel's `allowed_users` array can interact with the agent. Messages from unlisted senders are silently ignored. |
| `open` | Any user can send direct messages to the agent. Use with caution in production. |
| `disabled` | All direct messages are ignored. Useful when PRX should only respond in groups. |

### Configuration

DM policies are set at the top level of the channels config:

```toml
[channels]
dm_policy = "allowlist"         # "pairing" | "allowlist" | "open" | "disabled"
```

Each channel's `allowed_users` array is the allowlist for that channel:

```toml
[channels.telegram]
bot_token = "..."
allowed_users = ["alice", "bob"]  # Only these users can DM
```

When `dm_policy = "open"`, the `allowed_users` field is ignored and all senders are accepted.

## Group Policies

Similar to DM policies, PRX controls which group conversations the agent participates in:

| Policy | Behavior |
|--------|----------|
| `allowlist` | **(Default)** Only groups listed in the channel's group allowlist are monitored. |
| `open` | The agent responds in any group it is added to. |
| `disabled` | All group messages are ignored. |

```toml
[channels]
group_policy = "allowlist"

[channels.telegram]
bot_token = "..."
# Group allowlist is configured per-channel
```

## Mention-Only Mode

Most channels support a `mention_only` flag. When enabled, the agent only responds to messages that explicitly mention it (via @mention, reply, or platform-specific trigger). This is useful in group chats to avoid the agent responding to every message.

```toml
[channels.discord]
bot_token = "..."
mention_only = true   # Only respond when @mentioned
```

## Stream Mode

Some channels support streaming LLM responses in real-time. The `stream_mode` setting controls how streaming output is displayed:

| Mode | Behavior |
|------|----------|
| `edit` | Edits the same message as tokens arrive (Telegram, Discord) |
| `append` | Appends new text to the message |
| `none` | Waits for the full response before sending |

```toml
[channels.telegram]
bot_token = "..."
stream_mode = "edit"
draft_update_interval_ms = 1000   # How often to update the draft (ms)
```

## Adding a New Channel

PRX channels are based on the `Channel` trait. To connect a new channel:

1. Add the channel configuration to your `openprx.toml`
2. Restart the daemon: `prx daemon`

Alternatively, use the interactive channel wizard:

```bash
prx channel add telegram
```

To list active channels:

```bash
prx channel list
```

To diagnose channel connectivity issues:

```bash
prx channel doctor
```

## Channel Architecture

Under the hood, each channel:

1. **Listens** for incoming messages from the platform (via polling, webhooks, or WebSocket)
2. **Filters** messages based on DM/group policies and allowlists
3. **Routes** accepted messages into the agent loop for processing
4. **Sends** the agent's response back through the platform's API
5. **Reports** health status and reconnects automatically with exponential backoff

All channels run concurrently within the daemon process, sharing the agent runtime, memory, and tool subsystems.

## Next Steps

Choose a channel to learn about its specific setup:

- [Telegram](./telegram) -- Bot API integration
- [Discord](./discord) -- Bot with slash commands
- [Slack](./slack) -- Slack app with Socket Mode
- [WhatsApp](./whatsapp) -- Cloud API integration
- [Signal](./signal) -- Signal CLI bridge
- [Matrix](./matrix) -- Federated chat with E2EE
- [Lark / Feishu](./lark) -- Enterprise messaging
- [Email](./email) -- IMAP/SMTP integration

---
title: Messaging
description: Tools for sending messages through communication channels with automatic routing and low-level gateway access.
---

# Messaging

PRX provides two messaging tools that enable agents to send messages back through communication channels. The `message_send` tool is the high-level interface for sending text, media, and voice messages to any configured channel, while the `gateway` tool provides low-level access to the Axum HTTP/WebSocket gateway for raw message delivery.

Messaging tools are registered at the gateway level and are available when a channel is active. The `message_send` tool automatically routes messages to the active channel (Telegram, Discord, Slack, CLI, etc.), while the `gateway` tool offers direct gateway protocol access for advanced use cases.

These tools complement the inbound channel system. While channels handle receiving messages from users and routing them to the agent, messaging tools handle the outbound direction -- sending agent-generated content back to users.

## Configuration

Messaging tools do not have a dedicated configuration section. Their availability depends on channel and gateway configuration:

```toml
# Gateway configuration (messaging tools depend on this)
[gateway]
host = "127.0.0.1"
port = 16830

# Channel configuration (message_send routes to active channel)
[channels_config]
cli = true
message_timeout_secs = 300

[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
stream_mode = "partial"
```

The `message_send` tool is available whenever at least one channel is active. The `gateway` tool is always registered in `all_tools()`.

## Tool Reference

### message_send

Sends a message to any configured channel and recipient. The tool automatically routes to the active channel -- the channel through which the current conversation is happening.

**Send a text message:**

```json
{
  "name": "message_send",
  "arguments": {
    "text": "The build completed successfully. All 42 tests passed.",
    "channel": "telegram"
  }
}
```

**Send media (image/file):**

```json
{
  "name": "message_send",
  "arguments": {
    "media_path": "/tmp/screenshot.png",
    "caption": "Current dashboard state",
    "channel": "telegram"
  }
}
```

**Send a voice message:**

```json
{
  "name": "message_send",
  "arguments": {
    "voice_path": "/tmp/summary.mp3",
    "channel": "telegram"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | `string` | Conditional | -- | Text message content (required if no media/voice) |
| `channel` | `string` | No | Active channel | Target channel name (auto-detected if omitted) |
| `recipient` | `string` | No | Current user | Recipient identifier (user ID, chat ID, etc.) |
| `media_path` | `string` | No | -- | Path to media file (image, document, video) |
| `caption` | `string` | No | -- | Caption for media messages |
| `voice_path` | `string` | No | -- | Path to voice/audio file |
| `reply_to` | `string` | No | -- | Message ID to reply to (platform-specific) |

### gateway

Low-level gateway access for sending raw messages through the Axum HTTP/WebSocket gateway. This tool is intended for advanced use cases where `message_send` is insufficient.

```json
{
  "name": "gateway",
  "arguments": {
    "action": "send",
    "payload": {
      "type": "text",
      "content": "Raw gateway message",
      "target": "ws://localhost:16830/ws"
    }
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | Gateway action: `"send"`, `"broadcast"`, `"status"` |
| `payload` | `object` | Conditional | -- | Message payload (required for `"send"` and `"broadcast"`) |

## Usage

### Automatic Channel Routing

In most cases, the agent does not need to specify a channel. When a user sends a message through Telegram, the agent's response is automatically routed back to Telegram:

```
User (via Telegram): What's the weather like?
Agent: [calls message_send with text="Currently 22C and sunny in Shanghai."]
       → Automatically sent to Telegram, to the same chat
```

### Cross-Channel Messaging

The agent can send messages to a different channel than the one the conversation is happening on:

```json
{
  "name": "message_send",
  "arguments": {
    "text": "Build failed! Check CI logs.",
    "channel": "discord",
    "recipient": "111222333"
  }
}
```

This is useful for notification workflows where the agent monitors one channel and sends alerts to another.

### Media Delivery

The agent can send files, images, and audio through messaging channels:

1. Generate or download the media file
2. Save it to a temporary path
3. Send it via `message_send` with `media_path`

```
Agent thinking: User asked for a chart of the data.
  1. [shell] python3 generate_chart.py --output /tmp/chart.png
  2. [message_send] media_path="/tmp/chart.png", caption="Monthly revenue chart"
```

### Voice Messages

For channels that support voice (Telegram, WhatsApp, Discord), the agent can send audio messages:

```
Agent thinking: User asked for a voice summary.
  1. [tts] text="Here is your daily summary..." output="/tmp/summary.mp3"
  2. [message_send] voice_path="/tmp/summary.mp3"
```

## Channel Routing Details

When `message_send` is called without an explicit `channel` parameter, PRX determines the target channel using the following logic:

1. **Active session channel**: The channel associated with the current agent session (set when the session was created by an incoming message)
2. **Default channel**: If no session channel is set, falls back to the first active channel
3. **CLI fallback**: If no channels are configured, output goes to stdout

### Supported Channel Transports

| Channel | Text | Media | Voice | Reply |
|---------|:----:|:-----:|:-----:|:-----:|
| Telegram | Yes | Yes | Yes | Yes |
| Discord | Yes | Yes | Yes | Yes |
| Slack | Yes | Yes | No | Yes |
| WhatsApp | Yes | Yes | Yes | Yes |
| Signal | Yes | Yes | No | Yes |
| Matrix | Yes | Yes | No | Yes |
| Email | Yes | Yes (attachment) | No | Yes |
| CLI | Yes | No | No | No |

## Security

### Channel Authorization

Outbound messages are subject to the same channel policies as inbound messages. The agent can only send messages to channels that are configured and active. Attempting to send to an unconfigured channel returns an error.

### Recipient Validation

When a `recipient` is specified, PRX validates that the recipient is reachable through the target channel. For channels with `allowed_users` lists, outbound messages to unlisted recipients are blocked.

### Rate Limiting

Outbound messages are subject to the channel's rate limits (configured per-platform). For example, Telegram enforces API rate limits that PRX respects with automatic backoff.

### Policy Engine

Messaging tools can be controlled through the security policy:

```toml
[security.tool_policy.tools]
message_send = "allow"
gateway = "supervised"     # Require approval for raw gateway access
```

### Audit Logging

All outbound messages are recorded in the audit log:

- Target channel and recipient
- Message type (text, media, voice)
- Timestamp
- Delivery status

Media file paths are logged but file contents are not stored in the audit log.

## Related

- [Channels Overview](/en/prx/channels/) -- all 19 supported messaging platforms
- [Gateway](/en/prx/gateway/) -- HTTP API and WebSocket architecture
- [Gateway HTTP API](/en/prx/gateway/http-api) -- REST API endpoints
- [Gateway WebSocket](/en/prx/gateway/websocket) -- real-time streaming
- [Rendering Tools (TTS)](/en/prx/tools/media) -- text-to-speech for voice messages
- [Tools Overview](/en/prx/tools/) -- all tools and registry system

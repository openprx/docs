---
title: Slack
description: Connect PRX to Slack via the Bot API and Socket Mode
---

# Slack

> Connect PRX to Slack using a bot with OAuth tokens, Socket Mode for real-time events, and threaded conversation support.

## Prerequisites

- A Slack workspace where you have permission to install apps
- A Slack app created at [api.slack.com/apps](https://api.slack.com/apps)
- A bot token (`xoxb-...`) and optionally an app-level token (`xapp-...`) for Socket Mode

## Quick Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click "Create New App"
2. Choose "From scratch" and select your workspace
3. Under "OAuth & Permissions", add these bot scopes:
   - `chat:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - `files:read`, `files:write`, `reactions:write`, `users:read`
4. Install the app to your workspace and copy the **Bot User OAuth Token** (`xoxb-...`)

### 2. Enable Socket Mode (recommended)

1. Under "Socket Mode", enable it and generate an app-level token (`xapp-...`) with the `connections:write` scope
2. Under "Event Subscriptions", subscribe to: `message.channels`, `message.groups`, `message.im`, `message.mpim`

### 3. Configure

```toml
[channels_config.slack]
bot_token = "xoxb-your-bot-token-here"
app_token = "xapp-your-app-token-here"
allowed_users = ["U01ABCDEF"]
```

### 4. Verify

```bash
prx channel doctor slack
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bot_token` | `String` | *required* | Slack bot OAuth token (`xoxb-...`) |
| `app_token` | `String` | `null` | App-level token (`xapp-...`) for Socket Mode. Without this, falls back to polling |
| `channel_id` | `String` | `null` | Restrict the bot to a single channel. Omit or set `"*"` to listen across all channels |
| `allowed_users` | `[String]` | `[]` | Slack user IDs. Empty = deny all. `"*"` = allow all |
| `interrupt_on_new_message` | `bool` | `false` | When true, a new message from the same sender cancels the in-flight request |
| `thread_replies` | `bool` | `true` | When true, replies stay in the originating thread. When false, replies go to the channel root |
| `mention_only` | `bool` | `false` | When true, only respond to @-mentions. DMs are always processed |

## Features

- **Socket Mode** -- real-time event delivery without a public URL (requires `app_token`)
- **Threaded replies** -- automatically replies within the originating thread
- **File attachments** -- downloads and inlines text files; processes images up to 5 MB
- **User display names** -- resolves Slack user IDs to display names with caching (6-hour TTL)
- **Multi-channel support** -- listen across multiple channels or restrict to one
- **Typing indicators** -- shows typing status while generating responses
- **Interrupt support** -- cancel in-flight requests when the user sends a follow-up

## Limitations

- Slack messages are limited to 40,000 characters (rarely an issue)
- File downloads are limited to 256 KB for text and 5 MB for images
- Maximum 8 file attachments processed per message
- Socket Mode requires the `connections:write` scope on an app-level token
- Without Socket Mode (`app_token`), the channel falls back to polling with higher latency

## Troubleshooting

### Bot does not receive messages
- Verify Socket Mode is enabled and the `app_token` is correct
- Check that "Event Subscriptions" include the necessary `message.*` events
- Ensure the bot has been invited to the channel (`/invite @botname`)

### Replies go to the channel instead of the thread
- Check that `thread_replies` is not set to `false`
- Thread replies require the original message to have a `thread_ts`

### File attachments are not processed
- Ensure the bot has the `files:read` scope
- Only `text/*` and common image MIME types are supported
- Files larger than the size limits are silently skipped

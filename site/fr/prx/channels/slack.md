---
title: Slack
description: Connecter PRX a Slack via le Bot API and Socket Mode
---

# Slack

> Connecter PRX a Slack en utilisant un bot avec des tokens OAuth, Socket Mode pour les evenements en temps reel, and le support des conversations par fil.

## Prerequis

- Un espace de travail Slack ou vous avez la permission d'installer des applications
- A Slack app created at [api.slack.com/apps](https://api.slack.com/apps)
- A bot token (`xoxb-...`) and optionally an app-level token (`xapp-...`) for Socket Mode

## Quick Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click "Create New App"
2. Choose "From scratch" et selectionnez votre espace de travail
3. Under "OAuth & Permissions", add these bot scopes:
   - `chat:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - `files:read`, `files:write`, `reactions:write`, `users:read`
4. Installez l'application dans votre espace de travail and copy the **Bot User OAuth Token** (`xoxb-...`)

### 2. Enable Socket Mode (recommended)

1. Under "Socket Mode", enable it and generate an app-level token (`xapp-...`) avec le `connections:write` scope
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

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `bot_token` | `String` | *required* | Slack bot OAuth token (`xoxb-...`) |
| `app_token` | `String` | `null` | App-level token (`xapp-...`) for Socket Mode. Without this, falls back to polling |
| `channel_id` | `String` | `null` | Restrict le bot to un seul channel. Omit or set `"*"` to listen pour tous les channels |
| `allowed_users` | `[String]` | `[]` | Slack user IDs. Empty = deny all. `"*"` = allow all |
| `interrupt_on_new_message` | `bool` | `false` | When true, un nouveau message depuis le same sender cancels the in-flight request |
| `thread_replies` | `bool` | `true` | When true, replies stay in the originating thread. When false, replies go vers le channel root |
| `mention_only` | `bool` | `false` | When true, only respond to @-mentions. DMs are always processed |

## Fonctionnalites

- **Socket Mode** -- en temps reel event delivery without a public URL (requires `app_token`)
- **Threaded replies** -- automatically replies within the originating thread
- **File attachments** -- downloads and inlines text files; processes images jusqu'a 5 MB
- **User display names** -- resolves Slack user IDs to display names with caching (6-hour TTL)
- **Multi-channel support** -- listen a travers plusieurs channels or restrict to one
- **Typing indicators** -- shows typing status tandis que generating responses
- **Interrupt support** -- cancel in-flight requests when l'utilisateur sends a follow-up

## Limiteations

- Slack messages are limited to 40,000 characters (rarely an issue)
- File downloads are limited to 256 KB for text and 5 MB for images
- Maximum 8 pieces jointes processed per message
- Socket Mode necessite the `connections:write` scope on an app-level token
- Without Socket Mode (`app_token`), the channel falls back to polling with higher latency

## Depannage

### Bot ne fait pas receive messages
- Verify Socket Mode est active and the `app_token` is correct
- Verifiez que "Event Subscriptions" include the necessary `message.*` events
- Ensure le bot a ete invited vers le channel (`/invite @botname`)

### Replies go vers le channel au lieu de the thread
- Verifiez que `thread_replies` n'est pas defini to `false`
- Thread replies require the original message to have a `thread_ts`

### File attachments are not processed
- Ensure le bot dispose des `files:read` scope
- Only `text/*` and common image MIME types sont pris en charge
- Files larger than the size limits are silently skipped

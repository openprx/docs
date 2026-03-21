---
title: Mattermost
description: Connect PRX to Mattermost via the REST API
---

# Mattermost

> Connect PRX to Mattermost using the REST API v4 for messaging in this open-source, self-hosted Slack alternative.

## Prerequisites

- A Mattermost server (self-hosted or cloud)
- A bot account created in Mattermost with a personal access token
- The bot invited to the channels where it should operate

## Quick Setup

### 1. Create a Bot Account

1. Go to **System Console > Integrations > Bot Accounts** and enable bot accounts
2. Go to **Integrations > Bot Accounts > Add Bot Account**
3. Set a username, display name, and role
4. Copy the generated **Access Token**

Alternatively, create a regular user account and generate a personal access token under **Profile > Security > Personal Access Tokens**.

### 2. Configure

```toml
[channels_config.mattermost]
url = "https://mattermost.example.com"
bot_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
channel_id = "abc123def456ghi789"
allowed_users = ["user123456"]
```

### 3. Verify

```bash
prx channel doctor mattermost
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | `String` | *required* | Mattermost server URL (e.g., `"https://mattermost.example.com"`) |
| `bot_token` | `String` | *required* | Bot access token or personal access token |
| `channel_id` | `String` | `null` | Optional channel ID to restrict the bot to a single channel |
| `allowed_users` | `[String]` | `[]` | Allowed Mattermost user IDs. Empty = deny all. `"*"` = allow all |
| `thread_replies` | `bool` | `true` | When true, replies thread on the original post. When false, replies go to the channel root |
| `mention_only` | `bool` | `false` | When true, only respond to messages that @-mention the bot |

## Features

- **REST API v4** -- uses the standard Mattermost API for sending and receiving messages
- **Threaded replies** -- automatically replies within the originating thread
- **Typing indicators** -- shows typing status while generating responses
- **Self-hosted friendly** -- works with any Mattermost deployment, no external dependencies
- **Channel restriction** -- optionally limit the bot to a single channel with `channel_id`
- **Mention filtering** -- only respond to @-mentions in busy channels

## Limitations

- Uses polling rather than WebSocket for message delivery, introducing slight latency
- The bot must be a member of the channel to read and send messages
- Bot accounts require System Admin to enable in Mattermost System Console
- File attachment processing is not currently supported
- Trailing slashes in the URL are automatically stripped

## Troubleshooting

### Bot does not respond
- Verify the `url` does not have a trailing slash (it is auto-stripped, but double-check)
- Confirm the bot token is valid: `curl -H "Authorization: Bearer <token>" https://your-mm.com/api/v4/users/me`
- Ensure the bot has been added to the channel

### Replies go to the wrong place
- If `thread_replies = true`, replies thread on the original post's `root_id`
- If the original message is not in a thread, a new thread is created
- Set `thread_replies = false` to always post to the channel root

### Bot responds to everything in the channel
- Set `mention_only = true` to only respond when @-mentioned
- Alternatively, restrict to a dedicated channel with `channel_id`

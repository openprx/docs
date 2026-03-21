---
title: Mattermost
description: Connecter PRX a Mattermost via le REST API
---

# Mattermost

> Connecter PRX a Mattermost en utilisant le REST API v4 for messaging in this open-source, self-hosted Slack alternative.

## Prerequis

- A Mattermost server (self-hosted or cloud)
- A bot account created in Mattermost avec un personal access token
- Le bot invited vers le channels where it should operate

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

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `url` | `String` | *required* | Mattermost server URL (e.g., `"https://mattermost.example.com"`) |
| `bot_token` | `String` | *required* | Bot access token or personal access token |
| `channel_id` | `String` | `null` | Optionnel channel ID to restrict le bot to un seul channel |
| `allowed_users` | `[String]` | `[]` | Allowed Mattermost user IDs. Empty = deny all. `"*"` = allow all |
| `thread_replies` | `bool` | `true` | When true, replies thread sur le original post. When false, replies go vers le channel root |
| `mention_only` | `bool` | `false` | When true, only respond to messages that @-mention le bot |

## Fonctionnalites

- **REST API v4** -- uses the standard Mattermost API for sending and receiving messages
- **Threaded replies** -- automatically replies within the originating thread
- **Typing indicators** -- shows typing status tandis que generating responses
- **Self-hosted friendly** -- works avec unny Mattermost deployment, no external dependencies
- **Channel restriction** -- optionally limit le bot to un seul channel with `channel_id`
- **Mention filtering** -- only respond to @-mentions in busy channels

## Limiteations

- Uses polling plutot que WebSocket for message delivery, introducing slight latency
- Le bot doit etre a member of the channel to read and send messages
- Bot accounts require System Admin pour activer in Mattermost System Console
- File attachment processing is not currently supported
- Trailing slashes in l'URL sont automatiquement stripped

## Depannage

### Bot ne fait pas respond
- Verify the `url` n'a pas de a trailing slash (elle est automatiquement supprimee, mais verifiez)
- Confirm le bot token is valid: `curl -H "Authorization: Bearer <token>" https://your-mm.com/api/v4/users/me`
- Ensure le bot a ete added vers le channel

### Replies go vers le wrong place
- If `thread_replies = true`, replies thread sur le original post's `root_id`
- Si le original message is not in a thread, un nouveau thread is created
- Set `thread_replies = false` to always post vers le channel root

### Bot responds to everything in the channel
- Set `mention_only = true` to only respond when @-mentioned
- Alternatively, restrict vers un dedicated channel with `channel_id`

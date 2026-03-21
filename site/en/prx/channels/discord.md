---
title: Discord
description: Connect PRX to Discord via a bot application
---

# Discord

> Connect PRX to Discord using a bot application with Gateway WebSocket for real-time messaging in servers and DMs.

## Prerequisites

- A Discord account
- A Discord application with a bot user created in the [Developer Portal](https://discord.com/developers/applications)
- The bot invited to your server with appropriate permissions

## Quick Setup

### 1. Create a Bot Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to the "Bot" section and click "Add Bot"
4. Copy the bot token
5. Under "Privileged Gateway Intents", enable **Message Content Intent**

### 2. Invite the Bot

Generate an invite URL under "OAuth2 > URL Generator":
- Scopes: `bot`
- Permissions: `Send Messages`, `Read Message History`, `Add Reactions`, `Attach Files`

### 3. Configure

```toml
[channels_config.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
allowed_users = ["123456789012345678"]
```

### 4. Verify

```bash
prx channel doctor discord
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bot_token` | `String` | *required* | Discord bot token from the Developer Portal |
| `guild_id` | `String` | `null` | Optional guild (server) ID to restrict the bot to a single server |
| `allowed_users` | `[String]` | `[]` | Discord user IDs. Empty = deny all. `"*"` = allow all |
| `listen_to_bots` | `bool` | `false` | When true, process messages from other bots (still ignores its own messages) |
| `mention_only` | `bool` | `false` | When true, only respond to messages that @-mention the bot |

## Features

- **Gateway WebSocket** -- real-time message delivery via Discord's Gateway API
- **Server and DM support** -- responds in guild channels and direct messages
- **Text attachment processing** -- automatically fetches and inlines `text/*` attachments
- **Guild restriction** -- optionally limit the bot to a single server with `guild_id`
- **Bot-to-bot communication** -- enable `listen_to_bots` for multi-bot workflows
- **Typing indicators** -- shows typing status while generating responses

## Limitations

- Discord messages are limited to 2,000 characters (PRX auto-splits longer responses)
- Only `text/*` MIME type attachments are fetched and inlined; other file types are skipped
- The "Message Content Intent" must be enabled for the bot to read message text
- Requires a stable WebSocket connection to Discord's Gateway

## Troubleshooting

### Bot is online but does not respond
- Ensure "Message Content Intent" is enabled in the Developer Portal under Bot settings
- Verify the sender's Discord user ID is in `allowed_users`
- Check that the bot has `Send Messages` and `Read Message History` permissions in the channel

### Bot only works in some channels
- If `guild_id` is set, the bot only responds in that specific server
- Verify the bot has been invited with the correct permissions for each channel

### Messages from other bots are ignored
- Set `listen_to_bots = true` to process messages from other bot accounts
- The bot always ignores its own messages to prevent feedback loops

---
title: Telegram
description: Connect PRX to Telegram via the Bot API
---

# Telegram

> Connect PRX to Telegram using the official Bot API with support for DMs, groups, streaming responses, and media attachments.

## Prerequisites

- A Telegram account
- A bot token from [@BotFather](https://t.me/BotFather)
- The Telegram user IDs or usernames of allowed users

## Quick Setup

### 1. Create a Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts to name your bot
3. Copy the bot token (format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Configure

Add the following to your PRX config file:

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
allowed_users = ["123456789", "your_username"]
```

If `allowed_users` is left empty, PRX enters **pairing mode** and generates a one-time bind code. Send `/bind <code>` from your Telegram account to pair.

### 3. Verify

```bash
prx channel doctor telegram
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bot_token` | `String` | *required* | Telegram Bot API token from @BotFather |
| `allowed_users` | `[String]` | `[]` | Telegram user IDs or usernames. Empty = pairing mode. `"*"` = allow all |
| `stream_mode` | `String` | `"none"` | Streaming mode: `"none"`, `"edit"`, or `"typing"`. Edit mode progressively updates the response message |
| `draft_update_interval_ms` | `u64` | `500` | Minimum interval (ms) between draft message edits to avoid rate limits |
| `interrupt_on_new_message` | `bool` | `false` | When true, a new message from the same sender cancels the in-flight request |
| `mention_only` | `bool` | `false` | When true, only respond to @-mentions in groups. DMs are always processed |
| `ack_reactions` | `bool` | *inherited* | Override for the global `ack_reactions` setting. Falls back to `[channels_config].ack_reactions` if unset |

## Features

- **Direct messages and group chats** -- responds to DMs and group conversations
- **Streaming responses** -- progressive message edits show the response as it's generated
- **Pairing mode** -- secure one-time code binding when no allowed users are configured
- **Media attachments** -- handles documents, photos, and captions
- **Long message splitting** -- automatically splits responses exceeding Telegram's 4096 character limit at word boundaries
- **Acknowledgement reactions** -- reacts to incoming messages to confirm receipt
- **Voice transcription** -- transcribes voice messages when STT is configured

## Limitations

- Telegram limits text messages to 4,096 characters (PRX auto-splits longer messages)
- Bot API polling introduces slight latency compared to webhook mode
- Bots cannot initiate conversations; users must message the bot first
- File uploads are limited to 50 MB via the Bot API

## Troubleshooting

### Bot does not respond to messages
- Verify the bot token is correct with `prx channel doctor telegram`
- Check that the sender's user ID or username is in `allowed_users`
- If `allowed_users` is empty, use `/bind <code>` to pair first

### Rate limit errors on streaming
- Increase `draft_update_interval_ms` (e.g., to `1000` or higher)
- Telegram enforces per-chat rate limits on message edits

### Bot responds in DMs but not in groups
- Ensure `mention_only` is set to `false`, or @-mention the bot
- In BotFather, disable "Group Privacy" mode so the bot can see all group messages

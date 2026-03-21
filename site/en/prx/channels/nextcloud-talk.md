---
title: Nextcloud Talk
description: Connect PRX to Nextcloud Talk via the OCS API
---

# Nextcloud Talk

> Connect PRX to Nextcloud Talk using the OCS API and webhook-based message delivery for self-hosted team messaging.

## Prerequisites

- A Nextcloud instance (version 25 or later recommended) with the Talk app enabled
- A bot app token for OCS API authentication
- Webhook configuration for incoming message delivery

## Quick Setup

### 1. Create a Bot App Token

In Nextcloud, generate an app password:
1. Go to **Settings > Security > Devices & Sessions**
2. Create a new app password with a descriptive name (e.g., "PRX Bot")
3. Copy the generated token

Alternatively, for Nextcloud Talk Bot API (Nextcloud 27+):
1. Use `occ` to register a bot: `php occ talk:bot:setup "PRX" <secret> <webhook-url>`

### 2. Configure

```toml
[channels_config.nextcloud_talk]
base_url = "https://cloud.example.com"
app_token = "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
allowed_users = ["admin", "alice"]
```

### 3. Set Up Webhooks

Configure your Nextcloud Talk bot to send webhook events to PRX's gateway endpoint:

```
POST https://your-prx-domain.com/nextcloud-talk
```

### 4. Verify

```bash
prx channel doctor nextcloud_talk
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `base_url` | `String` | *required* | Nextcloud base URL (e.g., `"https://cloud.example.com"`) |
| `app_token` | `String` | *required* | Bot app token for OCS API bearer authentication |
| `webhook_secret` | `String` | `null` | Shared secret for HMAC-SHA256 webhook signature verification. Can also be set via `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` env var |
| `allowed_users` | `[String]` | `[]` | Allowed Nextcloud actor IDs. Empty = deny all. `"*"` = allow all |

## Features

- **Webhook-based delivery** -- receives messages via HTTP webhook push from Nextcloud Talk
- **OCS API replies** -- sends responses through the Nextcloud Talk OCS REST API
- **HMAC-SHA256 verification** -- optional webhook signature validation with `webhook_secret`
- **Multiple payload formats** -- supports both legacy/custom format and Activity Streams 2.0 format (Nextcloud Talk bot webhooks)
- **Self-hosted** -- works with any Nextcloud instance, keeping all data on your infrastructure

## Limitations

- Requires a publicly accessible HTTPS endpoint for webhook delivery (or a reverse proxy)
- Nextcloud Talk bot API is available from Nextcloud 27+; older versions require custom webhook setup
- The bot must be registered in the Talk room to receive messages
- File and media attachment handling is not currently supported
- Webhook payloads using millisecond timestamps are automatically normalized to seconds

## Troubleshooting

### Webhook events are not received
- Verify the webhook URL is publicly accessible and points to `https://your-domain/nextcloud-talk`
- Ensure the bot is registered in the Talk room
- Check Nextcloud server logs for webhook delivery errors

### Signature verification fails
- Ensure `webhook_secret` matches the secret used when registering the bot
- The secret can be set via config or the `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` environment variable

### Replies are not posted
- Verify `base_url` is correct and accessible from the PRX server
- Check that the `app_token` has permission to post messages in the room
- Review the OCS API response for authentication or permission errors

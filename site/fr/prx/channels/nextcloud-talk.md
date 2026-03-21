---
title: Nextcloud Talk
description: Connecter PRX a Nextcloud Talk via le OCS API
---

# Nextcloud Talk

> Connecter PRX a Nextcloud Talk en utilisant le OCS API and webhook-based message delivery for self-hosted team messaging.

## Prerequis

- A Nextcloud instance (version 25 or later recommended) avec le Talk app enabled
- A bot app token for OCS API authentication
- Webhook configuration for incoming message delivery

## Quick Setup

### 1. Create a Bot App Token

In Nextcloud, generate an app password:
1. Go to **Settings > Security > Devices & Sessions**
2. Create un nouveau app password avec un descriptive name (e.g., "PRX Bot")
3. Copy the generated token

Alternatively, for Nextcloud Talk Bot API (Nextcloud 27+):
1. Use `occ` to register un bot: `php occ talk:bot:setup "PRX" <secret> <webhook-url>`

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

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `base_url` | `String` | *required* | Nextcloud base URL (e.g., `"https://cloud.example.com"`) |
| `app_token` | `String` | *required* | Bot app token for OCS API bearer authentication |
| `webhook_secret` | `String` | `null` | Shared secret for HMAC-SHA256 webhook signature verification. Can also be set via `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` env var |
| `allowed_users` | `[String]` | `[]` | Allowed Nextcloud actor IDs. Empty = deny all. `"*"` = allow all |

## Fonctionnalites

- **Webhook-based delivery** -- receives messages via HTTP webhook push from Nextcloud Talk
- **OCS API replies** -- sends responses via le Nextcloud Talk OCS REST API
- **HMAC-SHA256 verification** -- optional webhook signature validation with `webhook_secret`
- **Multiple payload formats** -- prend en charge les deux legacy/custom format and Activity Streams 2.0 format (Nextcloud Talk bot webhooks)
- **Self-hosted** -- works avec unny Nextcloud instance, keeping all data on your infrastructure

## Limiteations

- Requires a publicly accessible HTTPS endpoint for webhook delivery (or a reverse proxy)
- Nextcloud Talk bot API est disponible from Nextcloud 27+; older versions require custom webhook setup
- Le bot doit etre registered in the Talk room to receive messages
- File and media attachment handling is not currently supported
- Webhook payloads using millisecond timestamps sont automatiquement normalized to seconds

## Depannage

### Webhook events are not received
- Verify the webhook URL is publicly accessible and points to `https://your-domain/nextcloud-talk`
- Ensure le bot est enregistre in the Talk room
- Check Nextcloud server logs for webhook delivery errors

### Signature verification fails
- Ensure `webhook_secret` matches the secret used when registering le bot
- The secret peut etre set via config ou le `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` variable d'environnement

### Replies are not posted
- Verify `base_url` is correct and accessible depuis le PRX server
- Verifiez que the `app_token` has permission to post messages in the room
- Review the OCS API response for authentication or permissien cas d'erreurs

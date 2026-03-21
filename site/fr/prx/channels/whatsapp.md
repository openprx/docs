---
title: WhatsApp (Cloud API)
description: Connecter PRX a WhatsApp via le Business Cloud API
---

# WhatsApp (Cloud API)

> Connecter PRX a WhatsApp en utilisant le Meta Business Cloud API for webhook-based messaging avec le WhatsApp Business platform.

## Prerequis

- A [Meta Business account](https://business.facebook.com/)
- A WhatsApp Business API application set up in the [Meta Developer Portal](https://developers.facebook.com/)
- A phone number ID and access token depuis le WhatsApp Business API
- A publicly accessible HTTPS endpoint for webhooks

## Quick Setup

### 1. Set Up WhatsApp Business API

1. Go vers le [Meta Developer Portal](https://developers.facebook.com/) and create an app
2. Add the "WhatsApp" product to your app
3. Under "WhatsApp > API Setup", note your **Phone Number ID** and generate a **Permanent Access Token**

### 2. Configure PRX

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxxxxxxxxxxxxxxxxxxx"
phone_number_id = "123456789012345"
verify_token = "my-secret-verify-token"
allowed_numbers = ["+1234567890"]
```

### 3. Set Up Webhooks

1. In the Meta Developer Portal, go to "WhatsApp > Configuration"
2. Set the webhook URL to `https://your-domain.com/whatsapp`
3. Enter the same `verify_token` you configure dans PRX
4. Subscribe vers le `messages` webhook field

### 4. Verify

```bash
prx channel doctor whatsapp
```

## Configuration Reference

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `access_token` | `String` | *required* | Permanent access token from Meta Business API |
| `phone_number_id` | `String` | *required* | Phone number ID from Meta Business API. Presence of ce champ selects Cloud API mode |
| `verify_token` | `String` | *required* | Shared secret for webhook verification handshake |
| `app_secret` | `String` | `null` | App secret for webhook signature verification (HMAC-SHA256). Can also be set via `ZEROCLAW_WHATSAPP_APP_SECRET` env var |
| `allowed_numbers` | `[String]` | `[]` | Allowed phone numbers in E.164 format (e.g., `"+1234567890"`). `"*"` = allow all |

## Fonctionnalites

- **Webhook-based messaging** -- receives messages via Meta webhook push notifications
- **E.164 phone number filtering** -- restrict access to specific phone numbers
- **HTTPS enforcement** -- refuses to transmit data over non-HTTPS URLs
- **Webhook signature verification** -- optional HMAC-SHA256 validation with `app_secret`
- **Text and media messages** -- handles incoming text, images, and other media types

## Limiteations

- Requires a publicly accessible HTTPS endpoint for webhook delivery
- Meta's Cloud API has rate limits based on your business tier
- 24-hour messaging window: you ne peut que reply within 24 hours of l'utilisateur's last message (unless using message templates)
- Phone numbers doit etre in E.164 format pour le allowlist

## Depannage

### Webhook verification fails
- Ensure `verify_token` in PRX config matches exactly what you entered in the Meta Developer Portal
- The webhook endpoint must respond to GET requests avec le `hub.challenge` parameter

### Messages are not received
- Verifiez que the webhook subscription includes the `messages` field
- Verify the webhook URL is publicly accessible over HTTPS
- Review webhook delivery logs in the Meta Developer Portal

### "Refusing to transmit over non-HTTPS" error
- All WhatsApp Cloud API communication necessite HTTPS
- Ensure your PRX gateway is behind a TLS-terminating proxy (e.g., Caddy, Nginx with SSL)

::: tip WhatsApp Web Mode
For a native WhatsApp Web client that ne fait pas require Meta Business API setup, see [WhatsApp Web](./whatsapp-web).
:::

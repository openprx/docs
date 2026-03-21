---
title: WhatsApp (Cloud API)
description: Connect PRX to WhatsApp via the Business Cloud API
---

# WhatsApp (Cloud API)

> Connect PRX to WhatsApp using the Meta Business Cloud API for webhook-based messaging with the WhatsApp Business platform.

## Prerequisites

- A [Meta Business account](https://business.facebook.com/)
- A WhatsApp Business API application set up in the [Meta Developer Portal](https://developers.facebook.com/)
- A phone number ID and access token from the WhatsApp Business API
- A publicly accessible HTTPS endpoint for webhooks

## Quick Setup

### 1. Set Up WhatsApp Business API

1. Go to the [Meta Developer Portal](https://developers.facebook.com/) and create an app
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
3. Enter the same `verify_token` you configured in PRX
4. Subscribe to the `messages` webhook field

### 4. Verify

```bash
prx channel doctor whatsapp
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `access_token` | `String` | *required* | Permanent access token from Meta Business API |
| `phone_number_id` | `String` | *required* | Phone number ID from Meta Business API. Presence of this field selects Cloud API mode |
| `verify_token` | `String` | *required* | Shared secret for webhook verification handshake |
| `app_secret` | `String` | `null` | App secret for webhook signature verification (HMAC-SHA256). Can also be set via `ZEROCLAW_WHATSAPP_APP_SECRET` env var |
| `allowed_numbers` | `[String]` | `[]` | Allowed phone numbers in E.164 format (e.g., `"+1234567890"`). `"*"` = allow all |

## Features

- **Webhook-based messaging** -- receives messages via Meta webhook push notifications
- **E.164 phone number filtering** -- restrict access to specific phone numbers
- **HTTPS enforcement** -- refuses to transmit data over non-HTTPS URLs
- **Webhook signature verification** -- optional HMAC-SHA256 validation with `app_secret`
- **Text and media messages** -- handles incoming text, images, and other media types

## Limitations

- Requires a publicly accessible HTTPS endpoint for webhook delivery
- Meta's Cloud API has rate limits based on your business tier
- 24-hour messaging window: you can only reply within 24 hours of the user's last message (unless using message templates)
- Phone numbers must be in E.164 format for the allowlist

## Troubleshooting

### Webhook verification fails
- Ensure `verify_token` in PRX config matches exactly what you entered in the Meta Developer Portal
- The webhook endpoint must respond to GET requests with the `hub.challenge` parameter

### Messages are not received
- Check that the webhook subscription includes the `messages` field
- Verify the webhook URL is publicly accessible over HTTPS
- Review webhook delivery logs in the Meta Developer Portal

### "Refusing to transmit over non-HTTPS" error
- All WhatsApp Cloud API communication requires HTTPS
- Ensure your PRX gateway is behind a TLS-terminating proxy (e.g., Caddy, Nginx with SSL)

::: tip WhatsApp Web Mode
For a native WhatsApp Web client that does not require Meta Business API setup, see [WhatsApp Web](./whatsapp-web).
:::

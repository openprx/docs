---
title: LINQ
description: Connect PRX to iMessage, RCS, and SMS via the Linq Partner API
---

# LINQ

> Connect PRX to iMessage, RCS, and SMS messaging through the Linq Partner V3 API for multi-protocol mobile messaging.

## Prerequisites

- A [Linq](https://linqapp.com) Partner account with API access
- A Linq API token
- A phone number provisioned through Linq for sending messages

## Quick Setup

### 1. Get API Credentials

1. Sign up for a Linq Partner account at [linqapp.com](https://linqapp.com)
2. Obtain your **API Token** from the partner dashboard
3. Note the **phone number** assigned to your account for sending

### 2. Configure

```toml
[channels_config.linq]
api_token = "your-linq-api-token"
from_phone = "+15551234567"
allowed_senders = ["+1987654321"]
```

### 3. Set Up Webhooks

Configure Linq to send webhook events to PRX's gateway endpoint:

```
POST https://your-prx-domain.com/linq
```

### 4. Verify

```bash
prx channel doctor linq
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_token` | `String` | *required* | Linq Partner API token (used as Bearer auth) |
| `from_phone` | `String` | *required* | Phone number to send from (E.164 format, e.g., `"+15551234567"`) |
| `signing_secret` | `String` | `null` | Webhook signing secret for HMAC signature verification |
| `allowed_senders` | `[String]` | `[]` | Allowed sender phone numbers in E.164 format. `"*"` = allow all |

## Features

- **Multi-protocol messaging** -- send and receive via iMessage, RCS, and SMS through a single integration
- **Webhook-based delivery** -- receives messages via HTTP webhook push from Linq
- **Image support** -- processes incoming image attachments and renders them as image markers
- **Outbound/inbound detection** -- automatically filters out your own outbound messages
- **Signature verification** -- optional HMAC webhook signature validation with `signing_secret`
- **E.164 phone number filtering** -- restrict access to specific sender phone numbers

## Limitations

- Requires a publicly accessible HTTPS endpoint for webhook delivery
- Linq Partner API access requires a partner account (not a consumer account)
- Message delivery depends on the recipient's messaging protocol (iMessage, RCS, or SMS fallback)
- Only image MIME types are processed for inline attachments; other media types are skipped
- API rate limits depend on your Linq Partner tier

## Troubleshooting

### Webhook events are not received
- Verify the webhook URL is publicly accessible and points to `https://your-domain/linq`
- Check the Linq partner dashboard for webhook delivery logs and errors
- Ensure the PRX gateway is running and listening on the correct port

### Messages are sent but replies fail
- Verify the `api_token` is valid and has not expired
- Check that `from_phone` is a valid, provisioned phone number on your Linq account
- Review the Linq API response for error details

### Bot replies to its own messages
- This should not happen; PRX automatically filters outbound messages using `is_from_me` and `direction` fields
- If it occurs, check that the webhook payload format matches the expected Linq V3 structure

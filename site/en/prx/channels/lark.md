---
title: Lark / Feishu
description: Connect PRX to Lark (international) or Feishu (China) IM
---

# Lark / Feishu

> Connect PRX to Lark (international) or Feishu (China mainland) using the Open Platform API with WebSocket long-connection or HTTP webhook event delivery.

## Prerequisites

- A Lark or Feishu tenant (organization)
- An app created in the [Lark Developer Console](https://open.larksuite.com/app) or [Feishu Developer Console](https://open.feishu.cn/app)
- App ID, App Secret, and Verification Token from the developer console

## Quick Setup

### 1. Create a Bot App

1. Go to the developer console and create a new Custom App
2. Under "Credentials", copy the **App ID** and **App Secret**
3. Under "Event Subscriptions", copy the **Verification Token**
4. Add the bot capability and configure permissions:
   - `im:message`, `im:message.group_at_msg`, `im:message.p2p_msg`

### 2. Configure

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]
```

For Feishu (China):

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
use_feishu = true
allowed_users = ["*"]
```

### 3. Verify

```bash
prx channel doctor lark
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `app_id` | `String` | *required* | App ID from the Lark/Feishu developer console |
| `app_secret` | `String` | *required* | App Secret from the developer console |
| `verification_token` | `String` | `null` | Verification token for webhook validation |
| `encrypt_key` | `String` | `null` | Encrypt key for webhook message decryption |
| `allowed_users` | `[String]` | `[]` | Allowed user IDs or union IDs. Empty = deny all. `"*"` = allow all |
| `mention_only` | `bool` | `false` | When true, only respond to @-mentions in groups. DMs are always processed |
| `use_feishu` | `bool` | `false` | When true, use Feishu (CN) API endpoints instead of Lark (international) |
| `receive_mode` | `String` | `"websocket"` | Event receive mode: `"websocket"` (default, no public URL needed) or `"webhook"` |
| `port` | `u16` | `null` | HTTP port for webhook mode only. Required when `receive_mode = "webhook"`, ignored for websocket |

## Features

- **WebSocket long-connection** -- persistent WSS connection for real-time events without a public URL (default mode)
- **HTTP webhook mode** -- alternative event delivery via HTTP callbacks for environments that require it
- **Lark and Feishu support** -- automatically switches API endpoints between Lark (international) and Feishu (China)
- **Acknowledgement reactions** -- reacts to incoming messages with locale-appropriate reactions (zh-CN, zh-TW, en, ja)
- **DM and group messaging** -- handles both private chats and group conversations
- **Tenant access token management** -- automatically obtains and refreshes tenant access tokens
- **Message deduplication** -- prevents double-dispatch of WebSocket messages within a 30-minute window

## Limitations

- WebSocket mode requires a stable outbound connection to Lark/Feishu servers
- Webhook mode requires a publicly accessible HTTPS endpoint
- The bot must be added to a group before it can receive group messages
- Feishu and Lark use different API domains; ensure `use_feishu` matches your tenant region
- Enterprise app approval may be required depending on your tenant's admin policies

## Troubleshooting

### Bot does not receive messages
- In websocket mode, check that outbound connections to `open.larksuite.com` (or `open.feishu.cn`) are allowed
- Verify the app has the required `im:message` permissions and has been approved/published
- Ensure the bot has been added to the group or the user has started a DM with it

### "Verification failed" on webhook events
- Check that `verification_token` matches the value in the developer console
- If using `encrypt_key`, ensure it matches the console setting exactly

### Wrong API region
- If using a Feishu (China) tenant, set `use_feishu = true`
- If using a Lark (international) tenant, ensure `use_feishu = false` (the default)

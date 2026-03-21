---
title: QQ
description: Connect PRX to QQ instant messaging via the Bot API
---

# QQ

> Connect PRX to QQ using the official Bot API with support for private messages, group chats, guilds, and media attachments.

## Prerequisites

- A QQ account (personal or enterprise)
- A bot application registered on the [QQ Open Platform](https://q.qq.com/)
- An App ID and App Secret from the developer console
- The bot must be approved and published (sandbox mode available for testing)

## Quick Setup

### 1. Create a QQ Bot

1. Go to the [QQ Open Platform](https://q.qq.com/) and sign in with your QQ account
2. Navigate to "Applications" and create a new bot application
3. Fill in the bot name, description, and avatar
4. Under "Development Settings", copy the **App ID** and **App Secret**
5. Configure the bot's intents (message types the bot should receive)
6. For testing, enable sandbox mode which limits the bot to a designated test guild

### 2. Configure

Add the following to your PRX config file:

```toml
[channels_config.qq]
app_id = "102012345"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["user_openid_1", "user_openid_2"]
sandbox = true
```

Set `sandbox = false` once the bot has been approved for production use.

### 3. Verify

```bash
prx channel doctor qq
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `app_id` | `String` | *required* | Application ID from the QQ Open Platform developer console |
| `app_secret` | `String` | *required* | Application secret from the developer console |
| `allowed_users` | `[String]` | `[]` | Allowed user OpenIDs. Empty = pairing mode. `"*"` = allow all |
| `sandbox` | `bool` | `false` | When true, connect to the sandbox gateway for testing |
| `intents` | `[String]` | `["guilds", "guild_messages", "direct_messages"]` | Event intents to subscribe to |
| `stream_mode` | `String` | `"none"` | Streaming mode: `"none"` or `"typing"`. Typing mode sends a typing indicator while generating |
| `interrupt_on_new_message` | `bool` | `false` | When true, a new message from the same sender cancels the in-flight request |
| `mention_only` | `bool` | `false` | When true, only respond to @-mentions in group or guild channels. DMs are always processed |
| `ack_reactions` | `bool` | *inherited* | Override for the global `ack_reactions` setting. Falls back to `[channels_config].ack_reactions` if unset |

## How It Works

PRX connects to the QQ Bot API using a WebSocket-based event stream. The connection lifecycle is:

1. **Authentication** -- PRX obtains an access token using the App ID and App Secret via OAuth2 client credentials
2. **Gateway discovery** -- the bot requests the WebSocket gateway URL from the QQ API
3. **Session establishment** -- a WebSocket connection is opened to the gateway with the access token
4. **Intent subscription** -- the bot declares which event types it wants to receive
5. **Event loop** -- incoming messages are dispatched to the PRX agent loop; replies are sent via the REST API

```
QQ Gateway (WSS) ──► PRX Channel Handler ──► Agent Loop
                                                │
QQ REST API ◄───── Reply with message ◄────────┘
```

## Features

- **Guild and group messaging** -- responds to messages in QQ guilds (channels) and group chats
- **Direct messages** -- handles 1:1 private conversations with users
- **Pairing mode** -- secure one-time code binding when no allowed users are configured
- **Media attachments** -- supports sending and receiving images, files, and rich media cards
- **Markdown responses** -- QQ bots support a subset of Markdown formatting in replies
- **Acknowledgement reactions** -- reacts to incoming messages to confirm receipt when enabled
- **Sandbox mode** -- test the bot in an isolated guild environment before production deployment
- **Automatic token refresh** -- access tokens are refreshed automatically before expiration
- **Cross-platform** -- works on QQ desktop, mobile, and QQ for Linux

## Message Types

The QQ Bot API supports several message content types:

| Type | Direction | Description |
|------|-----------|-------------|
| Text | Send / Receive | Plain text messages, up to 2,048 characters |
| Markdown | Send | Formatted text with QQ's Markdown subset |
| Image | Send / Receive | Image attachments (JPEG, PNG, GIF) |
| File | Receive | File attachments from users |
| Rich embed | Send | Structured card messages with title, description, and thumbnail |
| Ark template | Send | Template-based rich messages using QQ's Ark system |

## Intents

Intents control which events the bot receives. Available intents:

| Intent | Events | Notes |
|--------|--------|-------|
| `guilds` | Guild create, update, delete | Guild metadata changes |
| `guild_members` | Member add, update, remove | Requires elevated permissions |
| `guild_messages` | Messages in guild text channels | Most common intent |
| `guild_message_reactions` | Reaction add/remove in guilds | Emoji reactions |
| `direct_messages` | Private DMs with the bot | Always recommended |
| `group_and_c2c` | Group chats and C2C messages | Requires separate approval |
| `interaction` | Button clicks and interactions | For interactive message components |

## Limitations

- The QQ Bot API is region-restricted; bots are primarily available in mainland China
- Sandbox mode limits the bot to a single test guild with a small number of members
- Production bots require approval from the QQ Open Platform review team
- Group chat and C2C messaging require a separate permission application
- File uploads are limited to 20 MB per attachment
- Message content moderation is enforced by QQ; messages containing prohibited content are silently dropped
- Rate limits apply: approximately 5 messages per second per guild, 2 per second for DMs
- The bot cannot initiate conversations; users or admins must add the bot first

## Troubleshooting

### Bot does not connect to the QQ gateway

- Verify `app_id` and `app_secret` are correct with `prx channel doctor qq`
- If using sandbox mode, ensure `sandbox = true` is set (sandbox and production use different gateways)
- Check that outbound connections to `api.sgroup.qq.com` and the WebSocket gateway are not blocked

### Bot connects but does not receive messages

- Verify that the correct `intents` are configured for your use case
- In guild channels, the bot may need to be granted the "Receive Messages" permission by a guild admin
- Check that the sending user's OpenID is in `allowed_users`, or set `allowed_users = ["*"]`

### Replies are not delivered

- QQ enforces content moderation; check the PRX logs for rejection responses from the API
- Ensure the bot has "Send Messages" permission in the target guild or group
- For DM replies, the user must have messaged the bot first to open the conversation

### Token refresh failures

- The App Secret may have been rotated in the developer console; update the config with the new secret
- Network issues can prevent token refresh; check connectivity to `bots.qq.com`

## Related Pages

- [Channels Overview](./)
- [DingTalk](./dingtalk) -- similar setup for the DingTalk platform
- [Lark](./lark) -- similar setup for Lark / Feishu
- [Security: Pairing](../security/pairing) -- details on one-time bind code pairing

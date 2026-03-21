---
title: QQ
description: Connecter PRX a QQ instant messaging via le Bot API
---

# QQ

> Connecter PRX a QQ en utilisant le official Bot API avec prise en charge de messages prives, discussions de groupe, guilds, and media attachments.

## Prerequis

- A QQ account (personal or enterprise)
- A bot application registered sur le [QQ Open Plateforme](https://q.qq.com/)
- An App ID and App Secret depuis le developer console
- Le bot doit etre approved and published (sandbox mode available for testing)

## Quick Setup

### 1. Create a QQ Bot

1. Go vers le [QQ Open Plateforme](https://q.qq.com/) and sign in with your QQ account
2. Navigate to "Applications" and create un nouveau bot application
3. Fill in le bot name, description, and avatar
4. Under "Development Settings", copy the **App ID** and **App Secret**
5. Configure le bot's intents (message types le bot should receive)
6. For testing, enable sandbox mode which limits le bot vers un designated test guild

### 2. Configure

Add les elements suivants to your PRX config file:

```toml
[channels_config.qq]
app_id = "102012345"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["user_openid_1", "user_openid_2"]
sandbox = true
```

Set `sandbox = false` once le bot a ete approved for production use.

### 3. Verify

```bash
prx channel doctor qq
```

## Configuration Reference

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `app_id` | `String` | *required* | Application ID depuis le QQ Open Plateforme developer console |
| `app_secret` | `String` | *required* | Application secret depuis le developer console |
| `allowed_users` | `[String]` | `[]` | Allowed user OpenIDs. Empty = pairing mode. `"*"` = allow all |
| `sandbox` | `bool` | `false` | When true, connect to le sandbox gateway for testing |
| `intents` | `[String]` | `["guilds", "guild_messages", "direct_messages"]` | Event intents to subscribe to |
| `stream_mode` | `String` | `"none"` | Streaming mode: `"none"` or `"typing"`. Typing mode sends a typing indicator tandis que generating |
| `interrupt_on_new_message` | `bool` | `false` | When true, un nouveau message depuis le same sender cancels the in-flight request |
| `mention_only` | `bool` | `false` | When true, only respond to @-mentions in group or guild channels. DMs are always processed |
| `ack_reactions` | `bool` | *herite* | Override pour le global `ack_reactions` setting. Falls back to `[channels_config].ack_reactions` if unset |

## Fonctionnement

PRX se connecte vers le QQ Bot API using a WebSocket-based event stream. La connexion lifecycle is:

1. **Authentication** -- PRX obtains an access token en utilisant le App ID and App Secret via OAuth2 client credentials
2. **Gateway discovery** -- le bot requests the WebSocket gateway URL depuis le QQ API
3. **Session establishment** -- a WebSocket connection is opened vers le gateway avec le access token
4. **Intent subscription** -- le bot declares which event types it wants to receive
5. **Event loop** -- incoming messages are dispatched vers le PRX boucle de l'agent; replies sont envoyes via the REST API

```
QQ Gateway (WSS) ──► PRX Channel Handler ──► Agent Loop
                                                │
QQ REST API ◄───── Reply with message ◄────────┘
```

## Fonctionnalites

- **Guild and group messaging** -- responds to messages in QQ guilds (channels) and discussions de groupe
- **Direct messages** -- handles 1:1 private conversations with users
- **Pairing mode** -- secure one-time code binding when no allowed users sont configures
- **Media attachments** -- prend en charge l'envoi et la reception images, files, and media enrichis cards
- **Markdown responses** -- QQ bots support a subset of Markdown formatting in replies
- **Acknowledgement reactions** -- reacts to incoming messages to confirm receipt lorsqu'active
- **Sandbox mode** -- test le bot in an isolated guild environment before production deployment
- **Automatic token refresh** -- access tokens are refreshed automatically before expiration
- **Cross-platform** -- works on QQ desktop, mobile, and QQ for Linux

## Message Types

The QQ Bot API supports several message content types:

| Type | Direction | Description |
|------|-----------|-------------|
| Text | Send / Receive | Plain text messages, jusqu'a 2,048 characters |
| Markdown | Send | Formatted text with QQ's Markdown subset |
| Image | Send / Receive | Image attachments (JPEG, PNG, GIF) |
| File | Receive | File attachments from users |
| Rich embed | Send | Structured card messages with title, description, and thumbnail |
| Ark template | Send | Template-based rich messages using QQ's Ark system |

## Intents

Intents control which events le bot receives. Available intents:

| Intent | Events | Nontes |
|--------|--------|-------|
| `guilds` | Guild create, update, delete | Guild metadata changes |
| `guild_members` | Member add, update, remove | Requires elevated permissions |
| `guild_messages` | Messages in guild text channels | Most common intent |
| `guild_message_reactions` | Reaction add/remove in guilds | Emoji reactions |
| `direct_messages` | Private DMs with le bot | Always recommended |
| `group_and_c2c` | Group chats and C2C messages | Requires separate approval |
| `interaction` | Button clicks and interactions | For interactive message components |

## Limiteations

- The QQ Bot API is region-restricted; bots are principalement disponible dans mainland China
- Sandbox mode limits le bot to un seul test guild avec un small number of members
- Production bots require approval depuis le QQ Open Plateforme review team
- Group chat and C2C messaging require un separe permission application
- File uploads are limited to 20 MB per attachment
- Message content moderation is enforced by QQ; messages containing prohibited content are silently dropped
- Rate limits apply: approximately 5 messages per second per guild, 2 per second for DMs
- Le bot ne peut pas initiate conversations; users or admins must add le bot first

## Depannage

### Bot ne fait pas connect vers le QQ gateway

- Verify `app_id` and `app_secret` are correct with `prx channel doctor qq`
- If using sandbox mode, ensure `sandbox = true` is set (sandbox et production use different gateways)
- Verifiez que outbound connections to `api.sgroup.qq.com` and the WebSocket gateway are not blocked

### Bot se connecte but ne fait pas receive messages

- Verifiez que the correct `intents` sont configures for your cas d'utilisation
- In guild channels, le bot may devrez be granted the "Receive Messages" permission par un guild admin
- Verifiez que the sending user's OpenID is in `allowed_users`, or set `allowed_users = ["*"]`

### Replies are not delivered

- QQ applique content moderation; check the PRX logs for rejection responses from l'API
- Ensure le bot has "Send Messages" permission in the target guild or group
- For DM replies, l'utilisateur doit avoir messaged le bot first to open the conversation

### Token refresh failures

- The App Secret may ont ete rotated in the developer console; update the config avec le new secret
- Network issues can prevent token refresh; check connectivity to `bots.qq.com`

## Voir aussi Pages

- [Channels Overview](./)
- [DingTalk](./dingtalk) -- similar setup pour le DingTalk platform
- [Lark](./lark) -- similar setup for Lark / Feishu
- [Security: Pairing](../security/pairing) -- details on one-time bind code pairing

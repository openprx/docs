---
title: Lark / Feishu
description: Connecter PRX a Lark (international) or Feishu (China) IM
---

# Lark / Feishu

> Connecter PRX a Lark (international) or Feishu (China mainland) en utilisant le Open Plateforme API with WebSocket long-connection or HTTP webhook event delivery.

## Prerequis

- A Lark or Feishu tenant (organization)
- An app created in the [Lark Developer Console](https://open.larksuite.com/app) or [Feishu Developer Console](https://open.feishu.cn/app)
- App ID, App Secret, and Verification Token depuis le developer console

## Quick Setup

### 1. Create a Bot App

1. Go vers le developer console and create un nouveau Custom App
2. Under "Credentials", copy the **App ID** and **App Secret**
3. Under "Event Subscriptions", copy the **Verification Token**
4. Add le bot capability and configure permissions:
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

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `app_id` | `String` | *required* | App ID depuis le Lark/Feishu developer console |
| `app_secret` | `String` | *required* | App Secret depuis le developer console |
| `verification_token` | `String` | `null` | Verification token for webhook validation |
| `encrypt_key` | `String` | `null` | Encrypt key for webhook message decryption |
| `allowed_users` | `[String]` | `[]` | Allowed user IDs or union IDs. Empty = deny all. `"*"` = allow all |
| `mention_only` | `bool` | `false` | When true, only respond to @-mentions in groups. DMs are always processed |
| `use_feishu` | `bool` | `false` | When true, use Feishu (CN) API endpoints au lieu de Lark (international) |
| `receive_mode` | `String` | `"websocket"` | Event receive mode: `"websocket"` (default, no public URL needed) or `"webhook"` |
| `port` | `u16` | `null` | HTTP port for webhook mode only. Requis when `receive_mode = "webhook"`, ignored for websocket |

## Fonctionnalites

- **WebSocket long-connection** -- persistent WSS connection for en temps reel events without a public URL (default mode)
- **HTTP webhook mode** -- alternative event delivery via HTTP callbacks for environments that require it
- **Support Lark et Feishu** -- bascule automatiquement API endpoints between Lark (international) and Feishu (China)
- **Acknowledgement reactions** -- reacts to incoming messages with locale-appropriate reactions (zh-CN, zh-TW, en, ja)
- **Messagerie directe et de groupe** -- gere a la fois les conversations privees et les discussions de groupe
- **Tenant access token management** -- automatically obtains and refreshes tenant access tokens
- **Message deduplication** -- empeche double-dispatch of WebSocket messages within a 30-minute window

## Limiteations

- WebSocket mode necessite a stable outbound connection to Lark/Feishu servers
- Webhook mode necessite a publicly accessible HTTPS endpoint
- Le bot doit etre added vers un group before it can receive group messages
- Feishu and Lark use different API domains; ensure `use_feishu` matches your tenant region
- Enterprise app approval peut etre required en fonction de your tenant's admin policies

## Depannage

### Bot ne fait pas receive messages
- In websocket mode, check that outbound connections to `open.larksuite.com` (or `open.feishu.cn`) are allowed
- Verify the app dispose des required `im:message` permissions and a ete approved/published
- Ensure le bot a ete added vers le group or l'utilisateur has started a DM with it

### "Verification failed" on webhook events
- Verifiez que `verification_token` matches la valeur in the developer console
- If using `encrypt_key`, ensure it matches the console setting exactly

### Wrong API region
- If using a Feishu (China) tenant, set `use_feishu = true`
- If using a Lark (international) tenant, ensure `use_feishu = false` (la valeur par defaut)

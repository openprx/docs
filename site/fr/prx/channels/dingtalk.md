---
title: DingTalk
description: Connecter PRX a DingTalk (Alibaba) via Stream Mode
---

# DingTalk

> Connecter PRX a DingTalk en utilisant le Stream Mode WebSocket API for en temps reel bot messaging in the Alibaba workplace platform.

## Prerequis

- A DingTalk organization (enterprise or team)
- A bot application created in the [DingTalk Developer Console](https://open-dev.dingtalk.com/)
- Client ID (AppKey) and Client Secret (AppSecret) depuis le developer console

## Quick Setup

### 1. Create a DingTalk Bot

1. Go vers le [DingTalk Open Plateforme](https://open-dev.dingtalk.com/) and sign in
2. Create un nouveau "Enterprise Internal Application" (or "H5 Micro Application")
3. Add the "Robot" capability to your application
4. Under "Credentials", copy the **Client ID** (AppKey) and **Client Secret** (AppSecret)
5. Enable "Stream Mode" under le bot configuration

### 2. Configure

```toml
[channels_config.dingtalk]
client_id = "dingxxxxxxxxxxxxxxxxxx"
client_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["manager1234"]
```

### 3. Verify

```bash
prx channel doctor dingtalk
```

## Configuration Reference

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `client_id` | `String` | *required* | Client ID (AppKey) depuis le DingTalk developer console |
| `client_secret` | `String` | *required* | Client Secret (AppSecret) depuis le developer console |
| `allowed_users` | `[String]` | `[]` | Allowed DingTalk staff IDs. Empty = deny all. `"*"` = allow all |

## Fonctionnalites

- **Stream Mode WebSocket** -- persistent WebSocket connection to DingTalk's gateway for en temps reel message delivery
- **Non public URL required** -- Stream Mode establishes an outbound connection, no inbound webhook setup needed
- **Private and discussions de groupe** -- gere a la fois 1:1 conversations and group chat messages
- **Session webhooks** -- replies via per-message session webhook URLs fourni par DingTalk
- **Automatic gateway registration** -- registers with DingTalk's gateway to obtain a WebSocket endpoint and ticket
- **Conversation type detection** -- distinguishes between les conversations privees et les discussions de groupe

## Limiteations

- Stream Mode necessite a stable outbound WebSocket connection to DingTalk servers
- Replies use per-message session webhooks, which may expire if not used promptly
- Bot doit etre added vers un group chat by an admin before it can receive group messages
- Les API DingTalk sont principalement documentees en chinois; le support international est limite
- Enterprise admin approval peut etre required to deploy internal applications

## Depannage

### Bot ne fait pas connect to DingTalk
- Verify `client_id` and `client_secret` are correct
- Ensure "Stream Mode" est active in the DingTalk developer console under bot settings
- Verifiez que outbound connections to DingTalk servers are not blocked par un firewall

### Messages are received but replies fail
- Session webhooks are per-message and may expire; ensure replies sont envoyes promptly
- Verifiez que le bot dispose des necessary API permissions in the developer console

### Group messages are not received
- Le bot doit etre explicitly added vers le group by an admin
- Verify the sender's staff ID is in `allowed_users`, or set `allowed_users = ["*"]`

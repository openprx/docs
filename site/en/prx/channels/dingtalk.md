---
title: DingTalk
description: Connect PRX to DingTalk (Alibaba) via Stream Mode
---

# DingTalk

> Connect PRX to DingTalk using the Stream Mode WebSocket API for real-time bot messaging in the Alibaba workplace platform.

## Prerequisites

- A DingTalk organization (enterprise or team)
- A bot application created in the [DingTalk Developer Console](https://open-dev.dingtalk.com/)
- Client ID (AppKey) and Client Secret (AppSecret) from the developer console

## Quick Setup

### 1. Create a DingTalk Bot

1. Go to the [DingTalk Open Platform](https://open-dev.dingtalk.com/) and sign in
2. Create a new "Enterprise Internal Application" (or "H5 Micro Application")
3. Add the "Robot" capability to your application
4. Under "Credentials", copy the **Client ID** (AppKey) and **Client Secret** (AppSecret)
5. Enable "Stream Mode" under the bot configuration

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

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `client_id` | `String` | *required* | Client ID (AppKey) from the DingTalk developer console |
| `client_secret` | `String` | *required* | Client Secret (AppSecret) from the developer console |
| `allowed_users` | `[String]` | `[]` | Allowed DingTalk staff IDs. Empty = deny all. `"*"` = allow all |

## Features

- **Stream Mode WebSocket** -- persistent WebSocket connection to DingTalk's gateway for real-time message delivery
- **No public URL required** -- Stream Mode establishes an outbound connection, no inbound webhook setup needed
- **Private and group chats** -- handles both 1:1 conversations and group chat messages
- **Session webhooks** -- replies via per-message session webhook URLs provided by DingTalk
- **Automatic gateway registration** -- registers with DingTalk's gateway to obtain a WebSocket endpoint and ticket
- **Conversation type detection** -- distinguishes between private chats and group conversations

## Limitations

- Stream Mode requires a stable outbound WebSocket connection to DingTalk servers
- Replies use per-message session webhooks, which may expire if not used promptly
- Bot must be added to a group chat by an admin before it can receive group messages
- DingTalk APIs are primarily documented in Chinese; international support is limited
- Enterprise admin approval may be required to deploy internal applications

## Troubleshooting

### Bot does not connect to DingTalk
- Verify `client_id` and `client_secret` are correct
- Ensure "Stream Mode" is enabled in the DingTalk developer console under bot settings
- Check that outbound connections to DingTalk servers are not blocked by a firewall

### Messages are received but replies fail
- Session webhooks are per-message and may expire; ensure replies are sent promptly
- Check that the bot has the necessary API permissions in the developer console

### Group messages are not received
- The bot must be explicitly added to the group by an admin
- Verify the sender's staff ID is in `allowed_users`, or set `allowed_users = ["*"]`

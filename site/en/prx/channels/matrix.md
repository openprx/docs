---
title: Matrix
description: Connect PRX to Matrix with end-to-end encryption support
---

# Matrix

> Connect PRX to the Matrix network using the Client-Server API with optional end-to-end encryption (E2EE) and room-based messaging.

## Prerequisites

- A Matrix homeserver (e.g., [matrix.org](https://matrix.org), or self-hosted Synapse/Dendrite)
- A bot account on the homeserver with an access token
- The room ID where the bot should listen
- PRX built with the `channel-matrix` feature flag

## Quick Setup

### 1. Create a Bot Account

Create an account on your Matrix homeserver for the bot. You can use Element or the command line:

```bash
# Using curl against the homeserver API
curl -X POST "https://matrix.org/_matrix/client/v3/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "prx-bot", "password": "secure-password", "auth": {"type": "m.login.dummy"}}'
```

### 2. Get an Access Token

```bash
curl -X POST "https://matrix.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type": "m.login.password", "user": "prx-bot", "password": "secure-password"}'
```

### 3. Invite the Bot to a Room

From your Matrix client, invite the bot account to the room where it should operate. Note the room ID (format: `!abc123:matrix.org`).

### 4. Configure

```toml
[channels_config.matrix]
homeserver = "https://matrix.org"
access_token = "syt_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
room_id = "!abc123def456:matrix.org"
allowed_users = ["@alice:matrix.org", "@bob:matrix.org"]
```

### 5. Verify

```bash
prx channel doctor matrix
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `homeserver` | `String` | *required* | Matrix homeserver URL (e.g., `"https://matrix.org"`) |
| `access_token` | `String` | *required* | Matrix access token for the bot account |
| `user_id` | `String` | `null` | Matrix user ID (e.g., `"@bot:matrix.org"`). Used for session restoration |
| `device_id` | `String` | `null` | Matrix device ID. Used for E2EE session continuity |
| `room_id` | `String` | *required* | Room ID to listen in (e.g., `"!abc123:matrix.org"`) |
| `allowed_users` | `[String]` | `[]` | Allowed Matrix user IDs. Empty = deny all. `"*"` = allow all |

## Features

- **End-to-end encryption** -- supports encrypted rooms using matrix-sdk with Vodozemac
- **Room-based messaging** -- listens and responds in a specific Matrix room
- **Message reactions** -- reacts to messages to acknowledge receipt and completion
- **Read receipts** -- sends read receipts for processed messages
- **Session persistence** -- stores crypto sessions locally for E2EE continuity across restarts
- **Homeserver agnostic** -- works with any Matrix homeserver (Synapse, Dendrite, Conduit, etc.)

## Limitations

- Currently listens in a single room (set via `room_id`)
- Requires the `channel-matrix` feature flag at compile time
- E2EE key backup and cross-signing verification are not yet supported
- Large rooms with high message volume may increase resource usage
- The bot must be invited to the room before it can listen

## Troubleshooting

### Bot does not respond in encrypted rooms
- Ensure `user_id` and `device_id` are set for proper E2EE session management
- Delete the local crypto store and restart to re-establish encryption sessions
- Verify the bot account has been verified/trusted by room members

### "Room not found" error
- Confirm the room ID format is correct (`!` prefix, `:homeserver` suffix)
- Ensure the bot has been invited to and has joined the room
- Room aliases (e.g., `#room:matrix.org`) are not supported; use the room ID

### Access token rejected
- Access tokens can expire; generate a fresh one via the login API
- Ensure the token belongs to the correct homeserver

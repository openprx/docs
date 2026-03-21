---
title: IRC
description: Connect PRX to IRC over TLS
---

# IRC

> Connect PRX to Internet Relay Chat (IRC) servers over TLS with support for channels, DMs, and multiple authentication methods.

## Prerequisites

- An IRC server to connect to (e.g., Libera.Chat, OFTC, or a private server)
- A nickname for the bot
- TLS-enabled IRC server (port 6697 is the standard)

## Quick Setup

### 1. Choose a Server and Register a Nickname (optional)

For public networks like Libera.Chat, you may want to register your bot's nickname with NickServ:

```
/msg NickServ REGISTER <password> <email>
```

### 2. Configure

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel"]
allowed_users = ["mynick", "*"]
```

With NickServ authentication:

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel", "#another-channel"]
allowed_users = ["*"]
nickserv_password = "your-nickserv-password"
```

### 3. Verify

```bash
prx channel doctor irc
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `server` | `String` | *required* | IRC server hostname (e.g., `"irc.libera.chat"`) |
| `port` | `u16` | `6697` | IRC server port (6697 for TLS) |
| `nickname` | `String` | *required* | Bot nickname on the IRC network |
| `username` | `String` | *nickname* | IRC username (defaults to the nickname if not set) |
| `channels` | `[String]` | `[]` | IRC channels to join on connect (e.g., `["#channel1", "#channel2"]`) |
| `allowed_users` | `[String]` | `[]` | Allowed nicknames (case-insensitive). Empty = deny all. `"*"` = allow all |
| `server_password` | `String` | `null` | Server password (for bouncers like ZNC) |
| `nickserv_password` | `String` | `null` | NickServ IDENTIFY password for nickname authentication |
| `sasl_password` | `String` | `null` | SASL PLAIN password for IRCv3 authentication |
| `verify_tls` | `bool` | `true` | Verify the server's TLS certificate |

## Features

- **TLS encryption** -- all connections use TLS for security
- **Multiple authentication methods** -- supports server password, NickServ IDENTIFY, and SASL PLAIN (IRCv3)
- **Multi-channel support** -- join and respond in multiple channels simultaneously
- **Channel and DM support** -- handles both channel PRIVMSG and direct messages
- **Plain text output** -- responses are automatically adapted for IRC (no markdown, no code fences)
- **Smart message splitting** -- long messages are split respecting IRC's line length limits
- **Connection keepalive** -- responds to server PING messages and detects dead connections (5-minute read timeout)
- **Monotonic message IDs** -- ensures unique message ordering under burst traffic

## Limitations

- IRC is plain text only; markdown, HTML, and rich formatting are not supported
- Messages are subject to IRC line length limits (typically 512 bytes including protocol overhead)
- No built-in media or file sharing capability
- Connection may drop if the server does not receive a response to PING within the timeout
- Some IRC networks have anti-flood measures that may rate-limit the bot
- Nick changes and reconnection after network splits are handled but may cause brief interruptions

## Troubleshooting

### Cannot connect to IRC server
- Verify the `server` hostname and `port` are correct
- Ensure port 6697 (TLS) is not blocked by a firewall
- If using a self-signed certificate, set `verify_tls = false`

### Bot joins channels but does not respond
- Check that the sender's nickname is in `allowed_users` (case-insensitive matching)
- Set `allowed_users = ["*"]` to allow all users for testing
- Verify the bot has permission to speak in the channel (not muted or banned)

### NickServ authentication fails
- Ensure `nickserv_password` is correct
- The bot nickname must be registered with NickServ before it can identify
- Some networks require SASL authentication instead of NickServ; use `sasl_password` in that case

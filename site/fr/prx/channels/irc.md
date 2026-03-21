---
title: IRC
description: Connecter PRX a IRC over TLS
---

# IRC

> Connecter PRX a Internet Relay Chat (IRC) servers over TLS avec prise en charge de channels, DMs, and multiple authentication methods.

## Prerequis

- An IRC server to connect to (e.g., Libera.Chat, OFTC, ou un private server)
- A nickname for le bot
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

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `server` | `String` | *required* | IRC server hostname (e.g., `"irc.libera.chat"`) |
| `port` | `u16` | `6697` | IRC server port (6697 for TLS) |
| `nickname` | `String` | *required* | Bot nickname sur le IRC network |
| `username` | `String` | *nickname* | IRC username (par defaut the nickname si non defini) |
| `channels` | `[String]` | `[]` | IRC channels to join on connect (e.g., `["#channel1", "#channel2"]`) |
| `allowed_users` | `[String]` | `[]` | Allowed nicknames (case-insensitive). Empty = deny all. `"*"` = allow all |
| `server_password` | `String` | `null` | Server password (for bouncers like ZNC) |
| `nickserv_password` | `String` | `null` | NickServ IDENTIFY password for nickname authentication |
| `sasl_password` | `String` | `null` | SASL PLAIN password for IRCv3 authentication |
| `verify_tls` | `bool` | `true` | Verify le serveur's TLS certificate |

## Fonctionnalites

- **TLS encryption** -- all connections use TLS for security
- **Multiple authentication methods** -- supports server password, NickServ IDENTIFY, and SASL PLAIN (IRCv3)
- **Multi-channel support** -- join and respond in multiple channels simultaneously
- **Support des canaux et des MP** -- gere a la fois channel PRIVMSG and direct messages
- **Plain text output** -- responses sont automatiquement adapted for IRC (no markdown, no code fences)
- **Smart message splitting** -- long messages are split respecting IRC's line length limits
- **Connection keepalive** -- responds to server PING messages and detects dead connections (5-minute read timeout)
- **Monotonic message IDs** -- garantit unique message ordering under burst traffic

## Limiteations

- IRC est en texte brut uniquement; le markdown, le HTML et la mise en forme enrichie ne sont pas pris en charge
- Messages sont soumis a IRC line length limits (typically 512 bytes including protocol overhead)
- Non built-in media or file sharing capability
- Connection may drop if le serveur ne fait pas receive a response to PING within the timeout
- Some IRC networks have anti-flood measures that may rate-limit le bot
- Nick changes and reconnection after network splits are handled but may cause brief interruptions

## Depannage

### Cannot connect to IRC server
- Verify the `server` hostname and `port` are correct
- Ensure port 6697 (TLS) n'est pas bloque par un pare-feu
- If using a self-signed certificate, set `verify_tls = false`

### Bot joins channels but ne fait pas respond
- Verifiez que the sender's nickname is in `allowed_users` (case-insensitive matching)
- Set `allowed_users = ["*"]` to allow all users for testing
- Verify le bot has permission to speak in the channel (not muted or banned)

### NickServ authentication fails
- Ensure `nickserv_password` is correct
- Le bot nickname doit etre registered with NickServ before it can identify
- Some networks require SASL authentication au lieu de NickServ; use `sasl_password` in that case

---
title: Signal
description: Connecter PRX a Signal via signal-cli
---

# Signal

> Connecter PRX a Signal en utilisant le signal-cli daemon's JSON-RPC and SSE API for encrypted messaging in DMs and groups.

## Prerequis

- A phone number registered with Signal
- [signal-cli](https://github.com/AsamK/signal-cli) installed and registered
- signal-cli running in daemon mode with HTTP API enabled

## Quick Setup

### 1. Install and Register signal-cli

```bash
# Install signal-cli (see https://github.com/AsamK/signal-cli for latest)
# Register your phone number
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify <verification-code>
```

### 2. Start the signal-cli Daemon

```bash
signal-cli -u +1234567890 daemon --http localhost:8686
```

### 3. Configure

```toml
[channels_config.signal]
http_url = "http://127.0.0.1:8686"
account = "+1234567890"
allowed_from = ["+1987654321", "*"]
```

### 4. Verify

```bash
prx channel doctor signal
```

## Configuration Reference

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `http_url` | `String` | *required* | Base URL pour le signal-cli HTTP daemon (e.g., `"http://127.0.0.1:8686"`) |
| `account` | `String` | *required* | E.164 phone number of the signal-cli account (e.g., `"+1234567890"`) |
| `group_id` | `String` | `null` | Filter messages by group. `null` = accept all (DMs and groups). `"dm"` = only accept DMs. Specific group ID = only that group |
| `allowed_from` | `[String]` | `[]` | Allowed sender phone numbers in E.164 format. `"*"` = allow all |
| `ignore_attachments` | `bool` | `false` | Skip messages that are attachment-only (no text body) |
| `ignore_stories` | `bool` | `false` | Skip incoming story messages |

## Fonctionnalites

- **End-to-end encryption** -- all messages are encrypted via the Signal Protocol
- **DM and group support** -- handle both direct messages and group conversations
- **SSE event stream** -- listens via Server-Sent Events at `/api/v1/events` for en temps reel delivery
- **JSON-RPC sending** -- sends replies via JSON-RPC at `/api/v1/rpc`
- **Flexible group filtering** -- accept all messages, DMs only, ou un specific group
- **Attachment handling** -- optionally process or skip attachment-only messages

## Limiteations

- Requires signal-cli to be running comme un separate daemon process
- signal-cli doit etre registered and verified avec un valid phone number
- One signal-cli instance supports one phone number
- Group message sending necessite the signal-cli account to be a member of the group
- signal-cli is a Java application with its own resource requirements

## Depannage

### Cannot connect to signal-cli
- Verify signal-cli daemon is running: `curl http://127.0.0.1:8686/api/v1/about`
- Check the `http_url` matches le daemon's bind address and port
- Ensure no firewall rules are blocking la connexion

### Messages from groups are ignored
- Check the `group_id` filter -- si defini to `"dm"`, group messages are excluded
- Si defini vers un specific group ID, uniquement messages from that group are accepted
- Set `group_id` to `null` (or omit it) to accept all messages

### Attachment-only messages are skipped
- This is the expected behavior when `ignore_attachments = true`
- Set `ignore_attachments = false` to process attachment-only messages

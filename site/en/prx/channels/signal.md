---
title: Signal
description: Connect PRX to Signal via signal-cli
---

# Signal

> Connect PRX to Signal using the signal-cli daemon's JSON-RPC and SSE API for encrypted messaging in DMs and groups.

## Prerequisites

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

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `http_url` | `String` | *required* | Base URL for the signal-cli HTTP daemon (e.g., `"http://127.0.0.1:8686"`) |
| `account` | `String` | *required* | E.164 phone number of the signal-cli account (e.g., `"+1234567890"`) |
| `group_id` | `String` | `null` | Filter messages by group. `null` = accept all (DMs and groups). `"dm"` = only accept DMs. Specific group ID = only that group |
| `allowed_from` | `[String]` | `[]` | Allowed sender phone numbers in E.164 format. `"*"` = allow all |
| `ignore_attachments` | `bool` | `false` | Skip messages that are attachment-only (no text body) |
| `ignore_stories` | `bool` | `false` | Skip incoming story messages |

## Features

- **End-to-end encryption** -- all messages are encrypted via the Signal Protocol
- **DM and group support** -- handle both direct messages and group conversations
- **SSE event stream** -- listens via Server-Sent Events at `/api/v1/events` for real-time delivery
- **JSON-RPC sending** -- sends replies via JSON-RPC at `/api/v1/rpc`
- **Flexible group filtering** -- accept all messages, DMs only, or a specific group
- **Attachment handling** -- optionally process or skip attachment-only messages

## Limitations

- Requires signal-cli to be running as a separate daemon process
- signal-cli must be registered and verified with a valid phone number
- One signal-cli instance supports one phone number
- Group message sending requires the signal-cli account to be a member of the group
- signal-cli is a Java application with its own resource requirements

## Troubleshooting

### Cannot connect to signal-cli
- Verify signal-cli daemon is running: `curl http://127.0.0.1:8686/api/v1/about`
- Check the `http_url` matches the daemon's bind address and port
- Ensure no firewall rules are blocking the connection

### Messages from groups are ignored
- Check the `group_id` filter -- if set to `"dm"`, group messages are excluded
- If set to a specific group ID, only messages from that group are accepted
- Set `group_id` to `null` (or omit it) to accept all messages

### Attachment-only messages are skipped
- This is the expected behavior when `ignore_attachments = true`
- Set `ignore_attachments = false` to process attachment-only messages

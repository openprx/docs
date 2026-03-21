---
title: WhatsApp Web
description: Connect PRX to WhatsApp via native Web client (wa-rs)
---

# WhatsApp Web

> Connect PRX to WhatsApp using a native Rust Web client (wa-rs) with end-to-end encryption, QR code or pair code linking, and full media support.

## Prerequisites

- A WhatsApp account with an active phone number
- PRX built with the `whatsapp-web` feature flag
- No Meta Business API account required

## Quick Setup

### 1. Enable the Feature Flag

Build PRX with WhatsApp Web support:

```bash
cargo build --release --features whatsapp-web
```

### 2. Configure

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
allowed_numbers = ["+1234567890", "*"]
```

For pair code linking (instead of QR code):

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
pair_phone = "15551234567"
allowed_numbers = ["*"]
```

### 3. Link Your Account

Start PRX. On first run, it will display either:
- A **QR code** in the terminal to scan with your WhatsApp mobile app, or
- A **pair code** if `pair_phone` is set (enter the code in WhatsApp > Linked Devices)

### 4. Verify

```bash
prx channel doctor whatsapp
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `session_path` | `String` | *required* | Path to the session SQLite database. Presence of this field selects Web mode |
| `pair_phone` | `String` | `null` | Phone number for pair code linking (format: country code + number, e.g., `"15551234567"`). If unset, QR code pairing is used |
| `pair_code` | `String` | `null` | Custom pair code for linking. Leave empty to let WhatsApp generate one |
| `allowed_numbers` | `[String]` | `[]` | Allowed phone numbers in E.164 format (e.g., `"+1234567890"`). `"*"` = allow all |

## Features

- **No Meta Business API required** -- connects directly as a linked device using the WhatsApp Web protocol
- **End-to-end encryption** -- messages are encrypted via Signal Protocol, same as the official WhatsApp clients
- **QR code and pair code linking** -- two ways to link your WhatsApp account
- **Persistent sessions** -- session state stored in a local SQLite database, survives restarts
- **Groups and DMs** -- supports both private chats and group conversations
- **Media messages** -- handles images, documents, and other media types
- **Voice note support** -- transcribes incoming voice notes (when STT is configured) and optionally replies with voice notes (when TTS is configured)
- **Presence and reactions** -- supports typing indicators and message reactions

## Limitations

- Requires the `whatsapp-web` feature flag at compile time
- Only one linked device session is supported per phone number (WhatsApp limitation)
- Session may expire if not used for an extended period; re-linking is required
- macOS, Linux, and Windows WSL2 only (same as PRX itself)
- WhatsApp may occasionally require re-authentication

## Troubleshooting

### QR code does not appear
- Ensure `session_path` is set and the directory is writable
- Check that PRX was built with `--features whatsapp-web`
- Remove the session database and restart to force a fresh pairing

### Session expired or disconnected
- Delete the session database at the configured `session_path`
- Restart PRX to trigger a new QR code or pair code flow

### Voice notes are not transcribed
- Configure the `[transcription]` section in your PRX config to enable STT
- Supported STT backends: OpenAI Whisper, Deepgram, AssemblyAI, Google STT

::: tip Cloud API Mode
If you have a Meta Business account and prefer webhook-based messaging, see [WhatsApp (Cloud API)](./whatsapp).
:::

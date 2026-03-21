---
title: WhatsApp Web
description: Connecter PRX a WhatsApp via native Web client (wa-rs)
---

# WhatsApp Web

> Connecter PRX a WhatsApp using a native Rust Web client (wa-rs) with de bout en bout encryption, QR code or pair code linking, and full media support.

## Prerequis

- A WhatsApp account avec unn active phone number
- PRX built avec le `whatsapp-web` feature flag
- Non Meta Business API account required

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

For pair code linking (au lieu de QR code):

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

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `session_path` | `String` | *required* | Path vers le session SQLite database. Presence of ce champ selects Web mode |
| `pair_phone` | `String` | `null` | Phone number for pair code linking (format: country code + number, e.g., `"15551234567"`). If unset, appairage par code QR is used |
| `pair_code` | `String` | `null` | Custom pair code for linking. Leave empty to let WhatsApp generate one |
| `allowed_numbers` | `[String]` | `[]` | Allowed phone numbers in E.164 format (e.g., `"+1234567890"`). `"*"` = allow all |

## Fonctionnalites

- **Non Meta Business API required** -- se connecte directly comme un linked device en utilisant le WhatsApp Web protocol
- **End-to-end encryption** -- messages are encrypted via Signal Protocol, same comme le official WhatsApp clients
- **QR code and pair code linking** -- two ways to link your WhatsApp account
- **Persistent sessions** -- session state stocke dans a local SQLite database, survives restarts
- **Groups and DMs** -- prend en charge les deux les conversations privees et les discussions de groupe
- **Media messages** -- handles images, documents, and other media types
- **Voice note support** -- transcrit les notes vocales entrantes (lorsque la STT est configuree) et optionnellement replies with voice notes (when TTS is configured)
- **Presence and reactions** -- supports typing indicators and message reactions

## Limiteations

- Requires the `whatsapp-web` feature flag a la compilation
- Only one linked device session est pris en charge per phone number (WhatsApp limitation)
- Session may expire if not used for an extended period; re-linking est requis
- macOS, Linux, and Windows WSL2 only (same as PRX itself)
- WhatsApp may occasionally require re-authentication

## Depannage

### QR code ne fait pcomme unppear
- Ensure `session_path` is set and the directory is writable
- Verifiez que PRX was built with `--features whatsapp-web`
- Remove the session database and restart to force un nouveau pairing

### Session expired or disconnected
- Delete the session database au configured `session_path`
- Restart PRX to trigger un nouveau QR code or pair code flow

### Voice notes are not transcribed
- Configure the `[transcription]` section in your PRX config pour activer STT
- Supported STT backends: OpenAI Whisper, Deepgram, AssemblyAI, Google STT

::: tip Cloud API Mode
Si vous have a Meta Business account and prefer webhook-based messaging, see [WhatsApp (Cloud API)](./whatsapp).
:::

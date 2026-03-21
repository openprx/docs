---
title: iMessage
description: Connect PRX to iMessage on macOS
---

# iMessage

> Connect PRX to iMessage using the macOS Messages database and AppleScript bridge for native iMessage integration.

## Prerequisites

- **macOS only** -- iMessage integration requires macOS (Monterey 12.0 or later recommended)
- An active iMessage account signed into the Messages app
- Full Disk Access granted to the PRX process (for reading the Messages database)

## Quick Setup

### 1. Grant Full Disk Access

1. Open **System Settings > Privacy & Security > Full Disk Access**
2. Add the terminal application or PRX binary to the list
3. Restart the terminal or PRX process

### 2. Configure

```toml
[channels_config.imessage]
allowed_contacts = ["+1234567890", "user@icloud.com"]
```

### 3. Verify

```bash
prx channel doctor imessage
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `allowed_contacts` | `[String]` | *required* | Allowed iMessage contacts: phone numbers (E.164) or email addresses. Empty = deny all |

## Features

- **Native macOS integration** -- reads directly from the Messages SQLite database
- **AppleScript bridge** -- sends replies via `osascript` for reliable message delivery
- **Phone and email contacts** -- filter by phone numbers or Apple ID email addresses
- **Modern macOS support** -- handles `attributedBody` typedstream format used in macOS Ventura and later
- **Polling-based** -- periodically checks the Messages database for new messages

## Limitations

- **macOS only** -- not available on Linux or Windows
- Requires Full Disk Access for reading `~/Library/Messages/chat.db`
- The Messages app must be running (or at least signed in)
- Cannot initiate conversations with new contacts; the contact must have an existing conversation
- Group iMessage chats are not currently supported
- Polling interval introduces slight latency compared to push-based channels
- AppleScript-based sending may not work in headless (SSH-only) macOS environments

## Troubleshooting

### "Permission denied" reading Messages database
- Ensure Full Disk Access is granted to the PRX process or its parent terminal
- On macOS Ventura+, verify under **System Settings > Privacy & Security > Full Disk Access**
- Restart the terminal after granting permissions

### Messages are not detected
- Verify the Messages app is signed in with your Apple ID
- Check that the contact is in `allowed_contacts` (phone number in E.164 format or email)
- New messages may take a polling cycle to be detected

### Replies are not sent
- Ensure the Messages app is running (not just signed in)
- AppleScript sending requires GUI access; SSH-only sessions may fail
- Check macOS Console.app for AppleScript errors

---
title: Email
description: Connect PRX to email via IMAP and SMTP
---

# Email

> Connect PRX to any email provider using IMAP for receiving and SMTP for sending, with IDLE push support for real-time delivery.

## Prerequisites

- An email account with IMAP and SMTP access enabled
- IMAP/SMTP server hostnames and ports
- Email credentials (username and password or app-specific password)

## Quick Setup

### 1. Enable IMAP Access

For most email providers:
- **Gmail**: Enable IMAP in Gmail Settings > Forwarding and POP/IMAP, then generate an [App Password](https://myaccount.google.com/apppasswords)
- **Outlook**: IMAP is enabled by default; use an app password if 2FA is active
- **Self-hosted**: Ensure your mail server has IMAP enabled

### 2. Configure

```toml
[channels_config.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 465
username = "your-bot@gmail.com"
password = "your-app-password"
from_address = "your-bot@gmail.com"
allowed_senders = ["trusted-user@example.com"]
```

### 3. Verify

```bash
prx channel doctor email
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `imap_host` | `String` | *required* | IMAP server hostname (e.g., `"imap.gmail.com"`) |
| `imap_port` | `u16` | `993` | IMAP server port (993 for TLS) |
| `imap_folder` | `String` | `"INBOX"` | IMAP folder to poll for new messages |
| `smtp_host` | `String` | *required* | SMTP server hostname (e.g., `"smtp.gmail.com"`) |
| `smtp_port` | `u16` | `465` | SMTP server port (465 for implicit TLS, 587 for STARTTLS) |
| `smtp_tls` | `bool` | `true` | Use TLS for SMTP connections |
| `username` | `String` | *required* | Email username for IMAP/SMTP authentication |
| `password` | `String` | *required* | Email password or app-specific password |
| `from_address` | `String` | *required* | From address for outgoing emails |
| `idle_timeout_secs` | `u64` | `1740` | IDLE timeout in seconds before reconnecting (default: 29 minutes per RFC 2177) |
| `allowed_senders` | `[String]` | `[]` | Allowed sender addresses or domains. Empty = deny all. `"*"` = allow all |
| `default_subject` | `String` | `"PRX Message"` | Default subject line for outgoing emails |

## Features

- **IMAP IDLE** -- real-time push notifications for new emails (RFC 2177), no polling delay
- **TLS encryption** -- connections to IMAP and SMTP servers are encrypted via TLS
- **MIME parsing** -- handles multipart emails, extracts text content and attachments
- **Domain-level filtering** -- allow entire domains (e.g., `"@company.com"`) in the sender allowlist
- **Automatic reconnection** -- re-establishes IDLE connection after the 29-minute timeout
- **Reply threading** -- responds to the original email thread with proper `In-Reply-To` headers

## Limitations

- Only processes emails in the configured IMAP folder (default: INBOX)
- HTML emails are processed as plain text (HTML tags are stripped)
- Large attachments may not be fully processed depending on memory constraints
- Some email providers require app-specific passwords when 2FA is enabled
- IDLE support depends on the IMAP server; most modern servers support it

## Troubleshooting

### Cannot connect to IMAP server
- Verify `imap_host` and `imap_port` are correct for your provider
- Ensure IMAP access is enabled in your email account settings
- If using Gmail, generate an App Password (regular passwords are blocked with 2FA)
- Check that TLS is not being blocked by a firewall

### Emails are not detected
- Verify the `imap_folder` is correct (default: `"INBOX"`)
- Check that the sender's address or domain is in `allowed_senders`
- Some providers may have a delay before emails appear in IMAP

### Replies are not sent
- Verify `smtp_host`, `smtp_port`, and `smtp_tls` settings match your provider
- Check SMTP authentication credentials (same `username`/`password` as IMAP, or separate SMTP credentials)
- Review server logs for SMTP rejection reasons (e.g., SPF/DKIM failures)

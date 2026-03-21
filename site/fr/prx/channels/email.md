---
title: Email
description: Connecter PRX a email via IMAP and SMTP
---

# Email

> Connecter PRX a n'importe quel fournisseur email en utilisant IMAP pour la reception et SMTP pour l'envoi, with IDLE push support for en temps reel delivery.

## Prerequis

- An email account with IMAP and SMTP access enabled
- IMAP/SMTP server hostnames and ports
- Email credentials (username and password or app-specific password)

## Quick Setup

### 1. Enable IMAP Access

For most email fournisseurs:
- **Gmail**: Enable IMAP in Gmail Settings > Forwarding and POP/IMAP, then generate an [App Password](https://myaccount.google.com/apppasswords)
- **Outlook**: IMAP est active par defaut; use an app password if 2FA is active
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

| Champ | Type | Defaut | Description |
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
| `idle_timeout_secs` | `u64` | `1740` | IDLE timeout in seconds before reconnecting (par defaut : 29 minutes per RFC 2177) |
| `allowed_senders` | `[String]` | `[]` | Allowed sender addresses or domains. Empty = deny all. `"*"` = allow all |
| `default_subject` | `String` | `"PRX Message"` | Defaut subject line for outgoing emails |

## Fonctionnalites

- **IMAP IDLE** -- en temps reel push notifications for new emails (RFC 2177), no polling delay
- **TLS encryption** -- connections to IMAP and SMTP servers are encrypted via TLS
- **MIME parsing** -- handles multipart emails, extracts text content and attachments
- **Domain-level filtering** -- allow entire domains (e.g., `"@company.com"`) in the sender allowlist
- **Automatic reconnection** -- re-establishes IDLE connection after the 29-minute timeout
- **Reply threading** -- responds vers le original email thread with proper `In-Reply-To` headers

## Limiteations

- Only processes emails in the configured IMAP folder (par defaut : INBOX)
- HTML emails are processed as plain text (HTML tags sont supprimees)
- Large attachments ne peut pas be fully processed en fonction de memory constraints
- Some email fournisseurs require app-specific passwords when 2FA est active
- IDLE support depend de the IMAP server; most modern servers support it

## Depannage

### Cannot connect to IMAP server
- Verify `imap_host` and `imap_port` are correct for your fournisseur
- Ensure IMAP access est active in your email account settings
- Si vous utilisez Gmail, generez un mot de passe d'application (regular passwords sont bloques with 2FA)
- Verifiez que TLS n'est pas bloque par un pare-feu

### Emails are not detected
- Verify the `imap_folder` is correct (par defaut : `"INBOX"`)
- Verifiez que the sender's address or domain is in `allowed_senders`
- Certains fournisseurs peuvent avoir un delai avant que les emails n'apparaissent dans IMAP

### Replies are not sent
- Verify `smtp_host`, `smtp_port`, and `smtp_tls` settings match your fournisseur
- Check SMTP authentication credentials (same `username`/`password` as IMAP, or separate SMTP credentials)
- Review server logs for SMTP rejection reasons (e.g., SPF/DKIM failures)

---
title: Configuration Reference
description: Complete reference for PRX-Email configuration including transport settings, storage options, attachment policies, environment variables, and runtime tuning.
---

# Configuration Reference

This page is the complete reference for all PRX-Email configuration options, environment variables, and runtime settings.

## Transport Configuration

The `EmailTransportConfig` struct configures both IMAP and SMTP connections:

```rust
use prx_email::plugin::{
    EmailTransportConfig, ImapConfig, SmtpConfig, AuthConfig,
    AttachmentPolicy, AttachmentStoreConfig,
};

let config = EmailTransportConfig {
    imap: ImapConfig { /* ... */ },
    smtp: SmtpConfig { /* ... */ },
    attachment_store: Some(AttachmentStoreConfig { /* ... */ }),
    attachment_policy: AttachmentPolicy::default(),
};
```

### IMAP Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `imap.host` | `String` | (required) | IMAP server hostname |
| `imap.port` | `u16` | (required) | IMAP server port (typically 993) |
| `imap.user` | `String` | (required) | IMAP username |
| `imap.auth.password` | `Option<String>` | `None` | Password for LOGIN auth |
| `imap.auth.oauth_token` | `Option<String>` | `None` | OAuth token for XOAUTH2 |

### SMTP Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `smtp.host` | `String` | (required) | SMTP server hostname |
| `smtp.port` | `u16` | (required) | SMTP server port (465 or 587) |
| `smtp.user` | `String` | (required) | SMTP username |
| `smtp.auth.password` | `Option<String>` | `None` | Password for PLAIN/LOGIN |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | OAuth token for XOAUTH2 |

### Validation Rules

- `imap.host` and `smtp.host` must not be empty
- `imap.user` and `smtp.user` must not be empty
- Exactly one of `password` or `oauth_token` must be set for each protocol
- `attachment_policy.max_size_bytes` must be greater than 0
- `attachment_policy.allowed_content_types` must not be empty

## Storage Configuration

### StoreConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enable_wal` | `bool` | `true` | Enable WAL journal mode |
| `busy_timeout_ms` | `u64` | `5000` | SQLite busy timeout in milliseconds |
| `wal_autocheckpoint_pages` | `i64` | `1000` | Pages between automatic checkpoints |
| `synchronous` | `SynchronousMode` | `Normal` | Sync mode: `Full`, `Normal`, or `Off` |

### SQLite Pragmas Applied

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- when enable_wal = true
PRAGMA synchronous = NORMAL;      -- matches synchronous setting
PRAGMA wal_autocheckpoint = 1000; -- matches wal_autocheckpoint_pages
```

## Attachment Policy

### AttachmentPolicy

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_size_bytes` | `usize` | `26,214,400` (25 MiB) | Maximum attachment size |
| `allowed_content_types` | `HashSet<String>` | See below | Allowed MIME types |

### Default Allowed MIME Types

| MIME Type | Description |
|-----------|-------------|
| `application/pdf` | PDF documents |
| `image/jpeg` | JPEG images |
| `image/png` | PNG images |
| `text/plain` | Plain text files |
| `application/zip` | ZIP archives |

### AttachmentStoreConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | (required) | Enable attachment persistence |
| `dir` | `String` | (required) | Root directory for stored attachments |

::: warning Path Safety
Attachment paths are validated against directory traversal attacks. Any path resolving outside the configured `dir` root is rejected, including symlink-based escapes.
:::

## Sync Runner Configuration

### SyncRunnerConfig

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_concurrency` | `usize` | `4` | Maximum jobs per runner tick |
| `base_backoff_seconds` | `i64` | `10` | Initial backoff on failure |
| `max_backoff_seconds` | `i64` | `300` | Maximum backoff (5 minutes) |

## Environment Variables

### OAuth Token Management

| Variable | Description |
|----------|-------------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth access token |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth access token |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP token expiry (Unix seconds) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP token expiry (Unix seconds) |

The default prefix is `PRX_EMAIL`. Use `reload_auth_from_env("PRX_EMAIL")` to load these at runtime.

### WASM Plugin

| Variable | Default | Description |
|----------|---------|-------------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | unset (disabled) | Set to `1` to enable real IMAP/SMTP from WASM context |

## API Limits

| Limit | Value | Description |
|-------|-------|-------------|
| List/search limit minimum | 1 | Minimum `limit` parameter |
| List/search limit maximum | 500 | Maximum `limit` parameter |
| Debug message truncation | 160 chars | Provider debug messages are truncated |
| Message snippet length | 120 chars | Auto-generated message snippets |

## Error Codes

| Code | Description |
|------|-------------|
| `Validation` | Input validation failure (empty fields, out-of-range limits, unknown features) |
| `FeatureDisabled` | Operation blocked by feature flag |
| `Network` | IMAP/SMTP connection or protocol error |
| `Provider` | Email provider rejected the operation |
| `Storage` | SQLite database error |

## Outbox Constants

| Constant | Value | Description |
|----------|-------|-------------|
| Backoff base | 5 seconds | Initial retry backoff |
| Backoff formula | `5 * 2^retries` | Exponential growth |
| Max retries | Unbounded | Capped by backoff growth |
| Idempotency key | `outbox-{id}-{retries}` | Deterministic Message-ID |

## Feature Flags

| Flag | Description | Risk Level |
|------|-------------|------------|
| `inbox_read` | List and get messages | Low |
| `inbox_search` | Search messages by query | Low |
| `email_send` | Send new emails | Medium |
| `email_reply` | Reply to existing emails | Medium |
| `outbox_retry` | Retry failed outbox messages | Low |

## Logging

PRX-Email outputs structured logs to stderr in the format:

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### Security

- OAuth tokens, passwords, and API keys are **never logged**
- Email addresses are redacted in debug logs (e.g., `a***@example.com`)
- Provider debug messages are sanitized: authorization headers are redacted and output is truncated to 160 characters

## Next Steps

- [Installation](../getting-started/installation) -- Set up PRX-Email
- [Account Management](../accounts/) -- Configure accounts and features
- [Troubleshooting](../troubleshooting/) -- Resolve configuration issues

---
title: Account Management
description: Create, configure, and manage email accounts in PRX-Email. Supports multi-account setups with independent IMAP/SMTP configurations.
---

# Account Management

PRX-Email supports multiple email accounts, each with its own IMAP and SMTP configuration, authentication credentials, and feature flags. Accounts are stored in the SQLite database and identified by a unique `account_id`.

## Creating an Account

Use the `EmailRepository` to create a new account:

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### Account Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `i64` | Auto-generated primary key |
| `email` | `String` | Email address (used as IMAP/SMTP user) |
| `display_name` | `Option<String>` | Human-readable name for the account |
| `created_at` | `i64` | Unix timestamp of creation |
| `updated_at` | `i64` | Unix timestamp of last update |

## Retrieving an Account

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email: {}", acct.email);
    println!("Name: {}", acct.display_name.unwrap_or_default());
}
```

## Multi-Account Setup

Each account operates independently with its own:

- **IMAP connection** -- Separate server, port, and credentials
- **SMTP connection** -- Separate server, port, and credentials
- **Folders** -- Synced folder list per account
- **Sync state** -- Cursor tracking per account/folder pair
- **Feature flags** -- Independent feature enablement
- **Outbox** -- Separate send queue with per-message tracking

```rust
// Account 1: Gmail with OAuth
let gmail_id = repo.create_account(&NewAccount {
    email: "alice@gmail.com".to_string(),
    display_name: Some("Alice (Gmail)".to_string()),
    now_ts: now,
})?;

// Account 2: Work email with password
let work_id = repo.create_account(&NewAccount {
    email: "alice@company.com".to_string(),
    display_name: Some("Alice (Work)".to_string()),
    now_ts: now,
})?;
```

## Feature Flags

PRX-Email uses feature flags to control which capabilities are enabled per account. This supports staged rollout of new features.

### Available Feature Flags

| Flag | Description |
|------|-------------|
| `inbox_read` | Allow listing and reading messages |
| `inbox_search` | Allow searching messages |
| `email_send` | Allow sending new emails |
| `email_reply` | Allow replying to emails |
| `outbox_retry` | Allow retrying failed outbox messages |

### Managing Feature Flags

```rust
// Enable a feature for a specific account
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Disable a feature
plugin.set_account_feature(account_id, "email_send", false, now)?;

// Set the global default for all accounts
plugin.set_feature_default("inbox_read", true, now)?;

// Check if a feature is enabled
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
```

### Percentage-Based Rollout

Roll out features to a percentage of accounts:

```rust
// Enable email_send for 50% of accounts
let enabled = plugin.apply_percentage_rollout(
    account_id,
    "email_send",
    50,  // percentage
    now,
)?;
println!("Feature enabled for this account: {}", enabled);
```

The rollout uses `account_id % 100` to deterministically assign accounts to buckets, ensuring consistent behavior across restarts.

## Folder Management

Folders are created automatically during IMAP sync, or you can create them manually:

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### Listing Folders

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## Next Steps

- [IMAP Configuration](./imap) -- Set up IMAP server connections
- [SMTP Configuration](./smtp) -- Configure the SMTP send pipeline
- [OAuth Authentication](./oauth) -- Set up OAuth for Gmail and Outlook

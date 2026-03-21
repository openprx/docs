---
title: Quick Start
description: Set up PRX-Email, create your first account, sync your inbox, and send an email in under 5 minutes.
---

# Quick Start

This guide takes you from zero to a working email setup in under 5 minutes. By the end, you will have PRX-Email configured with an account, inbox synced, and a test email sent.

::: tip Prerequisites
You need Rust 1.85+ installed. See the [Installation Guide](./installation) for build dependencies.
:::

## Step 1: Add PRX-Email to Your Project

Create a new Rust project or add to an existing one:

```bash
cargo new my-email-app
cd my-email-app
```

Add the dependency to `Cargo.toml`:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## Step 2: Initialize the Database

PRX-Email uses SQLite for all persistence. Open a store and run migrations:

```rust
use prx_email::db::{EmailStore, EmailRepository, NewAccount};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Open (or create) a SQLite database file
    let store = EmailStore::open("./email.db")?;

    // Run migrations to create all tables
    store.migrate()?;

    // Create a repository for database operations
    let repo = EmailRepository::new(&store);

    println!("Database initialized successfully.");
    Ok(())
}
```

The database is created with WAL mode, foreign keys enabled, and a 5-second busy timeout by default.

## Step 3: Create an Email Account

```rust
let now = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)?
    .as_secs() as i64;

let account_id = repo.create_account(&NewAccount {
    email: "you@example.com".to_string(),
    display_name: Some("Your Name".to_string()),
    now_ts: now,
})?;

println!("Created account ID: {}", account_id);
```

## Step 4: Configure Transport and Create the Plugin

```rust
use prx_email::plugin::{
    EmailPlugin, EmailTransportConfig, ImapConfig, SmtpConfig,
    AuthConfig, AttachmentPolicy,
};

let config = EmailTransportConfig {
    imap: ImapConfig {
        host: "imap.example.com".to_string(),
        port: 993,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    smtp: SmtpConfig {
        host: "smtp.example.com".to_string(),
        port: 465,
        user: "you@example.com".to_string(),
        auth: AuthConfig {
            password: Some("your-app-password".to_string()),
            oauth_token: None,
        },
    },
    attachment_store: None,
    attachment_policy: AttachmentPolicy::default(),
};

let plugin = EmailPlugin::new_with_config(repo, config);
```

## Step 5: Sync Your Inbox

```rust
use prx_email::plugin::SyncRequest;

let result = plugin.sync(SyncRequest {
    account_id,
    folder: Some("INBOX".to_string()),
    cursor: None,
    now_ts: now,
    max_messages: 50,
});

match result {
    Ok(()) => println!("Inbox synced successfully."),
    Err(e) => eprintln!("Sync failed: {:?}", e),
}
```

## Step 6: List Messages

```rust
use prx_email::plugin::ListMessagesRequest;

let messages = plugin.list(ListMessagesRequest {
    account_id,
    limit: 10,
})?;

for msg in &messages {
    println!(
        "[{}] {} - {}",
        msg.message_id,
        msg.sender.as_deref().unwrap_or("unknown"),
        msg.subject.as_deref().unwrap_or("(no subject)"),
    );
}
```

## Step 7: Send an Email

```rust
use prx_email::plugin::SendEmailRequest;

let response = plugin.send(SendEmailRequest {
    account_id,
    to: "recipient@example.com".to_string(),
    subject: "Hello from PRX-Email".to_string(),
    body_text: "This is a test email sent via PRX-Email.".to_string(),
    now_ts: now,
    attachment: None,
    failure_mode: None,
});

if response.ok {
    let result = response.data.as_ref().unwrap();
    println!("Sent! Outbox ID: {}, Status: {}", result.outbox_id, result.status);
} else {
    let error = response.error.as_ref().unwrap();
    eprintln!("Send failed: {:?} - {}", error.code, error.message);
}
```

## Step 8: Check Metrics

```rust
let metrics = plugin.metrics_snapshot();
println!("Sync attempts: {}", metrics.sync_attempts);
println!("Sync success:  {}", metrics.sync_success);
println!("Sync failures: {}", metrics.sync_failures);
println!("Send failures: {}", metrics.send_failures);
println!("Retry count:   {}", metrics.retry_count);
```

## What You Have Now

After completing these steps, your application has:

| Component | Status |
|-----------|--------|
| SQLite database | Initialized with full schema |
| Email account | Created and configured |
| IMAP sync | Connected and fetching messages |
| SMTP outbox | Ready with atomic send pipeline |
| Metrics | Tracking sync and send operations |

## Common Provider Settings

| Provider | IMAP Host | IMAP Port | SMTP Host | SMTP Port | Auth |
|----------|-----------|-----------|-----------|-----------|------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | App password or OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth (recommended) |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | App password |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | App password |

::: warning Gmail
Gmail requires either an **App Password** (with 2FA enabled) or **OAuth 2.0**. Regular passwords do not work with IMAP/SMTP. See the [OAuth Guide](../accounts/oauth) for setup instructions.
:::

## Next Steps

- [IMAP Configuration](../accounts/imap) -- Advanced IMAP settings and multi-folder sync
- [SMTP Configuration](../accounts/smtp) -- Outbox pipeline, retry logic, and attachment handling
- [OAuth Authentication](../accounts/oauth) -- Set up OAuth for Gmail and Outlook
- [SQLite Storage](../storage/) -- Database tuning and capacity planning

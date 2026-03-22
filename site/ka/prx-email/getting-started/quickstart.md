---
title: სწრაფი დაწყება
description: PRX-Email-ის კონფიგურაცია, პირველი ანგარიშის შექმნა, inbox-ის სინქ და ელ.ფოსტის გაგზავნა 5 წუთში.
---

# სწრაფი დაწყება

ეს სახელმძღვანელო მოგიყვანთ ნულიდან მოქმედ ელ.ფოსტის კონფიგურაციამდე 5 წუთზე ნაკლებ დროში. ბოლოს გექნებათ PRX-Email კონფიგურირებული ანგარიშით, inbox სინქ-ით და ტესტური ელ.ფოსტის გაგზავნით.

::: tip წინაპირობები
Rust 1.85+ ინსტალირებული გჭირდებათ. Build-ის დეპენდენციებისთვის იხილეთ [ინსტალაციის სახელმძღვანელო](./installation).
:::

## ნაბიჯი 1: PRX-Email-ის პროექტში დამატება

შექმენით ახალი Rust პროექტი ან დაამატეთ არსებულს:

```bash
cargo new my-email-app
cd my-email-app
```

დაამატეთ დამოკიდებულება `Cargo.toml`-ში:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## ნაბიჯი 2: მონაცემთა ბაზის ინიციალიზება

PRX-Email SQLite-ს ყველა persistence-ისთვის იყენებს. გახსენით store და გაუშვით migration-ები:

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

მონაცემთა ბაზა ნაგულისხმევად WAL რეჟიმით, foreign key-ების ჩართვითა და 5-წამიანი busy timeout-ით იქმნება.

## ნაბიჯი 3: ელ.ფოსტის ანგარიშის შექმნა

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

## ნაბიჯი 4: ტრანსპორტის კონფიგურაცია და Plugin-ის შექმნა

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

## ნაბიჯი 5: Inbox-ის სინქ

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

## ნაბიჯი 6: შეტყობინებების ჩამოთვლა

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

## ნაბიჯი 7: ელ.ფოსტის გაგზავნა

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

## ნაბიჯი 8: მეტრიკების შემოწმება

```rust
let metrics = plugin.metrics_snapshot();
println!("Sync attempts: {}", metrics.sync_attempts);
println!("Sync success:  {}", metrics.sync_success);
println!("Sync failures: {}", metrics.sync_failures);
println!("Send failures: {}", metrics.send_failures);
println!("Retry count:   {}", metrics.retry_count);
```

## რა გაქვთ ახლა

ამ ნაბიჯების სრულდების შემდეგ, თქვენი აპლიკაცია:

| კომპონენტი | სტატუსი |
|-----------|---------|
| SQLite მონაცემთა ბაზა | ინიციალიზებული სრული სქემით |
| ელ.ფოსტის ანგარიში | შექმნილი და კონფიგურირებული |
| IMAP სინქ | დაკავშირებული და შეტყობინებებს იღებს |
| SMTP outbox | მზადაა ატომური გაგზავნის pipeline-ით |
| მეტრიკები | სინქ-ისა და გაგზავნის ოპერაციების თვალყური |

## გავრცელებული პროვაიდერის პარამეტრები

| პროვაიდერი | IMAP Host | IMAP Port | SMTP Host | SMTP Port | Auth |
|-----------|-----------|-----------|-----------|-----------|------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | App password ან OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth (სასურველია) |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | App password |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | App password |

::: warning Gmail
Gmail-ს სჭირდება **App Password** (2FA ჩართვით) ან **OAuth 2.0**. ჩვეულებრივი პაროლები IMAP/SMTP-ით არ მუშაობს. კონფიგურაციის ინსტრუქციებისთვის იხილეთ [OAuth სახელმძღვანელო](../accounts/oauth).
:::

## შემდეგი ნაბიჯები

- [IMAP კონფიგურაცია](../accounts/imap) -- IMAP-ის გაფართოებული პარამეტრები და მრავალ-საქაღალდიანი სინქ
- [SMTP კონფიგურაცია](../accounts/smtp) -- Outbox pipeline, retry ლოგიკა და დანართების დამუშავება
- [OAuth ავთენტიფიკაცია](../accounts/oauth) -- Gmail-ისა და Outlook-ისთვის OAuth-ის კონფიგურაცია
- [SQLite შენახვა](../storage/) -- მონაცემთა ბაზის tuning და მოცულობის დაგეგმვა

---
title: البدء السريع
description: "إعداد PRX-Email وإنشاء أول حساب ومزامنة صندوق الوارد وإرسال بريد إلكتروني في أقل من 5 دقائق."
---

# البدء السريع

يأخذك هذا الدليل من الصفر إلى إعداد بريد إلكتروني عامل في أقل من 5 دقائق. بنهايته، ستكون قد أعددت PRX-Email مع حساب ومزامنة صندوق الوارد وإرسال بريد إلكتروني اختباري.

::: tip المتطلبات الأساسية
تحتاج إلى Rust 1.85+ مثبتاً. راجع [دليل التثبيت](./installation) لاعتماديات البناء.
:::

## الخطوة 1: إضافة PRX-Email إلى مشروعك

أنشئ مشروع Rust جديداً أو أضفه إلى مشروع موجود:

```bash
cargo new my-email-app
cd my-email-app
```

أضف الاعتمادية إلى `Cargo.toml`:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## الخطوة 2: تهيئة قاعدة البيانات

يستخدم PRX-Email SQLite لجميع الاستمرارية. افتح مخزناً وشغّل الترحيلات:

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

تُنشأ قاعدة البيانات بوضع WAL ومفاتيح خارجية مفعّلة ومهلة انشغال 5 ثوانٍ بشكل افتراضي.

## الخطوة 3: إنشاء حساب بريد إلكتروني

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

## الخطوة 4: إعداد النقل وإنشاء المكوّن

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

## الخطوة 5: مزامنة صندوق الوارد

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

## الخطوة 6: قائمة الرسائل

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

## الخطوة 7: إرسال بريد إلكتروني

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

## الخطوة 8: فحص المقاييس

```rust
let metrics = plugin.metrics_snapshot();
println!("Sync attempts: {}", metrics.sync_attempts);
println!("Sync success:  {}", metrics.sync_success);
println!("Sync failures: {}", metrics.sync_failures);
println!("Send failures: {}", metrics.send_failures);
println!("Retry count:   {}", metrics.retry_count);
```

## ما لديك الآن

بعد إكمال هذه الخطوات، يمتلك تطبيقك:

| المكوّن | الحالة |
|---------|--------|
| قاعدة بيانات SQLite | مهيأة بمخطط كامل |
| حساب بريد إلكتروني | تم إنشاؤه وإعداده |
| مزامنة IMAP | متصلة وتجلب الرسائل |
| صندوق صادر SMTP | جاهز مع خط أنابيب الإرسال الذري |
| المقاييس | تتبع عمليات المزامنة والإرسال |

## إعدادات المزودين الشائعة

| المزوّد | مضيف IMAP | منفذ IMAP | مضيف SMTP | منفذ SMTP | المصادقة |
|---------|----------|---------|----------|---------|---------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | كلمة مرور التطبيق أو OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth (موصى به) |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | كلمة مرور التطبيق |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | كلمة مرور التطبيق |

::: warning Gmail
يتطلب Gmail إما **كلمة مرور التطبيق** (مع تفعيل التحقق الثنائي) أو **OAuth 2.0**. كلمات المرور العادية لا تعمل مع IMAP/SMTP. راجع [دليل OAuth](../accounts/oauth) لتعليمات الإعداد.
:::

## الخطوات التالية

- [إعداد IMAP](../accounts/imap) -- إعدادات IMAP المتقدمة ومزامنة متعددة المجلدات
- [إعداد SMTP](../accounts/smtp) -- خط أنابيب صندوق الصادر ومنطق إعادة المحاولة ومعالجة المرفقات
- [مصادقة OAuth](../accounts/oauth) -- إعداد OAuth لـ Gmail وOutlook
- [تخزين SQLite](../storage/) -- ضبط قاعدة البيانات وتخطيط السعة

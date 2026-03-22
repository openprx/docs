---
title: إدارة الحسابات
description: "إنشاء وإعداد وإدارة حسابات البريد الإلكتروني في PRX-Email. يدعم الإعدادات متعددة الحسابات مع إعدادات IMAP/SMTP مستقلة."
---

# إدارة الحسابات

يدعم PRX-Email حسابات بريد إلكتروني متعددة، كل منها بإعداد IMAP وSMTP الخاص به وبيانات اعتماد المصادقة وعلامات الميزات. تُخزَّن الحسابات في قاعدة بيانات SQLite وتُعرَّف بـ `account_id` فريد.

## إنشاء حساب

استخدم `EmailRepository` لإنشاء حساب جديد:

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### حقول الحساب

| الحقل | النوع | الوصف |
|-------|------|-------|
| `id` | `i64` | مفتاح أساسي مولَّد تلقائياً |
| `email` | `String` | عنوان البريد الإلكتروني (يُستخدم كمستخدم IMAP/SMTP) |
| `display_name` | `Option<String>` | اسم قابل للقراءة البشرية للحساب |
| `created_at` | `i64` | طابع زمني Unix للإنشاء |
| `updated_at` | `i64` | طابع زمني Unix لآخر تحديث |

## استرجاع حساب

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email: {}", acct.email);
    println!("Name: {}", acct.display_name.unwrap_or_default());
}
```

## الإعداد متعدد الحسابات

كل حساب يعمل بشكل مستقل مع:

- **اتصال IMAP** -- خادم ومنفذ وبيانات اعتماد منفصلة
- **اتصال SMTP** -- خادم ومنفذ وبيانات اعتماد منفصلة
- **المجلدات** -- قائمة مجلدات متزامنة لكل حساب
- **حالة المزامنة** -- تتبع المؤشر لكل زوج حساب/مجلد
- **علامات الميزات** -- تفعيل ميزات مستقل
- **صندوق الصادر** -- قائمة إرسال منفصلة مع تتبع لكل رسالة

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

## علامات الميزات

يستخدم PRX-Email علامات الميزات للتحكم في القدرات المفعّلة لكل حساب. هذا يدعم النشر التدريجي للميزات الجديدة.

### علامات الميزات المتاحة

| العلامة | الوصف |
|--------|-------|
| `inbox_read` | السماح بعرض الرسائل وقراءتها |
| `inbox_search` | السماح بالبحث في الرسائل |
| `email_send` | السماح بإرسال رسائل بريد إلكتروني جديدة |
| `email_reply` | السماح بالرد على رسائل البريد الإلكتروني |
| `outbox_retry` | السماح بإعادة محاولة رسائل صندوق الصادر الفاشلة |

### إدارة علامات الميزات

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

### النشر القائم على النسبة المئوية

نشر الميزات لنسبة مئوية من الحسابات:

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

يستخدم النشر `account_id % 100` لتعيين الحسابات للحاويات بشكل حتمي، مما يضمن سلوكاً متسقاً عبر إعادة التشغيل.

## إدارة المجلدات

تُنشأ المجلدات تلقائياً أثناء مزامنة IMAP، أو يمكنك إنشاؤها يدوياً:

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### قائمة المجلدات

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## الخطوات التالية

- [إعداد IMAP](./imap) -- إعداد اتصالات خادم IMAP
- [إعداد SMTP](./smtp) -- إعداد خط أنابيب إرسال SMTP
- [مصادقة OAuth](./oauth) -- إعداد OAuth لـ Gmail وOutlook

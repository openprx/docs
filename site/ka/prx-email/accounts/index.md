---
title: ანგარიშის მართვა
description: PRX-Email-ში ელ.ფოსტის ანგარიშების შექმნა, კონფიგურაცია და მართვა. მხარს უჭერს მრავალ-ანგარიშიან კონფიგურაციებს დამოუკიდებელი IMAP/SMTP კონფიგურაციებით.
---

# ანგარიშის მართვა

PRX-Email მხარს უჭერს მრავალ ელ.ფოსტის ანგარიშს, თითოეული საკუთარი IMAP და SMTP კონფიგურაციით, ავთენტიფიკაციის სერთიფიკატებითა და ფუნქციის ნიშნებით. ანგარიშები SQLite მონაცემთა ბაზაში ინახება და უნიკალური `account_id`-ით იდენტიფიცირდება.

## ანგარიშის შექმნა

გამოიყენეთ `EmailRepository` ახალი ანგარიშის შექმნისთვის:

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### ანგარიშის ველები

| ველი | ტიპი | აღწერა |
|------|------|--------|
| `id` | `i64` | ავტო-გენერირებული primary key |
| `email` | `String` | ელ.ფოსტის მისამართი (IMAP/SMTP მომხმარებლად გამოყენება) |
| `display_name` | `Option<String>` | ადამიანის-წასაკითხი სახელი ანგარიშისთვის |
| `created_at` | `i64` | შექმნის Unix timestamp |
| `updated_at` | `i64` | ბოლო განახლების Unix timestamp |

## ანგარიშის მიღება

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email: {}", acct.email);
    println!("Name: {}", acct.display_name.unwrap_or_default());
}
```

## მრავალ-ანგარიშიანი კონფიგურაცია

ყოველი ანგარიში დამოუკიდებლად მუშაობს საკუთარით:

- **IMAP კავშირი** -- ცალკე სერვერი, პორტი და სერთიფიკატები
- **SMTP კავშირი** -- ცალკე სერვერი, პორტი და სერთიფიკატები
- **საქაღალდეები** -- ანგარიشش-ზე სინქ-ირებული საქაღალდეების სია
- **სინქ სტატუსი** -- Cursor-ის თვალყური ანგარიშ/საქაღალდის წყვილზე
- **ფუნქციის ნიშნები** -- დამოუკიდებელი ფუნქციის ჩართვა
- **Outbox** -- ცალკე გაგზავნის რიგი შეტყობინება-ზე თვალყურით

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

## ფუნქციის ნიშნები

PRX-Email ფუნქციის ნიშნებს იყენებს ანგარიშ-ზე ჩართული შესაძლებლობების კონტროლისთვის. ეს ახალი ფუნქციების ეტაპობრივ rollout-ს უჭერს მხარს.

### ხელმისაწვდომი ფუნქციის ნიშნები

| ნიშანი | აღწერა |
|--------|--------|
| `inbox_read` | შეტყობინებების ჩამოთვლა და წაკითხვა |
| `inbox_search` | შეტყობინებების ძიება |
| `email_send` | ახალი ელ.ფოსტის გაგზავნა |
| `email_reply` | ელ.ფოსტაზე პასუხი |
| `outbox_retry` | ვერ გაგზავნილი outbox შეტყობინებების retry |

### ფუნქციის ნიშნების მართვა

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

### პროცენტ-ზე დაფუძნებული Rollout

ფუნქციების ანგარიშების პროცენტზე rollout:

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

Rollout `account_id % 100`-ს იყენებს ანგარიშების bucket-ებად დეტერმინირებული მინიჭებისთვის, restart-ებში თანმიმდევრული ქცევის უზრუნველსაყოფად.

## საქაღალდის მართვა

საქაღალდეები ავტომატურად იქმნება IMAP სინქ-ის დროს, ან შეგიძლიათ ხელით შექმნათ:

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### საქაღალდეების ჩამოთვლა

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## შემდეგი ნაბიჯები

- [IMAP კონფიგურაცია](./imap) -- IMAP სერვერის კავშირების კონფიგურაცია
- [SMTP კონფიგურაცია](./smtp) -- SMTP გაგზავნის pipeline-ის კონფიგურაცია
- [OAuth ავთენტიფიკაცია](./oauth) -- Gmail-ისა და Outlook-ისთვის OAuth-ის კონფიგურაცია

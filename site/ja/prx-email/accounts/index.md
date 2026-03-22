---
title: アカウント管理
description: "PRX-Emailでメールアカウントを作成、設定、管理します。独立したIMAP/SMTP設定を持つマルチアカウントセットアップをサポートします。"
---

# アカウント管理

PRX-Emailは複数のメールアカウントをサポートします。各アカウントは独自のIMAPとSMTP設定、認証情報、フィーチャーフラグを持ちます。アカウントはSQLiteデータベースに保存され、一意の`account_id`で識別されます。

## アカウントの作成

`EmailRepository`を使用して新しいアカウントを作成します：

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### アカウントフィールド

| フィールド | タイプ | 説明 |
|---------|------|------|
| `id` | `i64` | 自動生成の主キー |
| `email` | `String` | メールアドレス（IMAP/SMTPユーザーとして使用） |
| `display_name` | `Option<String>` | アカウントの人間が読める名前 |
| `created_at` | `i64` | 作成のUnixタイムスタンプ |
| `updated_at` | `i64` | 最終更新のUnixタイムスタンプ |

## アカウントの取得

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email: {}", acct.email);
    println!("Name: {}", acct.display_name.unwrap_or_default());
}
```

## マルチアカウントセットアップ

各アカウントは独立して動作します：

- **IMAP接続** -- 別のサーバー、ポート、認証情報
- **SMTP接続** -- 別のサーバー、ポート、認証情報
- **フォルダ** -- アカウントごとの同期フォルダリスト
- **同期状態** -- アカウント/フォルダのペアごとのカーソル追跡
- **フィーチャーフラグ** -- 独立したフィーチャー有効化
- **アウトボックス** -- メッセージごとの追跡を持つ別の送信キュー

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

## フィーチャーフラグ

PRX-Emailはアカウントごとに有効な機能を制御するためにフィーチャーフラグを使用します。これにより新機能の段階的なロールアウトをサポートします。

### 利用可能なフィーチャーフラグ

| フラグ | 説明 |
|-------|------|
| `inbox_read` | メッセージの一覧表示と読み取りを許可 |
| `inbox_search` | メッセージの検索を許可 |
| `email_send` | 新しいメールの送信を許可 |
| `email_reply` | メールへの返信を許可 |
| `outbox_retry` | 失敗したアウトボックスメッセージのリトライを許可 |

### フィーチャーフラグの管理

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

### パーセンテージベースのロールアウト

アカウントの一定割合にフィーチャーをロールアウトします：

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

ロールアウトは`account_id % 100`を使用してアカウントをバケットに決定論的に割り当て、再起動時でも一貫した動作を保証します。

## フォルダ管理

フォルダはIMAP同期中に自動的に作成されますが、手動で作成することもできます：

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### フォルダの一覧表示

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## 次のステップ

- [IMAP設定](./imap) -- IMAPサーバー接続を設定
- [SMTP設定](./smtp) -- SMTP送信パイプラインを設定
- [OAuth認証](./oauth) -- GmailとOutlookのOAuthを設定

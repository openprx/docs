---
title: クイックスタート
description: "PRX-Emailを設定し、最初のアカウントを作成し、受信トレイを同期し、5分以内にメールを送信します。"
---

# クイックスタート

このガイドでは5分以内にゼロから動作するメールセットアップを構築します。最終的にはPRX-Emailがアカウントで設定され、受信トレイが同期され、テストメールが送信された状態になります。

::: tip 前提条件
Rust 1.85+がインストールされている必要があります。ビルド依存関係については[インストールガイド](./installation)を参照してください。
:::

## ステップ1：PRX-Emailをプロジェクトに追加する

新しいRustプロジェクトを作成するか、既存のプロジェクトに追加します：

```bash
cargo new my-email-app
cd my-email-app
```

`Cargo.toml`に依存関係を追加します：

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## ステップ2：データベースを初期化する

PRX-Emailはすべての永続化にSQLiteを使用します。ストアを開いてマイグレーションを実行します：

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

データベースはデフォルトでWALモード、外部キー有効、5秒のビジータイムアウトで作成されます。

## ステップ3：メールアカウントを作成する

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

## ステップ4：トランスポートを設定してプラグインを作成する

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

## ステップ5：受信トレイを同期する

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

## ステップ6：メッセージを一覧表示する

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

## ステップ7：メールを送信する

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

## ステップ8：メトリクスを確認する

```rust
let metrics = plugin.metrics_snapshot();
println!("Sync attempts: {}", metrics.sync_attempts);
println!("Sync success:  {}", metrics.sync_success);
println!("Sync failures: {}", metrics.sync_failures);
println!("Send failures: {}", metrics.send_failures);
println!("Retry count:   {}", metrics.retry_count);
```

## これで何が得られたか

これらのステップを完了すると、アプリケーションには以下が整っています：

| コンポーネント | 状態 |
|------------|------|
| SQLiteデータベース | 完全なスキーマで初期化済み |
| メールアカウント | 作成・設定済み |
| IMAP同期 | 接続してメッセージを取得中 |
| SMTPアウトボックス | アトミックな送信パイプラインで準備完了 |
| メトリクス | 同期と送信操作を追跡中 |

## 一般的なプロバイダ設定

| プロバイダ | IMAPホスト | IMAPポート | SMTPホスト | SMTPポート | 認証 |
|----------|-----------|----------|-----------|----------|------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | アプリパスワードまたはOAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth（推奨） |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | アプリパスワード |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | アプリパスワード |

::: warning Gmail
GmailはIMAP/SMTPに**アプリパスワード**（2FA有効時）または**OAuth 2.0**が必要です。通常のパスワードはIMAP/SMTPでは動作しません。セットアップ手順については[OAuthガイド](../accounts/oauth)を参照してください。
:::

## 次のステップ

- [IMAP設定](../accounts/imap) -- 高度なIMAP設定とマルチフォルダ同期
- [SMTP設定](../accounts/smtp) -- アウトボックスパイプライン、リトライロジック、添付ファイル処理
- [OAuth認証](../accounts/oauth) -- GmailとOutlookのOAuthを設定
- [SQLiteストレージ](../storage/) -- データベースチューニングと容量計画

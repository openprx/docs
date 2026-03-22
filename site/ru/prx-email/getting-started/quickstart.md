---
title: Быстрый старт
description: Настройте PRX-Email, создайте первый аккаунт, синхронизируйте входящие и отправьте письмо менее чем за 5 минут.
---

# Быстрый старт

Это руководство проведёт вас от нуля до рабочей конфигурации электронной почты менее чем за 5 минут. По завершении у вас будет PRX-Email, настроенный с аккаунтом, синхронизированными входящими и отправленным тестовым письмом.

::: tip Предварительные требования
Вам нужен установленный Rust 1.85+. Зависимости сборки см. в [Руководстве по установке](./installation).
:::

## Шаг 1: Добавьте PRX-Email в проект

Создайте новый Rust-проект или добавьте в существующий:

```bash
cargo new my-email-app
cd my-email-app
```

Добавьте зависимость в `Cargo.toml`:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

## Шаг 2: Инициализируйте базу данных

PRX-Email использует SQLite для всей персистентности. Откройте хранилище и выполните миграции:

```rust
use prx_email::db::{EmailStore, EmailRepository, NewAccount};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Открыть (или создать) файл SQLite-базы данных
    let store = EmailStore::open("./email.db")?;

    // Выполнить миграции для создания всех таблиц
    store.migrate()?;

    // Создать репозиторий для операций с базой данных
    let repo = EmailRepository::new(&store);

    println!("Database initialized successfully.");
    Ok(())
}
```

База данных создаётся с режимом WAL, включёнными внешними ключами и 5-секундным busy timeout по умолчанию.

## Шаг 3: Создайте почтовый аккаунт

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

## Шаг 4: Настройте транспорт и создайте плагин

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

## Шаг 5: Синхронизируйте входящие

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

## Шаг 6: Просмотрите список сообщений

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

## Шаг 7: Отправьте письмо

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

## Шаг 8: Проверьте метрики

```rust
let metrics = plugin.metrics_snapshot();
println!("Sync attempts: {}", metrics.sync_attempts);
println!("Sync success:  {}", metrics.sync_success);
println!("Sync failures: {}", metrics.sync_failures);
println!("Send failures: {}", metrics.send_failures);
println!("Retry count:   {}", metrics.retry_count);
```

## Результат

После выполнения этих шагов ваше приложение имеет:

| Компонент | Статус |
|-----------|--------|
| SQLite-база данных | Инициализирована с полной схемой |
| Почтовый аккаунт | Создан и настроен |
| IMAP-синхронизация | Подключена и получает сообщения |
| SMTP-outbox | Готов с атомарным конвейером отправки |
| Метрики | Отслеживание операций синхронизации и отправки |

## Настройки распространённых провайдеров

| Провайдер | IMAP-хост | IMAP-порт | SMTP-хост | SMTP-порт | Аутентификация |
|-----------|-----------|-----------|-----------|-----------|---------------|
| Gmail | `imap.gmail.com` | 993 | `smtp.gmail.com` | 465 | Пароль приложения или OAuth |
| Outlook | `outlook.office365.com` | 993 | `smtp.office365.com` | 587 | OAuth (рекомендуется) |
| Yahoo | `imap.mail.yahoo.com` | 993 | `smtp.mail.yahoo.com` | 465 | Пароль приложения |
| Fastmail | `imap.fastmail.com` | 993 | `smtp.fastmail.com` | 465 | Пароль приложения |

::: warning Gmail
Gmail требует **Пароль приложения** (при включённой 2FA) или **OAuth 2.0**. Обычные пароли не работают с IMAP/SMTP. Инструкции по настройке см. в [Руководстве по OAuth](../accounts/oauth).
:::

## Следующие шаги

- [Конфигурация IMAP](../accounts/imap) — расширенные настройки IMAP и синхронизация нескольких папок
- [Конфигурация SMTP](../accounts/smtp) — outbox-конвейер, логика повторных попыток и обработка вложений
- [OAuth-аутентификация](../accounts/oauth) — настройка OAuth для Gmail и Outlook
- [SQLite-хранение](../storage/) — настройка базы данных и планирование ёмкости

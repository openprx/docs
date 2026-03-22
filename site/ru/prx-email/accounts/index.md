---
title: Управление аккаунтами
description: Создание, настройка и управление почтовыми аккаунтами в PRX-Email. Поддерживает многоаккаунтные конфигурации с независимыми настройками IMAP/SMTP.
---

# Управление аккаунтами

PRX-Email поддерживает несколько почтовых аккаунтов, каждый со своей конфигурацией IMAP и SMTP, учётными данными аутентификации и флагами функций. Аккаунты хранятся в SQLite-базе данных и идентифицируются уникальным `account_id`.

## Создание аккаунта

Используйте `EmailRepository` для создания нового аккаунта:

```rust
use prx_email::db::{EmailRepository, NewAccount};

let account_id = repo.create_account(&NewAccount {
    email: "alice@example.com".to_string(),
    display_name: Some("Alice".to_string()),
    now_ts: current_timestamp(),
})?;
```

### Поля аккаунта

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | `i64` | Автогенерируемый первичный ключ |
| `email` | `String` | Адрес электронной почты (используется как пользователь IMAP/SMTP) |
| `display_name` | `Option<String>` | Отображаемое имя аккаунта |
| `created_at` | `i64` | Unix-timestamp создания |
| `updated_at` | `i64` | Unix-timestamp последнего обновления |

## Получение аккаунта

```rust
let account = repo.get_account(account_id)?;
if let Some(acct) = account {
    println!("Email: {}", acct.email);
    println!("Name: {}", acct.display_name.unwrap_or_default());
}
```

## Настройка нескольких аккаунтов

Каждый аккаунт работает независимо со своими:

- **IMAP-подключением** — отдельный сервер, порт и учётные данные
- **SMTP-подключением** — отдельный сервер, порт и учётные данные
- **Папками** — синхронизированный список папок на аккаунт
- **Состоянием синхронизации** — отслеживание курсора на пару аккаунт/папка
- **Флагами функций** — независимое включение функций
- **Outbox** — отдельная очередь отправки с отслеживанием каждого сообщения

```rust
// Аккаунт 1: Gmail с OAuth
let gmail_id = repo.create_account(&NewAccount {
    email: "alice@gmail.com".to_string(),
    display_name: Some("Alice (Gmail)".to_string()),
    now_ts: now,
})?;

// Аккаунт 2: Рабочая почта с паролем
let work_id = repo.create_account(&NewAccount {
    email: "alice@company.com".to_string(),
    display_name: Some("Alice (Work)".to_string()),
    now_ts: now,
})?;
```

## Флаги функций

PRX-Email использует флаги функций для контроля того, какие возможности включены для каждого аккаунта. Это поддерживает поэтапное развёртывание новых функций.

### Доступные флаги функций

| Флаг | Описание |
|------|----------|
| `inbox_read` | Разрешить отображение и чтение сообщений |
| `inbox_search` | Разрешить поиск сообщений |
| `email_send` | Разрешить отправку новых писем |
| `email_reply` | Разрешить ответы на письма |
| `outbox_retry` | Разрешить повтор неудачных outbox-сообщений |

### Управление флагами функций

```rust
// Включить функцию для конкретного аккаунта
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Отключить функцию
plugin.set_account_feature(account_id, "email_send", false, now)?;

// Установить глобальное значение по умолчанию для всех аккаунтов
plugin.set_feature_default("inbox_read", true, now)?;

// Проверить, включена ли функция
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
```

### Процентное развёртывание

Развёртывание функций для определённого процента аккаунтов:

```rust
// Включить email_send для 50% аккаунтов
let enabled = plugin.apply_percentage_rollout(
    account_id,
    "email_send",
    50,  // процент
    now,
)?;
println!("Feature enabled for this account: {}", enabled);
```

Развёртывание использует `account_id % 100` для детерминированного распределения аккаунтов по бакетам, обеспечивая согласованное поведение при перезапусках.

## Управление папками

Папки создаются автоматически во время IMAP-синхронизации, или вы можете создать их вручную:

```rust
use prx_email::db::NewFolder;

let folder_id = repo.create_folder(&NewFolder {
    account_id,
    name: "INBOX".to_string(),
    path: "INBOX".to_string(),
    now_ts: now,
})?;
```

### Список папок

```rust
let folders = repo.list_folders(account_id)?;
for folder in &folders {
    println!("{}: {} ({})", folder.id, folder.name, folder.path);
}
```

## Следующие шаги

- [Конфигурация IMAP](./imap) — настройка IMAP-серверных подключений
- [Конфигурация SMTP](./smtp) — настройка SMTP-конвейера отправки
- [OAuth-аутентификация](./oauth) — настройка OAuth для Gmail и Outlook

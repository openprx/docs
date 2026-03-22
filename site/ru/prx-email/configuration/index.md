---
title: Справочник конфигурации
description: Полный справочник по конфигурации PRX-Email, включая настройки транспорта, параметры хранения, политики вложений, переменные окружения и настройку среды выполнения.
---

# Справочник конфигурации

На этой странице представлен полный справочник по всем параметрам конфигурации PRX-Email, переменным окружения и настройкам среды выполнения.

## Конфигурация транспорта

Структура `EmailTransportConfig` настраивает как IMAP-, так и SMTP-подключения:

```rust
use prx_email::plugin::{
    EmailTransportConfig, ImapConfig, SmtpConfig, AuthConfig,
    AttachmentPolicy, AttachmentStoreConfig,
};

let config = EmailTransportConfig {
    imap: ImapConfig { /* ... */ },
    smtp: SmtpConfig { /* ... */ },
    attachment_store: Some(AttachmentStoreConfig { /* ... */ }),
    attachment_policy: AttachmentPolicy::default(),
};
```

### Настройки IMAP

| Поле | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `imap.host` | `String` | (обязательно) | Имя хоста IMAP-сервера |
| `imap.port` | `u16` | (обязательно) | Порт IMAP-сервера (обычно 993) |
| `imap.user` | `String` | (обязательно) | IMAP-пользователь |
| `imap.auth.password` | `Option<String>` | `None` | Пароль для аутентификации LOGIN |
| `imap.auth.oauth_token` | `Option<String>` | `None` | OAuth-токен для XOAUTH2 |

### Настройки SMTP

| Поле | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `smtp.host` | `String` | (обязательно) | Имя хоста SMTP-сервера |
| `smtp.port` | `u16` | (обязательно) | Порт SMTP-сервера (465 или 587) |
| `smtp.user` | `String` | (обязательно) | SMTP-пользователь |
| `smtp.auth.password` | `Option<String>` | `None` | Пароль для PLAIN/LOGIN |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | OAuth-токен для XOAUTH2 |

### Правила валидации

- `imap.host` и `smtp.host` не должны быть пустыми
- `imap.user` и `smtp.user` не должны быть пустыми
- Должно быть установлено ровно одно из `password` или `oauth_token` для каждого протокола
- `attachment_policy.max_size_bytes` должен быть больше 0
- `attachment_policy.allowed_content_types` не должен быть пустым

## Конфигурация хранения

### StoreConfig

| Поле | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `enable_wal` | `bool` | `true` | Включить режим журнала WAL |
| `busy_timeout_ms` | `u64` | `5000` | SQLite busy timeout в миллисекундах |
| `wal_autocheckpoint_pages` | `i64` | `1000` | Страниц между автоматическими чекпойнтами |
| `synchronous` | `SynchronousMode` | `Normal` | Режим синхронности: `Full`, `Normal` или `Off` |

### Применяемые SQLite-прагмы

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- when enable_wal = true
PRAGMA synchronous = NORMAL;      -- matches synchronous setting
PRAGMA wal_autocheckpoint = 1000; -- matches wal_autocheckpoint_pages
```

## Политика вложений

### AttachmentPolicy

| Поле | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `max_size_bytes` | `usize` | `26 214 400` (25 МиБ) | Максимальный размер вложения |
| `allowed_content_types` | `HashSet<String>` | см. ниже | Разрешённые MIME-типы |

### MIME-типы по умолчанию

| MIME-тип | Описание |
|----------|----------|
| `application/pdf` | PDF-документы |
| `image/jpeg` | JPEG-изображения |
| `image/png` | PNG-изображения |
| `text/plain` | Обычные текстовые файлы |
| `application/zip` | ZIP-архивы |

### AttachmentStoreConfig

| Поле | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `enabled` | `bool` | (обязательно) | Включить персистентность вложений |
| `dir` | `String` | (обязательно) | Корневая директория для хранимых вложений |

::: warning Безопасность путей
Пути вложений проверяются на атаки обхода директорий. Любой путь, разрешающийся за пределами настроенного корня `dir`, отклоняется, включая обходы через симлинки.
:::

## Конфигурация sync runner

### SyncRunnerConfig

| Поле | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `max_concurrency` | `usize` | `4` | Максимальное количество задач на тик планировщика |
| `base_backoff_seconds` | `i64` | `10` | Начальный backoff при ошибке |
| `max_backoff_seconds` | `i64` | `300` | Максимальный backoff (5 минут) |

## Переменные окружения

### Управление OAuth-токенами

| Переменная | Описание |
|-----------|----------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth-токен доступа |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth-токен доступа |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | Истечение IMAP-токена (Unix-секунды) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | Истечение SMTP-токена (Unix-секунды) |

Префикс по умолчанию — `PRX_EMAIL`. Используйте `reload_auth_from_env("PRX_EMAIL")` для загрузки во время выполнения.

### WASM-плагин

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | не установлено (отключено) | Установите в `1` для включения реальных IMAP/SMTP из WASM-контекста |

## Лимиты API

| Лимит | Значение | Описание |
|-------|----------|----------|
| Минимум limit для list/search | 1 | Минимальный параметр `limit` |
| Максимум limit для list/search | 500 | Максимальный параметр `limit` |
| Усечение отладочных сообщений | 160 символов | Отладочные сообщения провайдера усекаются |
| Длина сниппета сообщения | 120 символов | Автогенерируемые сниппеты сообщений |

## Коды ошибок

| Код | Описание |
|-----|----------|
| `Validation` | Ошибка валидации ввода (пустые поля, вышедшие за диапазон лимиты, неизвестные функции) |
| `FeatureDisabled` | Операция заблокирована флагом функции |
| `Network` | Ошибка подключения или протокола IMAP/SMTP |
| `Provider` | Провайдер электронной почты отклонил операцию |
| `Storage` | Ошибка SQLite-базы данных |

## Константы outbox

| Константа | Значение | Описание |
|-----------|----------|----------|
| Базовый backoff | 5 секунд | Начальный backoff повтора |
| Формула backoff | `5 * 2^retries` | Экспоненциальный рост |
| Максимум повторов | Неограничен | Ограничен ростом backoff |
| Ключ идемпотентности | `outbox-{id}-{retries}` | Детерминированный Message-ID |

## Флаги функций

| Флаг | Описание | Уровень риска |
|------|----------|--------------|
| `inbox_read` | Список и получение сообщений | Низкий |
| `inbox_search` | Поиск сообщений по запросу | Низкий |
| `email_send` | Отправка новых писем | Средний |
| `email_reply` | Ответ на существующие письма | Средний |
| `outbox_retry` | Повтор неудачных outbox-сообщений | Низкий |

## Логирование

PRX-Email выводит структурированные логи в stderr в формате:

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### Безопасность

- OAuth-токены, пароли и API-ключи **никогда не логируются**
- Адреса электронной почты редактируются в отладочных логах (например, `a***@example.com`)
- Отладочные сообщения провайдера очищаются: заголовки авторизации редактируются, а вывод усекается до 160 символов

## Следующие шаги

- [Установка](../getting-started/installation) — настройка PRX-Email
- [Управление аккаунтами](../accounts/) — настройка аккаунтов и функций
- [Устранение неполадок](../troubleshooting/) — решение проблем конфигурации

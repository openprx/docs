---
title: OAuth-аутентификация
description: Настройка OAuth 2.0 XOAUTH2-аутентификации для PRX-Email с Gmail и Outlook. Управление жизненным циклом токенов, провайдеры обновления и горячая перезагрузка.
---

# OAuth-аутентификация

PRX-Email поддерживает OAuth 2.0-аутентификацию через механизм XOAUTH2 как для IMAP, так и для SMTP. Это обязательно для Outlook/Office 365 и рекомендуется для Gmail. Плагин обеспечивает отслеживание истечения токенов, подключаемые провайдеры обновления и горячую перезагрузку из окружения.

## Принцип работы XOAUTH2

XOAUTH2 заменяет традиционную парольную аутентификацию OAuth-токеном доступа. Клиент отправляет специально отформатированную строку во время IMAP AUTHENTICATE или SMTP AUTH:

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

PRX-Email обрабатывает это автоматически при установленном `auth.oauth_token`.

## Настройка OAuth для Gmail

### 1. Создайте учётные данные Google Cloud

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите Gmail API
4. Создайте OAuth 2.0-учётные данные (тип Desktop application)
5. Запишите **Client ID** и **Client Secret**

### 2. Получите токен доступа

Используйте OAuth playground Google или собственный OAuth-поток для получения токена доступа со следующими скоупами:

- `https://mail.google.com/` (полный доступ IMAP/SMTP)

### 3. Настройте PRX-Email

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Настройка OAuth для Outlook

PRX-Email включает bootstrap-скрипт для Outlook/Office 365 OAuth, обрабатывающий полный поток кода авторизации.

### 1. Зарегистрируйте Azure-приложение

1. Перейдите в [Azure Portal App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Зарегистрируйте новое приложение
3. Установите URI перенаправления (например, `http://localhost:53682/callback`)
4. Запишите **Application (client) ID** и **Directory (tenant) ID**
5. В разделе API Permissions добавьте:
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. Запустите bootstrap-скрипт

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

Скрипт выполнит:
1. Вывод URL авторизации — откройте его в браузере
2. Ожидание вставки URL обратного вызова или кода авторизации
3. Обмен кода на токены доступа и обновления
4. Сохранение токенов в `./outlook_oauth.local.env` с `chmod 600`

### Параметры скрипта

| Флаг | Описание |
|------|----------|
| `--output <file>` | Пользовательский путь вывода (по умолчанию: `./outlook_oauth.local.env`) |
| `--dry-run` | Вывести URL авторизации и выйти |
| `-h`, `--help` | Показать справку по использованию |

### Переменные окружения

| Переменная | Обязательно | Описание |
|-----------|-------------|----------|
| `CLIENT_ID` | Да | Client ID Azure-приложения |
| `TENANT` | Да | ID тенанта, или `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | Да | URI перенаправления, зарегистрированный в Azure-приложении |
| `SCOPE` | Нет | Пользовательские скоупы (по умолчанию: IMAP + SMTP + offline_access) |

::: warning Безопасность
Никогда не коммитьте сгенерированный файл токенов. Добавьте `*.local.env` в `.gitignore`.
:::

### 3. Загрузите токены

После генерации токенов bootstrap-скриптом подключите env-файл и настройте PRX-Email:

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## Управление жизненным циклом токенов

### Отслеживание истечения

PRX-Email отслеживает временные метки истечения OAuth-токенов для каждого протокола (IMAP/SMTP):

```rust
// Установка истечения через окружение
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

Перед каждой операцией плагин проверяет, истекает ли токен в течение 60 секунд. Если да, выполняется попытка обновления.

### Подключаемый провайдер обновления

Реализуйте трейт `OAuthRefreshProvider` для автоматического обновления токенов:

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // Вызовите эндпоинт токена вашего OAuth-провайдера
        // Верните новый токен доступа и опциональное истечение
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

Подключите провайдер при создании плагина:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### Горячая перезагрузка из окружения

Перезагрузка OAuth-токенов во время выполнения без перезапуска:

```rust
// Установить новые токены в окружении
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// Запустить перезагрузку
plugin.reload_auth_from_env("PRX_EMAIL");
```

Метод `reload_auth_from_env` читает переменные окружения с заданным префиксом и обновляет OAuth-токены IMAP/SMTP и временные метки истечения. При загрузке OAuth-токена соответствующий пароль очищается для сохранения инварианта «один из двух».

### Полная перезагрузка конфигурации

Для полной перенастройки транспорта:

```rust
plugin.reload_config(new_transport_config)?;
```

Это валидирует новую конфигурацию и атомарно заменяет всю транспортную конфигурацию.

## Переменные окружения OAuth

| Переменная | Описание |
|-----------|----------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth-токен доступа |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth-токен доступа |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | Истечение IMAP-токена (Unix-секунды) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | Истечение SMTP-токена (Unix-секунды) |

Префикс передаётся в `reload_auth_from_env()`. Для конфигурации PRX-Email по умолчанию используйте `PRX_EMAIL` в качестве префикса.

## Лучшие практики безопасности

1. **Никогда не логируйте токены.** PRX-Email очищает отладочные сообщения и скрывает содержимое, связанное с авторизацией.
2. **Используйте токены обновления.** Токены доступа истекают; всегда реализуйте провайдер обновления для production-использования.
3. **Храните токены безопасно.** Используйте права доступа к файлам (`chmod 600`) и никогда не коммитьте файлы токенов в систему контроля версий.
4. **Регулярно ротируйте токены.** Даже при автоматическом обновлении периодически проверяйте, что токены ротируются.

## Следующие шаги

- [Управление аккаунтами](./index) — управление аккаунтами и флагами функций
- [Справочник конфигурации](../configuration/) — все переменные окружения и настройки
- [Устранение неполадок](../troubleshooting/) — решение проблем, связанных с OAuth

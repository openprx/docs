---
title: Устранение неполадок
description: Решения распространённых проблем PRX-Email, включая ошибки OAuth, сбои синхронизации IMAP, проблемы отправки SMTP, ошибки SQLite и проблемы WASM-плагинов.
---

# Устранение неполадок

На этой странице описаны наиболее распространённые проблемы при работе с PRX-Email, а также их причины и решения.

## Истёкший OAuth-токен

**Симптомы:** Операции завершаются с кодом ошибки `Provider` и сообщением об истёкших токенах.

**Возможные причины:**
- OAuth-токен доступа истёк, и провайдер обновления не настроен
- Переменная окружения `*_OAUTH_EXPIRES_AT` содержит устаревшую временную метку
- Провайдер обновления возвращает ошибки

**Решения:**

1. **Проверьте временные метки истечения токенов:**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# Должны быть Unix-timestamps в будущем
```

2. **Перезагрузите токены из окружения вручную:**

```rust
// Установить свежие токены
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// Перезагрузить
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **Реализуйте провайдер обновления** для автоматического обновления токенов:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **Повторно запустите Outlook bootstrap-скрипт** для получения свежих токенов:

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Email пытается обновить токены за 60 секунд до их истечения. Если ваши токены истекают быстрее интервала синхронизации, убедитесь, что провайдер обновления подключён.
:::

## Сбой синхронизации IMAP

**Симптомы:** `sync()` возвращает ошибку `Network`, или sync runner сообщает о неудачах.

**Возможные причины:**
- Неверное имя хоста или порт IMAP-сервера
- Проблемы сетевого подключения
- Сбой аутентификации (неверный пароль или истёкший OAuth-токен)
- Ограничение скорости IMAP-сервером

**Решения:**

1. **Проверьте подключение к IMAP-серверу:**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **Проверьте конфигурацию транспорта:**

```rust
// Убедиться, что хост и порт корректны
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **Проверьте режим аутентификации:**

```rust
// Должен быть установлен ровно один
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **Проверьте состояние backoff sync runner.** После повторных неудач планировщик применяет экспоненциальный backoff. Временно сбросьте, используя далёкое будущее в качестве `now_ts`:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **Проверьте структурированные логи** для получения детальной информации об ошибке:

```bash
# Искать структурированные логи, связанные с синхронизацией
grep "prx_email.*sync" /path/to/logs
```

## Сбой отправки SMTP

**Симптомы:** `send()` возвращает `ApiResponse` с `ok: false` и ошибкой `Network` или `Provider`.

**Возможные причины:**
- Неверное имя хоста или порт SMTP-сервера
- Сбой аутентификации
- Адрес получателя отклонён провайдером
- Превышение лимитов скорости или квоты отправки

**Решения:**

1. **Проверьте статус outbox:**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **Проверьте конфигурацию SMTP:**

```rust
// Проверить режим аутентификации
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **Проверьте ошибки валидации.** Send API отклоняет:
   - Пустые `to`, `subject` или `body_text`
   - Отключённый флаг функции `email_send`
   - Недействительные адреса электронной почты

4. **Тестируйте с симулированным сбоем** для проверки обработки ошибок:

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... поля ...
    failure_mode: Some(SendFailureMode::Network), // Симулировать сбой
});
```

## Outbox застрял в состоянии "sending"

**Симптомы:** Outbox-записи имеют `status = 'sending'`, но процесс аварийно завершился до финализации.

**Причина:** Процесс завершился после взятия outbox-записи, но до финализации её как `sent` или `failed`.

**Решение:** Вручную восстановите застрявшие записи через SQL:

```sql
-- Определить застрявшие строки (порог: 15 минут)
SELECT id, account_id, updated_at
FROM outbox
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;

-- Восстановить в failed и запланировать повтор
UPDATE outbox
SET status = 'failed',
    last_error = 'recovered_from_stuck_sending',
    next_attempt_at = strftime('%s','now') + 30,
    updated_at = strftime('%s','now')
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;
```

## Вложение отклонено

**Симптомы:** Отправка завершается с "attachment exceeds size limit" или "attachment content type is not allowed".

**Решения:**

1. **Проверьте политику вложений:**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **Проверьте размер файла** — он должен быть в пределах лимита (по умолчанию: 25 МиБ).

3. **Добавьте MIME-тип** в список разрешённых, если он безопасен:

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **Для вложений по пути** убедитесь, что путь к файлу находится в пределах настроенного корня хранилища вложений. Пути с `../` или симлинки, разрешающиеся за пределами корня, отклоняются.

## Ошибка отключённой функции

**Симптомы:** Операции возвращают код ошибки `FeatureDisabled`.

**Причина:** Флаг функции для запрошенной операции не включён для аккаунта.

**Решение:**

```rust
// Проверить текущее состояние
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// Включить функцию
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Или установить глобальное значение по умолчанию
plugin.set_feature_default("email_send", true, now)?;
```

## Ошибки SQLite-базы данных

**Симптомы:** Операции завершаются с кодом ошибки `Storage`.

**Возможные причины:**
- Файл базы данных заблокирован другим процессом
- Диск заполнен
- Файл базы данных повреждён
- Миграции не выполнены

**Решения:**

1. **Выполните миграции:**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **Проверьте заблокированную базу данных.** Одновременно может быть активно только одно подключение с записью. Увеличьте busy timeout:

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 секунд
    ..StoreConfig::default()
};
```

3. **Проверьте место на диске:**

```bash
df -h .
```

4. **Восстановите или пересоздайте** если база данных повреждена:

```bash
# Резервная копия существующей базы данных
cp email.db email.db.bak

# Проверить целостность
sqlite3 email.db "PRAGMA integrity_check;"

# Если повреждена, экспортируйте и импортируйте
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## Проблемы WASM-плагинов

### Ошибка Network Guard

**Симптомы:** WASM-операции с электронной почтой возвращают ошибку `EMAIL_NETWORK_GUARD`.

**Причина:** Переключатель безопасности сети не включён.

**Решение:**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Хост-возможность недоступна

**Симптомы:** Операции возвращают `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

**Причина:** Хост-среда выполнения не предоставляет email-возможность. Это происходит при выполнении за пределами WASM-контекста.

**Решение:** Убедитесь, что PRX-среда настроена для предоставления email host-calls плагину.

## Sync Runner продолжает пропускать задачи

**Симптомы:** Sync runner сообщает `attempted: 0`, хотя задачи настроены.

**Причина:** Все задачи находятся в backoff из-за предыдущих неудач.

**Решения:**

1. **Проверьте состояние backoff неудач**, изучив структурированные логи.

2. **Проверьте сетевую доступность** и аутентификацию IMAP перед повторным запуском.

3. **Сбросьте backoff**, используя далёкую временную метку:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## Высокий процент неудач отправки

**Симптомы:** Метрики показывают высокое количество `send_failures`.

**Решения:**

1. **Изучите структурированные логи**, отфильтрованные по `run_id` и `error_code`:

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **Проверьте режим аутентификации SMTP.** Убедитесь, что установлен ровно один из password или oauth_token.

3. **Проверьте доступность провайдера** перед широким развёртыванием.

4. **Проверьте метрики:**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## Получение помощи

Если ни одно из вышеперечисленных решений не помогает:

1. **Проверьте существующие issues:** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **Создайте новый issue** с:
   - Версией PRX-Email (проверьте `Cargo.toml`)
   - Версией Rust toolchain (`rustc --version`)
   - Соответствующим выводом структурированных логов
   - Шагами воспроизведения

## Следующие шаги

- [Справочник конфигурации](../configuration/) — обзор всех настроек
- [OAuth-аутентификация](../accounts/oauth) — решение проблем, специфичных для OAuth
- [SQLite-хранение](../storage/) — обслуживание и восстановление базы данных

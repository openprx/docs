---
title: Устранение неполадок
description: "Решения распространённых проблем OpenPR-Webhook: 401 ошибки, фильтрация событий, проблемы агентов, сбои туннеля и диагностика."
---

# Устранение неполадок

## Распространённые проблемы

### 401 Unauthorized при POST webhook

**Симптом:** Все webhook-запросы возвращают HTTP 401.

**Причины:**

1. **Отсутствует заголовок подписи.** Запрос должен включать `X-Webhook-Signature` или `X-OpenPR-Signature` в формате `sha256={hex-digest}`.

2. **Неверный секрет.** Дайджест HMAC-SHA256 должен совпадать с одним из секретов в `security.webhook_secrets`. Убедитесь, что отправляющая и принимающая стороны используют одну и ту же строку секрета.

3. **Несоответствие тела.** Подпись вычисляется над сырым телом запроса. Если прокси или middleware изменяет тело (например, перекодирует JSON), подпись не совпадёт.

**Отладка:**

```bash
# Включить debug-логирование
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Временно разрешить неподписанные запросы для тестирования
# (config.toml)
[security]
allow_unsigned = true
```

### Событие игнорируется (not_bot_task)

**Симптом:** Ответ `{"status": "ignored", "reason": "not_bot_task"}`.

**Причина:** Webhook-payload не содержит `bot_context.is_bot_task = true`. OpenPR-Webhook обрабатывает только события, явно помеченные как bot-задачи.

**Исправление:** Убедитесь, что платформа OpenPR настроена на включение bot-контекста в webhook-payload:

```json
{
  "event": "issue.updated",
  "bot_context": {
    "is_bot_task": true,
    "bot_name": "my-agent",
    "bot_agent_type": "cli"
  },
  "data": { ... }
}
```

### Агент не найден

**Симптом:** Ответ `{"status": "no_agent", "bot_name": "..."}`.

**Причина:** Ни один настроенный агент не совпадает с `bot_name` или `bot_agent_type` из payload.

**Исправление:**

1. Убедитесь, что агент настроен с `id` или `name`, совпадающим со значением `bot_name`
2. Убедитесь, что `agent_type` агента совпадает с `bot_agent_type`
3. Сопоставление имён без учёта регистра, но сопоставление `id` точное

### CLI-агент возвращает "disabled"

**Симптом:** CLI-диспетчеризация возвращает `"cli disabled by feature flag or safe mode"`.

**Причины:**

1. `features.cli_enabled` не установлен в `true`
2. Установлена переменная окружения `OPENPR_WEBHOOK_SAFE_MODE`

**Исправление:**

```toml
[features]
cli_enabled = true
```

И проверьте, что безопасный режим не активен:

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Должно быть пустым или не установленным
```

### CLI-исполнитель "not allowed"

**Симптом:** Сообщение об ошибке `"executor not allowed: {name}"`.

**Причина:** Поле `executor` в конфигурации CLI-агента содержит значение, не входящее в белый список.

**Разрешённые исполнители:**
- `codex`
- `claude-code`
- `opencode`

Любое другое значение отклоняется по соображениям безопасности.

### Туннель не подключается

**Симптом:** В логах появляются сообщения `tunnel connect failed: ...` многократно.

**Причины:**

1. **Недействительный URL.** URL туннеля должен начинаться с `wss://` или `ws://`.
2. **Сетевая проблема.** Убедитесь, что управляющий сервер доступен.
3. **Ошибка аутентификации.** Проверьте правильность `tunnel.auth_token`.
4. **Отсутствуют обязательные поля.** И `tunnel.agent_id`, и `tunnel.auth_token` должны быть непустыми.

**Отладка:**

```bash
# Тестирование WebSocket-подключения вручную
# (требует wscat или websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### Туннель постоянно переподключается

**Симптом:** Логи показывают `tunnel disconnected, reconnecting in Ns` в цикле.

**Нормальное поведение:** Туннель автоматически переподключается с экспоненциальным backoff (до `tunnel_reconnect_backoff_max_secs`). Проверьте логи управляющего сервера на причину разрыва.

**Настройка:**

```toml
[tunnel]
reconnect_secs = 3        # Базовый интервал повтора
heartbeat_secs = 20       # Интервал keep-alive

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Макс. backoff
```

### Сбои обратного вызова

**Симптом:** Логи показывают `start callback failed: ...` или `final callback failed: ...`.

**Причины:**

1. **callback_enabled равен false.** Обратные вызовы требуют `features.callback_enabled = true`.
2. **Недействительный callback_url.** Убедитесь, что URL доступен.
3. **Ошибка аутентификации.** Если эндпоинт обратного вызова требует аутентификации, установите `callback_token`.
4. **Таймаут.** Таймаут HTTP по умолчанию 15 секунд. Увеличьте с помощью `runtime.http_timeout_secs`.

### Ошибки выполнения агентов OpenClaw/Custom

**Симптом:** Ответ содержит `exec_error: ...` или `error: ...`.

**Причины:**

1. **Бинарный файл не найден.** Убедитесь, что путь `command` существует и является исполняемым.
2. **Отказано в доступе.** Процесс openpr-webhook должен иметь права на выполнение.
3. **Отсутствуют зависимости.** CLI-инструмент может требовать других программ или библиотек.

**Отладка:**

```bash
# Тестирование команды вручную
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## Диагностический контрольный список

1. **Проверьте работоспособность сервиса:**
   ```bash
   curl http://localhost:9000/health
   # Должен вернуть: ok
   ```

2. **Проверьте загруженные агенты:**
   Посмотрите в журнале запуска `Loaded N agent(s)`.

3. **Включите debug-логирование:**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **Проверьте подпись вручную:**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **Тестирование с неподписанными запросами (только для разработки):**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **Проверьте статус безопасного режима:**
   ```bash
   # При установке tunnel/cli/callback принудительно отключаются
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## Справочник сообщений логов

| Уровень | Сообщение | Значение |
|--------|---------|--------|
| INFO | `Loaded N agent(s)` | Конфигурация успешно загружена |
| INFO | `openpr-webhook listening on ...` | Сервер запущен |
| INFO | `Received webhook event: ...` | Входящее событие разобрано |
| INFO | `Dispatching to agent: ...` | Агент найден, диспетчеризация |
| INFO | `tunnel connected: ...` | WSS-туннель установлен |
| WARN | `Invalid webhook signature` | Верификация подписи не удалась |
| WARN | `No agent for bot_name=...` | Совпадающий агент не найден |
| WARN | `tunnel disconnected, reconnecting` | Соединение туннеля потеряно |
| WARN | `tunnel using insecure ws:// transport` | Не используется TLS |
| ERROR | `tunnel connect failed: ...` | Ошибка WebSocket-соединения |
| ERROR | `openclaw failed: ...` | Команда OpenClaw вернула ненулевой код |

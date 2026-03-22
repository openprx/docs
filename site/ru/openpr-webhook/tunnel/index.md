---
title: WSS-туннель
description: "WSS-туннель OpenPR-Webhook обеспечивает активное WebSocket-соединение с управляющим сервером для диспетчеризации задач по push-модели."
---

# WSS-туннель

WSS-туннель (Phase B) обеспечивает активное WebSocket-соединение от OpenPR-Webhook к управляющему серверу. Вместо ожидания входящих HTTP-webhook, туннель позволяет управляющему серверу напрямую отправлять задачи агенту через постоянное соединение.

Это особенно полезно, когда webhook-сервис работает за NAT или файерволом и не может получать входящие HTTP-запросы.

## Принцип работы

```
Control Plane (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   tunnel client   |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  CLI agent (codex / claude-code / opencode)
```

1. OpenPR-Webhook открывает WebSocket-соединение к URL управляющего сервера
2. Аутентифицируется с помощью Bearer-токена в заголовке `Authorization`
3. Отправляет периодические heartbeat-сообщения для поддержания соединения
4. Получает сообщения `task.dispatch` от управляющего сервера
5. Немедленно подтверждает с `task.ack`
6. Выполняет задачу асинхронно через CLI-агент
7. Отправляет обратно `task.result` при завершении выполнения

## Включение туннеля

Туннель требует **двух** включённых условий:

1. Флаг функции: `features.tunnel_enabled = true`
2. Секция туннеля: `tunnel.enabled = true`

Оба условия должны быть истинными, и `OPENPR_WEBHOOK_SAFE_MODE` не должен быть установлен.

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # Обычно требуется для выполнения задач

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## Формат конверта сообщений

Все сообщения туннеля используют стандартный конверт:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "heartbeat",
  "ts": 1711234567,
  "agent_id": "my-webhook-agent",
  "payload": { "alive": true },
  "sig": "sha256=abc123..."
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | String (UUID) | Уникальный идентификатор сообщения |
| `type` | String | Тип сообщения (см. ниже) |
| `ts` | Integer | Unix-временная метка (секунды) |
| `agent_id` | String | ID отправляющего агента |
| `payload` | Object | Payload, специфичный для типа |
| `sig` | String (опционально) | HMAC-SHA256 подпись конверта |

## Типы сообщений

### Исходящие (агент на управляющий сервер)

| Тип | Когда | Payload |
|-----|------|---------|
| `heartbeat` | Каждые N секунд | `{"alive": true}` |
| `task.ack` | Немедленно при получении задачи | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | После завершения задачи | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | При ошибках протокола | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### Входящие (управляющий сервер на агент)

| Тип | Назначение | Payload |
|-----|-----------|---------|
| `task.dispatch` | Назначение задачи этому агенту | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## Поток диспетчеризации задач

```
Control Plane                    openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack (immediate)
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- run CLI agent
    |                                 |    (async, up to timeout)
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

Поля payload `task.dispatch`:

| Поле | Тип | Описание |
|------|-----|----------|
| `run_id` | String | Уникальный идентификатор запуска (автогенерируется при отсутствии) |
| `issue_id` | String | ID задачи для работы |
| `agent` | String (опционально) | ID целевого агента (откатывается к первому `cli`-агенту) |
| `body` | Object | Полный webhook-payload для передачи диспетчеру |

## HMAC-подпись конверта

При настроенном `tunnel.hmac_secret` все исходящие конверты подписываются:

1. Конверт сериализуется в JSON с `sig` установленным в `null`
2. HMAC-SHA256 вычисляется над байтами JSON с использованием секрета
3. Подпись устанавливается как `sha256={hex}` в поле `sig`

Для входящих сообщений, если `tunnel.require_inbound_sig = true`, любое сообщение без допустимой подписи отклоняется с конвертом `error`.

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## Поведение переподключения

Туннельный клиент автоматически переподключается при разрыве:

- Начальная задержка повтора: `reconnect_secs` (по умолчанию: 3 секунды)
- Backoff: удваивается при каждом последовательном сбое
- Максимальный backoff: `runtime.tunnel_reconnect_backoff_max_secs` (по умолчанию: 60 секунд)
- Сбрасывается до базовой задержки при успешном соединении

## Управление параллелизмом

Выполнение CLI-задач через туннель ограничено `runtime.cli_max_concurrency`:

```toml
[runtime]
cli_max_concurrency = 2  # Разрешить 2 одновременные CLI-задачи (по умолчанию: 1)
```

Задачи, превышающие лимит параллелизма, ожидают семафорного разрешения. Это предотвращает перегрузку машины при быстрой диспетчеризации нескольких задач подряд.

## Справочник конфигурации

| Поле | По умолчанию | Описание |
|------|------------|----------|
| `tunnel.enabled` | `false` | Включить/выключить туннель |
| `tunnel.url` | — | URL WebSocket (`wss://` или `ws://`) |
| `tunnel.agent_id` | `openpr-webhook` | Идентификатор агента |
| `tunnel.auth_token` | — | Bearer-токен для аутентификации |
| `tunnel.reconnect_secs` | `3` | Базовый интервал переподключения |
| `tunnel.heartbeat_secs` | `20` | Интервал heartbeat (минимум 3с) |
| `tunnel.hmac_secret` | — | Секрет подписи HMAC-SHA256 |
| `tunnel.require_inbound_sig` | `false` | Отклонять неподписанные входящие сообщения |

## Примечания по безопасности

- Всегда используйте `wss://` в продакшене. Сервис выводит предупреждение при использовании `ws://`.
- `auth_token` отправляется как HTTP-заголовок при WebSocket-апгрейде; убедитесь, что используется TLS.
- Включите `require_inbound_sig` с `hmac_secret` для предотвращения поддельных диспетчеризаций задач.

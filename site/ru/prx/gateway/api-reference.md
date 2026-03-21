---
title: Справочник API
description: Полный справочник REST API шлюза PRX -- сессии, каналы, хуки, MCP, плагины, навыки, статус, конфигурация и журналы.
---

# Справочник API

На этой странице документированы все эндпоинты REST API, предоставляемые шлюзом PRX. API построен на Axum и использует JSON для тел запросов и ответов. Все эндпоинты имеют префикс `/api/v1`.

## Базовый URL

```
http://127.0.0.1:3120/api/v1
```

Хост и порт настраиваются:

```toml
[gateway]
host = "127.0.0.1"
port = 3120
```

## Аутентификация

Все эндпоинты API требуют bearer-токен, если не указано иное.

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/status
```

Генерация токена:

```bash
prx auth token
```

## Сессии

Управление сессиями агента -- создание, список, просмотр и завершение.

### POST /api/v1/sessions

Создание новой сессии агента.

**Запрос:**

```json
{
  "channel": "api",
  "user_id": "user_123",
  "metadata": {
    "source": "web-app"
  }
}
```

**Ответ (201):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "metadata": {
    "source": "web-app"
  }
}
```

### GET /api/v1/sessions

Список активных сессий.

**Параметры запроса:**

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `status` | `String` | `"active"` | Фильтрация по статусу: `"active"`, `"idle"`, `"terminated"` |
| `channel` | `String` | *все* | Фильтрация по имени канала |
| `limit` | `usize` | `50` | Максимум возвращаемых результатов |
| `offset` | `usize` | `0` | Смещение пагинации |

**Ответ (200):**

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "channel": "api",
      "user_id": "user_123",
      "status": "active",
      "created_at": "2026-03-21T10:00:00Z",
      "last_activity": "2026-03-21T10:15:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/v1/sessions/:id

Получение подробной информации о конкретной сессии.

**Ответ (200):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "last_activity": "2026-03-21T10:15:00Z",
  "turn_count": 12,
  "token_usage": {
    "input": 4500,
    "output": 3200
  },
  "metadata": {
    "source": "web-app"
  }
}
```

### DELETE /api/v1/sessions/:id

Завершение сессии.

**Ответ (204):** Нет содержимого.

## Каналы

Запрос и управление подключениями каналов сообщений.

### GET /api/v1/channels

Список всех настроенных каналов и их статус подключения.

**Ответ (200):**

```json
{
  "channels": [
    {
      "name": "telegram",
      "status": "connected",
      "connected_at": "2026-03-21T08:00:00Z",
      "active_sessions": 3
    },
    {
      "name": "discord",
      "status": "disconnected",
      "error": "Invalid bot token"
    }
  ]
}
```

### POST /api/v1/channels/:name/restart

Перезапуск подключения конкретного канала.

**Ответ (200):**

```json
{
  "name": "telegram",
  "status": "reconnecting"
}
```

### GET /api/v1/channels/:name/health

Проверка здоровья конкретного канала.

**Ответ (200):**

```json
{
  "name": "telegram",
  "healthy": true,
  "latency_ms": 45,
  "last_message_at": "2026-03-21T10:14:55Z"
}
```

## Хуки

Управление эндпоинтами вебхуков для внешних интеграций.

### GET /api/v1/hooks

Список зарегистрированных вебхуков.

**Ответ (200):**

```json
{
  "hooks": [
    {
      "id": "hook_001",
      "url": "https://example.com/webhook",
      "events": ["session.created", "session.terminated"],
      "active": true,
      "created_at": "2026-03-20T12:00:00Z"
    }
  ]
}
```

### POST /api/v1/hooks

Регистрация нового вебхука.

**Запрос:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "secret": "whsec_xxxxxxxxxxx"
}
```

**Ответ (201):**

```json
{
  "id": "hook_002",
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "active": true,
  "created_at": "2026-03-21T10:20:00Z"
}
```

### DELETE /api/v1/hooks/:id

Удаление вебхука.

**Ответ (204):** Нет содержимого.

## MCP

Управление подключениями серверов Model Context Protocol.

### GET /api/v1/mcp

Список подключённых MCP-серверов.

**Ответ (200):**

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "status": "connected",
      "tools": ["read_file", "write_file", "list_directory"],
      "connected_at": "2026-03-21T08:00:00Z"
    }
  ]
}
```

### POST /api/v1/mcp/:name/reconnect

Переподключение к MCP-серверу.

**Ответ (200):**

```json
{
  "name": "filesystem",
  "status": "reconnecting"
}
```

## Плагины

Управление WASM-плагинами.

### GET /api/v1/plugins

Список установленных плагинов и их статус.

**Ответ (200):**

```json
{
  "plugins": [
    {
      "name": "weather",
      "version": "1.2.0",
      "status": "loaded",
      "capabilities": ["tool:get_weather", "tool:get_forecast"],
      "memory_usage_bytes": 2097152
    }
  ]
}
```

### POST /api/v1/plugins/:name/reload

Перезагрузка плагина (выгрузка и повторная загрузка).

**Ответ (200):**

```json
{
  "name": "weather",
  "status": "loaded",
  "version": "1.2.0"
}
```

### POST /api/v1/plugins/:name/disable

Отключение плагина без выгрузки.

**Ответ (200):**

```json
{
  "name": "weather",
  "status": "disabled"
}
```

## Навыки

Запрос зарегистрированных навыков агента.

### GET /api/v1/skills

Список всех доступных навыков.

**Ответ (200):**

```json
{
  "skills": [
    {
      "name": "code_review",
      "source": "builtin",
      "description": "Review code changes and provide feedback",
      "triggers": ["/review", "review this"]
    },
    {
      "name": "summarize",
      "source": "plugin:productivity",
      "description": "Summarize long text or conversations",
      "triggers": ["/summarize", "tldr"]
    }
  ]
}
```

## Статус

Информация о статусе и здоровье системы.

### GET /api/v1/status

Получение общего статуса системы.

**Ответ (200):**

```json
{
  "status": "healthy",
  "version": "0.12.0",
  "uptime_secs": 86400,
  "active_sessions": 5,
  "channels": {
    "connected": 3,
    "total": 4
  },
  "plugins": {
    "loaded": 2,
    "total": 2
  },
  "memory": {
    "backend": "sqlite",
    "entries": 1542
  },
  "provider": {
    "name": "anthropic",
    "model": "claude-sonnet-4-20250514"
  }
}
```

### GET /api/v1/status/health

Облегчённая проверка здоровья (подходит для проб балансировщика нагрузки).

**Ответ (200):**

```json
{
  "healthy": true
}
```

## Конфигурация

Чтение и обновление конфигурации времени выполнения.

### GET /api/v1/config

Получение текущей конфигурации времени выполнения (секреты маскируются).

**Ответ (200):**

```json
{
  "agent": {
    "max_turns": 50,
    "max_tool_calls_per_turn": 10,
    "session_timeout_secs": 3600
  },
  "memory": {
    "backend": "sqlite"
  },
  "channels_config": {
    "telegram": {
      "bot_token": "***REDACTED***",
      "allowed_users": ["123456789"]
    }
  }
}
```

### PATCH /api/v1/config

Обновление значений конфигурации во время выполнения. Изменения применяются через горячую перезагрузку.

**Запрос:**

```json
{
  "agent.max_turns": 100,
  "memory.top_k": 15
}
```

**Ответ (200):**

```json
{
  "updated": ["agent.max_turns", "memory.top_k"],
  "reload_required": false
}
```

Некоторые изменения конфигурации требуют полного перезапуска и не могут быть применены через горячую перезагрузку. Ответ указывает это значением `"reload_required": true`.

## Журналы

Запрос журналов агента и диагностики.

### GET /api/v1/logs

Потоковая передача или запрос недавних записей журнала.

**Параметры запроса:**

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `level` | `String` | `"info"` | Минимальный уровень журнала: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"` |
| `module` | `String` | *все* | Фильтрация по имени модуля (напр., `"agent"`, `"channel::telegram"`) |
| `since` | `String` | *1 час назад* | Временная метка ISO 8601 или длительность (напр., `"1h"`, `"30m"`) |
| `limit` | `usize` | `100` | Максимум возвращаемых записей |
| `stream` | `bool` | `false` | При true возвращает поток Server-Sent Events |

**Ответ (200):**

```json
{
  "entries": [
    {
      "timestamp": "2026-03-21T10:15:30.123Z",
      "level": "info",
      "module": "agent::loop",
      "message": "Tool call completed: shell (45ms)",
      "session_id": "sess_abc123"
    }
  ],
  "total": 1
}
```

### GET /api/v1/logs/stream

Поток Server-Sent Events для отслеживания журналов в реальном времени.

```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/logs/stream?level=info
```

## Ответы об ошибках

Все эндпоинты возвращают ошибки в единообразном формате:

```json
{
  "error": {
    "code": "not_found",
    "message": "Session sess_xyz not found",
    "details": null
  }
}
```

| HTTP-статус | Код ошибки | Описание |
|-------------|-----------|----------|
| 400 | `bad_request` | Некорректные параметры запроса или тело |
| 401 | `unauthorized` | Отсутствующий или недействительный bearer-токен |
| 403 | `forbidden` | У токена нет требуемых разрешений |
| 404 | `not_found` | Ресурс не существует |
| 409 | `conflict` | Конфликт состояния ресурса (напр., сессия уже завершена) |
| 429 | `rate_limited` | Слишком много запросов; повторите через указанное время |
| 500 | `internal_error` | Непредвиденная ошибка сервера |

## Ограничение частоты

API применяет ограничения частоты на токен:

| Группа эндпоинтов | Лимит |
|-------------------|-------|
| Сессии (запись) | 10 запросов/секунду |
| Сессии (чтение) | 50 запросов/секунду |
| Конфигурация (запись) | 5 запросов/секунду |
| Все остальные эндпоинты | 30 запросов/секунду |

Заголовки ограничения частоты включаются во все ответы:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1711015230
```

## Связанные страницы

- [Обзор шлюза](./)
- [HTTP API](./http-api) -- обзор слоя HTTP API
- [WebSocket](./websocket) -- WebSocket API реального времени
- [Вебхуки](./webhooks) -- конфигурация исходящих вебхуков
- [Промежуточное ПО](./middleware) -- конвейер промежуточного ПО запросов/ответов

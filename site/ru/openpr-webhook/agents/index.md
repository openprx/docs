---
title: Типы агентов
description: "Агенты — основные единицы диспетчеризации в OpenPR-Webhook. Поддерживаются 5 типов: openclaw, openprx, webhook, custom и cli."
---

# Типы агентов

Агенты — это основные единицы диспетчеризации в OpenPR-Webhook. Каждый агент определяет, как обрабатывать сопоставленное webhook-событие. В одном развёртывании можно настроить несколько агентов, и события маршрутизируются к соответствующему агенту на основе `bot_context` в webhook-payload.

## Обзор

| Тип | Сценарий использования | Требует флага функции |
|-----|----------------------|---------------------|
| `openclaw` | Отправка уведомлений через Signal/Telegram с помощью OpenClaw CLI | Нет |
| `openprx` | Отправка сообщений через Signal API или CLI OpenPRX | Нет |
| `webhook` | Пересылка событий на HTTP-эндпоинты (Slack, Discord и т.д.) | Нет |
| `custom` | Выполнение произвольных shell-команд | Нет |
| `cli` | Выполнение AI-кодирующих агентов (codex, claude-code, opencode) | Да (`cli_enabled`) |

## Структура конфигурации агента

Каждый агент имеет следующие общие поля:

```toml
[[agents]]
id = "unique-id"              # Уникальный идентификатор, используется для сопоставления
name = "Human-Readable Name"  # Отображаемое имя, также используется для сопоставления
agent_type = "openclaw"       # Один из: openclaw, openprx, webhook, custom, cli
message_template = "..."      # Опционально: пользовательский формат сообщения
```

Затем, в зависимости от `agent_type`, предоставляется блок конфигурации, специфичный для типа:

- `[agents.openclaw]` для агентов openclaw
- `[agents.openprx]` для агентов openprx
- `[agents.webhook]` для агентов webhook
- `[agents.custom]` для пользовательских агентов
- `[agents.cli]` для агентов cli

## Шаблоны сообщений

Поле `message_template` поддерживает заполнители, которые заменяются значениями из webhook-payload:

| Заполнитель | Источник | Пример |
|------------|--------|--------|
| `{event}` | `payload.event` | `issue.updated` |
| `{title}` | `payload.data.issue.title` | `Fix login bug` |
| `{key}` | `payload.data.issue.key` | `PROJ-42` |
| `{issue_id}` | `payload.data.issue.id` | `123` |
| `{reason}` | `payload.bot_context.trigger_reason` | `assigned_to_bot` |
| `{actor}` | `payload.actor.name` | `alice` |
| `{project}` | `payload.project.name` | `backend` |
| `{workspace}` | `payload.workspace.name` | `IM` |
| `{state}` | `payload.data.issue.state` | `in_progress` |
| `{priority}` | `payload.data.issue.priority` | `high` |
| `{url}` | производный | `issue/123` |

Шаблон по умолчанию (для openclaw, openprx, webhook, custom):

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## Логика сопоставления агентов

Когда приходит webhook-событие с `bot_context.is_bot_task = true`:

1. Сервис извлекает `bot_context.bot_name` и `bot_context.bot_agent_type`
2. Ищет агентов, у которых `id` или `name` (без учёта регистра) совпадает с `bot_name`
3. Если нет совпадения по имени, откатывается к первому агенту, чей `agent_type` совпадает с `bot_agent_type`
4. Если ни один агент не совпадает, событие подтверждается, но не диспетчеризируется

## Пример с несколькими агентами

```toml
# Агент 1: Уведомление через Telegram
[[agents]]
id = "notify-tg"
name = "Telegram Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "telegram"
target = "@my-channel"

# Агент 2: Пересылка в Slack
[[agents]]
id = "notify-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"

# Агент 3: AI-кодирующий агент с MCP closed-loop
[[agents]]
id = "coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
skip_callback_state = true  # AI обновляет состояние через MCP напрямую

[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
```

В этой конфигурации OpenPR может маршрутизировать разные события к разным агентам, устанавливая поле `bot_name` в webhook-payload.

## Следующие шаги

- [Справочник исполнителей](executors.md) — подробная документация по каждому типу исполнителя
- [Справочник конфигурации](../configuration/index.md) — полная схема TOML

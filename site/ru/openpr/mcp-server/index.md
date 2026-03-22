---
title: MCP-сервер
description: "OpenPR включает встроенный MCP-сервер с 34 инструментами через транспорты HTTP, stdio и SSE. Интегрируйте AI-ассистентов, таких как Claude, Codex и Cursor, с управлением проектами."
---

# MCP-сервер

OpenPR включает встроенный **MCP-сервер (Model Context Protocol)**, предоставляющий 34 инструмента для AI-ассистентов для управления проектами, задачами, спринтами, метками, комментариями, предложениями и файлами. Сервер поддерживает три транспортных протокола одновременно.

## Транспортные протоколы

| Протокол | Сценарий использования | Эндпоинт |
|---------|----------------------|---------|
| **HTTP** | Веб-интеграции, плагины OpenClaw | `POST /mcp/rpc` |
| **stdio** | Claude Desktop, Codex, локальный CLI | stdin/stdout JSON-RPC |
| **SSE** | Потоковые клиенты, интерфейсы реального времени | `GET /sse` + `POST /messages` |

::: tip Мультипротокол
В режиме HTTP все три протокола доступны на одном порту: `/mcp/rpc` (HTTP), `/sse` + `/messages` (SSE) и `/health` (проверка работоспособности).
:::

## Конфигурация

### Переменные окружения

| Переменная | Обязательная | Описание | Пример |
|-----------|-------------|----------|--------|
| `OPENPR_API_URL` | Да | Базовый URL API-сервера | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | Да | Токен бота с префиксом `opr_` | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | Да | UUID рабочего пространства по умолчанию | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex (stdio)

Добавьте в конфигурацию вашего MCP-клиента:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

### Режим HTTP

```bash
# Запустить MCP-сервер
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# Проверить
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Режим SSE

```bash
# 1. Подключиться к SSE-потоку (возвращает эндпоинт сессии)
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. POST-запрос к возвращённому эндпоинту
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> Ответ приходит через SSE-поток как event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## Справочник инструментов (34 инструмента)

### Проекты (5)

| Инструмент | Обязательные параметры | Описание |
|----------|---------------------|----------|
| `projects.list` | — | Список всех проектов в рабочем пространстве |
| `projects.get` | `project_id` | Получить детали проекта с количеством задач |
| `projects.create` | `key`, `name` | Создать проект |
| `projects.update` | `project_id` | Обновить название/описание |
| `projects.delete` | `project_id` | Удалить проект |

### Рабочие элементы / Задачи (11)

| Инструмент | Обязательные параметры | Описание |
|----------|---------------------|----------|
| `work_items.list` | `project_id` | Список задач в проекте |
| `work_items.get` | `work_item_id` | Получить задачу по UUID |
| `work_items.get_by_identifier` | `identifier` | Получить по человекочитаемому ID (например, `API-42`) |
| `work_items.create` | `project_id`, `title` | Создать задачу с опциональными state, priority, description, assignee_id, due_at, attachments |
| `work_items.update` | `work_item_id` | Обновить любое поле |
| `work_items.delete` | `work_item_id` | Удалить задачу |
| `work_items.search` | `query` | Полнотекстовый поиск по всем проектам |
| `work_items.add_label` | `work_item_id`, `label_id` | Добавить одну метку |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Добавить несколько меток |
| `work_items.remove_label` | `work_item_id`, `label_id` | Удалить метку |
| `work_items.list_labels` | `work_item_id` | Список меток задачи |

### Комментарии (3)

| Инструмент | Обязательные параметры | Описание |
|----------|---------------------|----------|
| `comments.create` | `work_item_id`, `content` | Создать комментарий с опциональными вложениями |
| `comments.list` | `work_item_id` | Список комментариев к задаче |
| `comments.delete` | `comment_id` | Удалить комментарий |

### Файлы (1)

| Инструмент | Обязательные параметры | Описание |
|----------|---------------------|----------|
| `files.upload` | `filename`, `content_base64` | Загрузить файл (base64), возвращает URL и имя файла |

### Метки (5)

| Инструмент | Обязательные параметры | Описание |
|----------|---------------------|----------|
| `labels.list` | — | Список всех меток рабочего пространства |
| `labels.list_by_project` | `project_id` | Список меток для проекта |
| `labels.create` | `name`, `color` | Создать метку (color: hex, например, `#2563eb`) |
| `labels.update` | `label_id` | Обновить название/цвет/описание |
| `labels.delete` | `label_id` | Удалить метку |

### Спринты (4)

| Инструмент | Обязательные параметры | Описание |
|----------|---------------------|----------|
| `sprints.list` | `project_id` | Список спринтов в проекте |
| `sprints.create` | `project_id`, `name` | Создать спринт с опциональными start_date, end_date |
| `sprints.update` | `sprint_id` | Обновить название/даты/статус |
| `sprints.delete` | `sprint_id` | Удалить спринт |

### Предложения (3)

| Инструмент | Обязательные параметры | Описание |
|----------|---------------------|----------|
| `proposals.list` | `project_id` | Список предложений с опциональным фильтром статуса |
| `proposals.get` | `proposal_id` | Получить детали предложения |
| `proposals.create` | `project_id`, `title`, `description` | Создать предложение по управлению |

### Участники и поиск (2)

| Инструмент | Обязательные параметры | Описание |
|----------|---------------------|----------|
| `members.list` | — | Список участников рабочего пространства и их ролей |
| `search.all` | `query` | Глобальный поиск по проектам, задачам, комментариям |

## Формат ответа

Все ответы MCP-инструментов следуют этой структуре:

### Успех

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### Ошибка

```json
{
  "code": 400,
  "message": "error description"
}
```

## Аутентификация токенами ботов

MCP-сервер аутентифицируется через **токены ботов** (префикс `opr_`). Создавайте токены ботов в **Workspace Settings** > **Bot Tokens**.

Каждый токен бота:
- Имеет отображаемое имя (отображается в лентах активности)
- Ограничен одним рабочим пространством
- Создаёт сущность пользователя `bot_mcp` для целостности журнала аудита
- Поддерживает все операции чтения/записи, доступные участникам рабочего пространства

## Интеграция агентов

Для кодирующих агентов OpenPR предоставляет:

- **AGENTS.md** (`apps/mcp-server/AGENTS.md`) — Паттерны рабочего процесса и примеры инструментов для агентов.
- **Skill Package** (`skills/openpr-mcp/SKILL.md`) — Управляемый skill с шаблонами рабочих процессов и скриптами.

Рекомендуемый рабочий процесс агента:
1. Загрузите `AGENTS.md` для семантики инструментов.
2. Используйте `tools/list` для перечисления доступных инструментов во время выполнения.
3. Следуйте паттернам рабочего процесса: поиск -> создание -> метка -> комментарий.

## Следующие шаги

- [Обзор API](../api/) — справочник REST API
- [Участники и разрешения](../workspace/members) — управление токенами ботов
- [Конфигурация](../configuration/) — все переменные окружения

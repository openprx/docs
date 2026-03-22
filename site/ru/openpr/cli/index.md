---
title: Справочник CLI
description: Справочник командной строки OpenPR для управления проектами, рабочими элементами, комментариями, метками и спринтами напрямую из терминала.
---

# Справочник CLI

OpenPR включает интерфейс командной строки, встроенный в бинарный файл `openpr-mcp`. Помимо запуска MCP-сервера, он предоставляет команды для управления проектами, рабочими элементами, комментариями, метками, спринтами и многим другим прямо из терминала.

## Установка

CLI доступен как часть крейта `mcp-server`. После сборки бинарный файл называется `openpr-mcp`.

```bash
cargo build --release -p mcp-server
```

## Глобальные флаги

Эти флаги применяются ко всем командам:

| Флаг | Описание | По умолчанию |
|------|----------|-------------|
| `--api-url <URL>` | Эндпоинт API-сервера | `http://localhost:8080` |
| `--bot-token <TOKEN>` | Токен аутентификации (префикс `opr_`) | — |
| `--workspace-id <UUID>` | Контекст рабочего пространства для операций | — |
| `--format json\|table` | Формат вывода | `table` |

Вы также можете установить их через переменные окружения:

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## Команды

### serve — Запуск MCP-сервера

Запускает MCP-сервер для интеграции AI-инструментов.

```bash
# Транспорт HTTP (по умолчанию)
openpr-mcp serve --transport http --port 8090

# Транспорт stdio (для прямой интеграции)
openpr-mcp serve --transport stdio
```

### projects — Управление проектами

```bash
# Список всех проектов в рабочем пространстве
openpr-mcp projects list --format table

# Получить детали конкретного проекта
openpr-mcp projects get <project_id>

# Создать новый проект
openpr-mcp projects create --name "My Project" --key "MP"
```

### work-items — Управление рабочими элементами

```bash
# Список рабочих элементов с фильтрами
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# Получить конкретный рабочий элемент
openpr-mcp work-items get <id>

# Создать рабочий элемент
openpr-mcp work-items create --project-id <id> --title "Fix bug" --state todo
openpr-mcp work-items create --project-id <id> --title "New feature" --state backlog --priority high

# Обновить рабочий элемент
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# Поиск рабочих элементов по тексту
openpr-mcp work-items search --query "authentication"
```

### comments — Управление комментариями

```bash
# Список комментариев к рабочему элементу
openpr-mcp comments list --work-item-id <id>

# Добавить комментарий
openpr-mcp comments create --work-item-id <id> --content "Fixed in commit abc123"
```

### labels — Управление метками

```bash
# Список меток уровня рабочего пространства
openpr-mcp labels list --workspace

# Список меток уровня проекта
openpr-mcp labels list --project-id <id>
```

### sprints — Управление спринтами

```bash
# Список спринтов для проекта
openpr-mcp sprints list --project-id <id>
```

### search — Глобальный поиск

```bash
# Поиск по всем сущностям
openpr-mcp search --query "bug"
```

### files — Вложения файлов

```bash
# Загрузить файл к рабочему элементу
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## Примеры использования

### Типичный рабочий процесс

```bash
# Настройка учётных данных
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# Список проектов
openpr-mcp projects list

# Просмотр задач в состоянии todo для проекта
openpr-mcp work-items list --project-id <id> --state todo --format table

# Взять рабочий элемент в работу
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# Добавить комментарий по завершению
openpr-mcp comments create --work-item-id <item_id> --content "Completed. See PR #42."

# Отметить как выполненное
openpr-mcp work-items update <item_id> --state done
```

### Вывод JSON для скриптов

Используйте `--format json` для получения машиночитаемого вывода, подходящего для передачи в `jq` или другие инструменты:

```bash
# Получить все задачи в работе в формате JSON
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# Подсчёт задач по состоянию
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## Смотрите также

- [MCP-сервер](../mcp-server/) — интеграция MCP-инструментов для AI-агентов
- [Справочник API](../api/) — полная документация REST API
- [Состояния рабочего процесса](../issues/workflow) — управление состояниями задач и пользовательские рабочие процессы

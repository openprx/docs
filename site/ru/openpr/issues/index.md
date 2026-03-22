---
title: Задачи и отслеживание
description: "Задачи OpenPR — основная единица работы. Отслеживайте задания, баги и функции с состояниями, приоритетами, исполнителями, метками и комментариями."
---

# Задачи и отслеживание

Задачи (также называемые рабочими элементами) — основная единица работы в OpenPR. Они представляют задания, баги, функции или любую отслеживаемую часть работы внутри проекта.

## Поля задачи

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| Заголовок | string | Да | Краткое описание работы |
| Описание | markdown | Нет | Подробное описание с форматированием |
| Состояние | enum | Да | Состояние рабочего процесса (см. [Рабочий процесс](./workflow)) |
| Приоритет | enum | Нет | `low`, `medium`, `high`, `urgent` |
| Исполнитель | user | Нет | Участник команды, ответственный за задачу |
| Метки | list | Нет | Теги категоризации (см. [Метки](./labels)) |
| Спринт | sprint | Нет | Цикл спринта, к которому принадлежит задача |
| Срок | datetime | Нет | Целевая дата завершения |
| Вложения | files | Нет | Прикреплённые файлы (изображения, документы, логи) |

## Идентификаторы задач

Каждая задача имеет читаемый идентификатор, состоящий из ключа проекта и порядкового номера:

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

Вы можете найти любую задачу по её идентификатору во всех проектах рабочего пространства.

## Создание задач

### Через веб-интерфейс

1. Перейдите в ваш проект.
2. Нажмите **New Issue**.
3. Заполните заголовок, описание и опциональные поля.
4. Нажмите **Create**.

### Через REST API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement user settings page",
    "description": "Add a settings page where users can update their profile.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### Через MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Implement user settings page",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## Комментарии

Задачи поддерживают многоуровневые комментарии с форматированием markdown и вложениями файлов:

```bash
# Добавить комментарий
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Fixed in commit abc123. Ready for review."}'
```

Комментарии также доступны через MCP-инструменты: `comments.create`, `comments.list`, `comments.delete`.

## Лента активности

Каждое изменение задачи записывается в ленте активности:

- Изменения состояния
- Изменения исполнителя
- Добавление/удаление меток
- Комментарии
- Обновления приоритета

Лента активности обеспечивает полный журнал аудита для каждой задачи.

## Вложения файлов

Задачи и комментарии поддерживают прикрепление файлов, включая изображения, документы, логи и архивы. Загрузка через API:

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

Или через MCP:

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<base64_encoded_content>"
    }
  }
}
```

Поддерживаемые типы файлов: изображения (PNG, JPG, GIF, WebP), документы (PDF, TXT), данные (JSON, CSV, XML), архивы (ZIP, GZ) и логи.

## Поиск

OpenPR обеспечивает полнотекстовый поиск по всем задачам, комментариям и предложениям с использованием PostgreSQL FTS:

```bash
# Поиск через API
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# Поиск через MCP
# work_items.search: поиск внутри проекта
# search.all: глобальный поиск по всем проектам
```

## MCP-инструменты

| Инструмент | Параметры | Описание |
|----------|---------|----------|
| `work_items.list` | `project_id` | Список задач в проекте |
| `work_items.get` | `work_item_id` | Получить задачу по UUID |
| `work_items.get_by_identifier` | `identifier` | Получить по человекочитаемому ID (например, `API-42`) |
| `work_items.create` | `project_id`, `title` | Создать задачу |
| `work_items.update` | `work_item_id` | Обновить любое поле |
| `work_items.delete` | `work_item_id` | Удалить задачу |
| `work_items.search` | `query` | Полнотекстовый поиск |
| `comments.create` | `work_item_id`, `content` | Добавить комментарий |
| `comments.list` | `work_item_id` | Список комментариев |
| `comments.delete` | `comment_id` | Удалить комментарий |
| `files.upload` | `filename`, `content_base64` | Загрузить файл |

## Следующие шаги

- [Состояния рабочего процесса](./workflow) — изучите жизненный цикл задачи
- [Планирование спринтов](./sprints) — организуйте задачи в циклы спринтов
- [Метки](./labels) — категоризируйте задачи с помощью меток

---
title: Справочник API-эндпоинтов
description: "Полный справочник по всем REST API-эндпоинтам OpenPR, включая аутентификацию, проекты, задачи, управление, AI и административные операции."
---

# Справочник API-эндпоинтов

Эта страница предоставляет полный справочник по всем REST API-эндпоинтам OpenPR. Все эндпоинты требуют аутентификации, если не указано иное.

## Аутентификация

| Метод | Эндпоинт | Описание | Auth |
|-------|---------|----------|------|
| POST | `/api/auth/register` | Создать новый аккаунт | Нет |
| POST | `/api/auth/login` | Войти и получить токены | Нет |
| POST | `/api/auth/refresh` | Обновить токен доступа | Нет |
| GET | `/api/auth/me` | Получить информацию о текущем пользователе | Да |

## Рабочие пространства

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/workspaces` | Список рабочих пространств пользователя |
| POST | `/api/workspaces` | Создать рабочее пространство |
| GET | `/api/workspaces/:id` | Получить детали рабочего пространства |
| PUT | `/api/workspaces/:id` | Обновить рабочее пространство |
| DELETE | `/api/workspaces/:id` | Удалить рабочее пространство (только owner) |

## Участники рабочего пространства

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/workspaces/:id/members` | Список участников |
| POST | `/api/workspaces/:id/members` | Добавить участника |
| PUT | `/api/workspaces/:id/members/:user_id` | Обновить роль участника |
| DELETE | `/api/workspaces/:id/members/:user_id` | Удалить участника |

## Токены ботов

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/workspaces/:id/bots` | Список токенов ботов |
| POST | `/api/workspaces/:id/bots` | Создать токен бота |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | Удалить токен бота |

## Проекты

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/workspaces/:ws_id/projects` | Список проектов |
| POST | `/api/workspaces/:ws_id/projects` | Создать проект |
| GET | `/api/workspaces/:ws_id/projects/:id` | Получить проект с количеством задач |
| PUT | `/api/workspaces/:ws_id/projects/:id` | Обновить проект |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | Удалить проект |

## Задачи (рабочие элементы)

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/projects/:id/issues` | Список задач (пагинация, фильтры) |
| POST | `/api/projects/:id/issues` | Создать задачу |
| GET | `/api/issues/:id` | Получить задачу по UUID |
| PATCH | `/api/issues/:id` | Обновить поля задачи |
| DELETE | `/api/issues/:id` | Удалить задачу |

### Поля задачи (создание/обновление)

```json
{
  "title": "string (required on create)",
  "description": "string (markdown)",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "ISO 8601 datetime"
}
```

## Доска

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/projects/:id/board` | Получить состояние kanban-доски |

## Комментарии

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/issues/:id/comments` | Список комментариев к задаче |
| POST | `/api/issues/:id/comments` | Создать комментарий |
| DELETE | `/api/comments/:id` | Удалить комментарий |

## Метки

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/labels` | Список всех меток рабочего пространства |
| POST | `/api/labels` | Создать метку |
| PUT | `/api/labels/:id` | Обновить метку |
| DELETE | `/api/labels/:id` | Удалить метку |
| POST | `/api/issues/:id/labels` | Добавить метку к задаче |
| DELETE | `/api/issues/:id/labels/:label_id` | Удалить метку из задачи |

## Спринты

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/projects/:id/sprints` | Список спринтов |
| POST | `/api/projects/:id/sprints` | Создать спринт |
| PUT | `/api/sprints/:id` | Обновить спринт |
| DELETE | `/api/sprints/:id` | Удалить спринт |

## Предложения

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/proposals` | Список предложений |
| POST | `/api/proposals` | Создать предложение |
| GET | `/api/proposals/:id` | Получить детали предложения |
| POST | `/api/proposals/:id/vote` | Отдать голос |
| POST | `/api/proposals/:id/submit` | Отправить на голосование |
| POST | `/api/proposals/:id/archive` | Архивировать предложение |

## Управление

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/governance/config` | Получить конфигурацию управления |
| PUT | `/api/governance/config` | Обновить конфигурацию управления |
| GET | `/api/governance/audit-logs` | Список журналов аудита управления |

## Решения

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/decisions` | Список решений |
| GET | `/api/decisions/:id` | Получить детали решения |

## Оценки доверия

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/trust-scores` | Список оценок доверия |
| GET | `/api/trust-scores/:user_id` | Получить оценку доверия пользователя |
| GET | `/api/trust-scores/:user_id/history` | Получить историю оценки |
| POST | `/api/trust-scores/:user_id/appeals` | Подать апелляцию |

## Вето

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/veto` | Список событий вето |
| POST | `/api/veto` | Создать вето |
| POST | `/api/veto/:id/escalate` | Эскалировать вето |

## AI-агенты

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/projects/:id/ai-agents` | Список AI-агентов |
| POST | `/api/projects/:id/ai-agents` | Зарегистрировать AI-агента |
| GET | `/api/projects/:id/ai-agents/:agent_id` | Получить детали агента |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | Обновить агента |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | Удалить агента |

## AI-задачи

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/projects/:id/ai-tasks` | Список AI-задач |
| POST | `/api/projects/:id/ai-tasks` | Создать AI-задачу |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | Обновить статус задачи |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | Обратный вызов задачи |

## Загрузка файлов

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| POST | `/api/v1/upload` | Загрузить файл (multipart/form-data) |

Поддерживаемые типы: изображения (PNG, JPG, GIF, WebP), документы (PDF, TXT), данные (JSON, CSV, XML), архивы (ZIP, GZ), логи.

## Webhooks

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/workspaces/:id/webhooks` | Список webhooks |
| POST | `/api/workspaces/:id/webhooks` | Создать webhook |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | Обновить webhook |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | Удалить webhook |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | Журнал доставки |

## Поиск

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/search?q=<query>` | Полнотекстовый поиск по всем сущностям |

## Администрирование

| Метод | Эндпоинт | Описание |
|-------|---------|----------|
| GET | `/api/admin/users` | Список всех пользователей (только admin) |
| PUT | `/api/admin/users/:id` | Обновить пользователя (только admin) |

## Работоспособность

| Метод | Эндпоинт | Описание | Auth |
|-------|---------|----------|------|
| GET | `/health` | Проверка работоспособности | Нет |

## Следующие шаги

- [Аутентификация](./authentication) — управление токенами и токены ботов
- [Обзор API](./index) — формат ответа и соглашения
- [MCP-сервер](../mcp-server/) — удобный для AI интерфейс

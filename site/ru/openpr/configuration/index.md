---
title: Справочник конфигурации
description: "Полный справочник по всем переменным окружения и параметрам конфигурации OpenPR для API, воркера, MCP-сервера, фронтенда и базы данных."
---

# Справочник конфигурации

OpenPR настраивается через переменные окружения. Все сервисы читают из одного файла `.env` при использовании Docker Compose или отдельных переменных окружения при прямом запуске.

## API-сервер

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `APP_NAME` | `api` | Идентификатор приложения для логирования |
| `BIND_ADDR` | `0.0.0.0:8080` | Адрес и порт, на котором слушает API |
| `DATABASE_URL` | — | Строка подключения к PostgreSQL |
| `JWT_SECRET` | `change-me-in-production` | Секретный ключ для подписи JWT-токенов |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 дней) | Время жизни токена доступа в секундах |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 дней) | Время жизни токена обновления в секундах |
| `RUST_LOG` | `info` | Уровень логирования (trace, debug, info, warn, error) |
| `UPLOAD_DIR` | `/app/uploads` | Директория для загрузки файлов |

::: danger Безопасность
Всегда меняйте `JWT_SECRET` на надёжное случайное значение в продакшене. Используйте минимум 32 символа случайных данных:
```bash
openssl rand -hex 32
```
:::

## База данных

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `DATABASE_URL` | — | Полная строка подключения к PostgreSQL |
| `POSTGRES_DB` | `openpr` | Имя базы данных |
| `POSTGRES_USER` | `openpr` | Пользователь базы данных |
| `POSTGRES_PASSWORD` | `openpr` | Пароль базы данных |

Формат строки подключения:

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
При использовании Docker Compose сервис базы данных называется `postgres`, поэтому строка подключения:
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## Воркер

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `APP_NAME` | `worker` | Идентификатор приложения |
| `DATABASE_URL` | — | Строка подключения к PostgreSQL |
| `JWT_SECRET` | — | Должен совпадать со значением API-сервера |
| `RUST_LOG` | `info` | Уровень логирования |

Воркер обрабатывает фоновые задачи из таблиц `job_queue` и `scheduled_jobs`.

## MCP-сервер

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `APP_NAME` | `mcp-server` | Идентификатор приложения |
| `OPENPR_API_URL` | — | URL API-сервера (включая прокси при наличии) |
| `OPENPR_BOT_TOKEN` | — | Токен бота с префиксом `opr_` |
| `OPENPR_WORKSPACE_ID` | — | UUID рабочего пространства по умолчанию |
| `DATABASE_URL` | — | Строка подключения к PostgreSQL |
| `JWT_SECRET` | — | Должен совпадать со значением API-сервера |
| `DEFAULT_AUTHOR_ID` | — | UUID автора по умолчанию для операций MCP |
| `RUST_LOG` | `info` | Уровень логирования |

### Опции транспорта MCP

Бинарный файл MCP-сервера принимает аргументы командной строки:

```bash
# Режим HTTP (по умолчанию)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# Режим stdio (для Claude Desktop, Codex)
mcp-server --transport stdio

# Форма подкоманды
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## Фронтенд

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `VITE_API_URL` | `http://localhost:8080` | URL API-сервера для подключения фронтенда |

::: tip Обратный прокси
В продакшене с обратным прокси (Caddy/Nginx) `VITE_API_URL` должен указывать на URL прокси, маршрутизирующий запросы к API-серверу.
:::

## Порты Docker Compose

| Сервис | Внутренний порт | Внешний порт | Назначение |
|--------|----------------|-------------|-----------|
| PostgreSQL | 5432 | 5432 | База данных |
| API | 8080 | 8081 | REST API |
| Worker | — | — | Фоновые задачи (без порта) |
| MCP Server | 8090 | 8090 | MCP-инструменты |
| Frontend | 80 | 3000 | Веб-интерфейс |

## Пример файла .env

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# API Server
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

## Уровни логирования

OpenPR использует крейт `tracing` для структурированного логирования. Установите `RUST_LOG` для управления детализацией:

| Уровень | Описание |
|--------|----------|
| `error` | Только ошибки |
| `warn` | Ошибки и предупреждения |
| `info` | Обычные рабочие сообщения (по умолчанию) |
| `debug` | Детальная отладочная информация |
| `trace` | Очень подробно, включает все внутренние операции |

Поддерживается фильтрация по модулям:

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## Следующие шаги

- [Docker-развёртывание](../deployment/docker) — конфигурация Docker Compose
- [Продакшен-развёртывание](../deployment/production) — Caddy, безопасность и масштабирование
- [Установка](../getting-started/installation) — начало работы

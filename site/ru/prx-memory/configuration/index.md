---
title: Справочник конфигурации
description: Полный справочник по всем переменным окружения PRX-Memory, охватывающий транспорт, хранение, эмбеддинги, реранкинг, управление и наблюдаемость.
---

# Справочник конфигурации

PRX-Memory полностью настраивается через переменные окружения. На этой странице описаны все переменные, сгруппированные по категориям.

## Транспорт

| Переменная | Значения | По умолчанию | Описание |
|-----------|---------|-------------|----------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`, `http` | `stdio` | Режим транспорта сервера |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | Адрес привязки HTTP-сервера |

## Хранение

| Переменная | Значения | По умолчанию | Описание |
|-----------|---------|-------------|----------|
| `PRX_MEMORY_BACKEND` | `json`, `sqlite`, `lancedb` | `json` | Бэкенд хранения |
| `PRX_MEMORY_DB` | путь к файлу/директории | — | Путь к файлу или директории базы данных |

## Эмбеддинги

| Переменная | Значения | По умолчанию | Описание |
|-----------|---------|-------------|----------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`, `jina`, `gemini` | — | Провайдер эмбеддингов |
| `PRX_EMBED_API_KEY` | строка API-ключа | — | API-ключ провайдера эмбеддингов |
| `PRX_EMBED_MODEL` | название модели | зависит от провайдера | Название модели эмбеддингов |
| `PRX_EMBED_BASE_URL` | URL | зависит от провайдера | URL пользовательского эндпоинта API |

### Резервные ключи провайдеров

Если `PRX_EMBED_API_KEY` не установлен, система проверяет следующие ключи, специфичные для провайдера:

| Провайдер | Резервный ключ |
|-----------|--------------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## Реранкинг

| Переменная | Значения | По умолчанию | Описание |
|-----------|---------|-------------|----------|
| `PRX_RERANK_PROVIDER` | `jina`, `cohere`, `pinecone`, `pinecone-compatible`, `none` | `none` | Провайдер реранкинга |
| `PRX_RERANK_API_KEY` | строка API-ключа | — | API-ключ провайдера реранкинга |
| `PRX_RERANK_MODEL` | название модели | зависит от провайдера | Название модели реранкинга |
| `PRX_RERANK_ENDPOINT` | URL | зависит от провайдера | Пользовательский эндпоинт реранкинга |
| `PRX_RERANK_API_VERSION` | строка версии | — | Версия API (только для pinecone-compatible) |

### Резервные ключи провайдеров

Если `PRX_RERANK_API_KEY` не установлен, система проверяет следующие ключи, специфичные для провайдера:

| Провайдер | Резервный ключ |
|-----------|--------------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## Стандартизация

| Переменная | Значения | По умолчанию | Описание |
|-----------|---------|-------------|----------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`, `governed` | `zero-config` | Профиль стандартизации |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | строка тега | `prx-memory` | Тег проекта по умолчанию |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | строка тега | `mcp` | Тег инструмента по умолчанию |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | строка тега | `general` | Тег домена по умолчанию |

## Потоковые сессии

| Переменная | Значения | По умолчанию | Описание |
|-----------|---------|-------------|----------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | миллисекунды | `300000` | Время жизни потоковой сессии |

## Наблюдаемость

### Контроль кардинальности

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | Макс. количество различных меток области видимости в метриках |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | Макс. количество различных меток категорий в метриках |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | Макс. количество различных меток провайдеров реранкинга |

### Пороги оповещений

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | Порог предупреждения о доле ошибок инструментов |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | Критический порог доли ошибок инструментов |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | Порог предупреждения о доле удалённых предупреждений |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | Критический порог доли удалённых предупреждений |

## Пример: Минимальная конфигурация

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## Пример: Полная продакшен-конфигурация

```bash
# Транспорт
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Хранение
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Эмбеддинги
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Реранкинг
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Управление
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Сессии
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Наблюдаемость
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## Следующие шаги

- [Установка](../getting-started/installation) — сборка и установка PRX-Memory
- [Интеграция MCP](../mcp/) — настройка MCP-клиента
- [Устранение неполадок](../troubleshooting/) — распространённые проблемы конфигурации

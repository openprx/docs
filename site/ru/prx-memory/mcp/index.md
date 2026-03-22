---
title: Интеграция MCP
description: Интеграция протокола MCP в PRX-Memory, поддерживаемые инструменты, ресурсы, шаблоны и режимы транспорта.
---

# Интеграция MCP

PRX-Memory создан как нативный MCP-сервер (Model Context Protocol). Он предоставляет операции с памятью как MCP-инструменты, навыки управления как MCP-ресурсы и шаблоны payload для стандартизированных взаимодействий с памятью.

## Режимы транспорта

### stdio

Транспорт stdio осуществляет обмен данными через стандартный ввод/вывод, что делает его идеальным для прямой интеграции с MCP-клиентами, такими как Claude Code, Codex и OpenClaw.

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

HTTP-транспорт предоставляет сетево доступный сервер с дополнительными операционными эндпоинтами.

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Эндпоинты, доступные только через HTTP:

| Эндпоинт | Описание |
|---------|----------|
| `GET /health` | Проверка работоспособности |
| `GET /metrics` | Метрики Prometheus |
| `GET /metrics/summary` | Сводка метрик в формате JSON |
| `POST /mcp/session/renew` | Обновление потоковой сессии |

## Конфигурация MCP-клиента

Добавьте PRX-Memory в конфигурационный файл вашего MCP-клиента:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
Используйте абсолютные пути как для `command`, так и для `PRX_MEMORY_DB`, чтобы избежать проблем с разрешением путей.
:::

## MCP-инструменты

PRX-Memory предоставляет следующие инструменты через интерфейс MCP `tools/call`:

### Основные операции с памятью

| Инструмент | Описание |
|-----------|----------|
| `memory_store` | Сохранить новую запись памяти с текстом, областью видимости, тегами и метаданными |
| `memory_recall` | Извлечь воспоминания по запросу с использованием лексического, векторного и переранжированного поиска |
| `memory_update` | Обновить существующую запись памяти |
| `memory_forget` | Удалить запись памяти по ID |

### Массовые операции

| Инструмент | Описание |
|-----------|----------|
| `memory_export` | Экспортировать все воспоминания в портабельный формат JSON |
| `memory_import` | Импортировать воспоминания из экспорта |
| `memory_migrate` | Мигрировать между бэкендами хранения |
| `memory_reembed` | Перегенерировать эмбеддинги всех воспоминаний с текущей моделью |
| `memory_compact` | Уплотнить и оптимизировать хранение |

### Эволюция

| Инструмент | Описание |
|-----------|----------|
| `memory_evolve` | Эволюционировать память с использованием train/holdout-приёмки и ограничительных шлюзов |

### Обнаружение навыков

| Инструмент | Описание |
|-----------|----------|
| `memory_skill_manifest` | Вернуть манифест навыков для навыков управления |

## MCP-ресурсы

PRX-Memory предоставляет пакеты навыков управления как MCP-ресурсы:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

Чтение конкретного ресурса:

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## Шаблоны ресурсов

Шаблоны payload помогают клиентам конструировать стандартизированные операции с памятью:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

Использование шаблона для генерации payload сохранения:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## Потоковые сессии

HTTP-транспорт поддерживает Server-Sent Events (SSE) для потоковых ответов. Сессии имеют настраиваемое TTL:

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 минут
```

Обновление сессии до истечения срока:

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## Профили стандартизации

PRX-Memory поддерживает два профиля стандартизации, контролирующих способ тегирования и проверки записей памяти:

| Профиль | Описание |
|---------|----------|
| `zero-config` | Минимальные ограничения, принимает любые теги и области видимости (по умолчанию) |
| `governed` | Строгая нормализация тегов, границы соотношений и ограничения качества |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## Следующие шаги

- [Быстрый старт](../getting-started/quickstart) — первые операции сохранения и извлечения
- [Справочник конфигурации](../configuration/) — все переменные окружения
- [Устранение неполадок](../troubleshooting/) — распространённые проблемы MCP

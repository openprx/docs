---
title: Быстрый старт
description: "Запустите PRX-Memory за 5 минут с stdio или HTTP транспортом, сохраните первое воспоминание и извлеките его с помощью семантического поиска."
---

# Быстрый старт

Это руководство проведёт вас через сборку PRX-Memory, запуск демона и выполнение первых операций сохранения и извлечения.

## 1. Соберите демон

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. Запустите сервер

### Вариант A: Транспорт stdio

Для прямой интеграции с MCP-клиентом:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### Вариант B: HTTP-транспорт

Для сетевого доступа с проверками работоспособности и метриками:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

Убедитесь, что сервер запущен:

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. Настройте MCP-клиент

Добавьте PRX-Memory в конфигурацию вашего MCP-клиента. Например, в Claude Code или Codex:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
Замените `/path/to/prx-memory` на фактический путь, где вы клонировали репозиторий.
:::

## 4. Сохраните воспоминание

Отправьте вызов инструмента `memory_store` через ваш MCP-клиент или напрямую через JSON-RPC:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always use parameterized queries for SQL to prevent injection attacks",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. Извлеките воспоминания

Извлеките релевантные воспоминания с помощью `memory_recall`:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL security best practices",
      "scope": "global",
      "limit": 5
    }
  }
}
```

Система возвращает воспоминания, ранжированные по релевантности с использованием комбинации лексического сопоставления, оценки важности и актуальности.

## 6. Включите семантический поиск (опционально)

Для векторного семантического извлечения настройте провайдера эмбеддингов:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

При включённых эмбеддингах запросы извлечения используют векторное сходство в дополнение к лексическому сопоставлению, значительно улучшая качество извлечения для запросов на естественном языке.

## 7. Включите реранкинг (опционально)

Добавьте реранкер для дальнейшего улучшения точности извлечения:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## Доступные MCP-инструменты

| Инструмент | Описание |
|----------|----------|
| `memory_store` | Сохранить новую запись памяти |
| `memory_recall` | Извлечь воспоминания по запросу |
| `memory_update` | Обновить существующую запись памяти |
| `memory_forget` | Удалить запись памяти |
| `memory_export` | Экспортировать все воспоминания |
| `memory_import` | Импортировать воспоминания из экспорта |
| `memory_migrate` | Мигрировать формат хранения |
| `memory_reembed` | Перегенерировать эмбеддинги с новой моделью |
| `memory_compact` | Уплотнить и оптимизировать хранение |
| `memory_evolve` | Эволюционировать память с holdout-валидацией |
| `memory_skill_manifest` | Обнаружить доступные навыки |

## Следующие шаги

- [Движок эмбеддингов](../embedding/) — изучите провайдеры эмбеддингов и пакетную обработку
- [Реранкинг](../reranking/) — настройте второй этап реранкинга
- [Бэкенды хранения](../storage/) — выберите между JSON и SQLite хранением
- [Справочник конфигурации](../configuration/) — все переменные окружения

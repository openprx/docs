---
title: Устранение неполадок
description: Распространённые проблемы PRX-Memory и их решения для конфигурации, эмбеддингов, реранкинга, хранения и интеграции MCP.
---

# Устранение неполадок

На этой странице описаны распространённые проблемы, возникающие при работе с PRX-Memory, а также их причины и решения.

## Проблемы конфигурации

### "PRX_EMBED_API_KEY is not configured"

**Причина:** Был запрошен удалённый семантический recall, но API-ключ эмбеддинга не установлен.

**Решение:** Установите провайдера эмбеддинга и API-ключ:

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

Или используйте резервный ключ, специфичный для провайдера:

```bash
JINA_API_KEY=your_api_key
```

::: tip
Если вам не нужен семантический поиск, PRX-Memory работает без конфигурации эмбеддингов, используя только лексическое сопоставление.
:::

### "Unsupported rerank provider"

**Причина:** Переменная `PRX_RERANK_PROVIDER` содержит нераспознанное значение.

**Решение:** Используйте одно из поддерживаемых значений:

```bash
PRX_RERANK_PROVIDER=jina        # или cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**Причина:** Переменная `PRX_EMBED_PROVIDER` содержит нераспознанное значение.

**Решение:** Используйте одно из поддерживаемых значений:

```bash
PRX_EMBED_PROVIDER=openai-compatible  # или jina, gemini
```

## Проблемы сессий

### "session_expired"

**Причина:** HTTP потоковая сессия превысила TTL без обновления.

**Решение:** Либо обновите сессию до истечения срока, либо увеличьте TTL:

```bash
# Обновить сессию
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Или увеличить TTL (по умолчанию: 300000 мс = 5 минут)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## Проблемы хранения

### Файл базы данных не найден

**Причина:** Путь, указанный в `PRX_MEMORY_DB`, не существует или недоступен для записи.

**Решение:** Убедитесь, что директория существует и путь корректен:

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
Используйте абсолютные пути, чтобы избежать проблем при смене рабочей директории.
:::

### Медленная загрузка большой JSON-базы данных

**Причина:** JSON-бэкенд загружает весь файл в память при запуске. Для баз данных с более чем 10 000 записей это может быть медленным.

**Решение:** Мигрируйте на SQLite-бэкенд:

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Используйте инструмент `memory_migrate` для переноса существующих данных.

## Проблемы наблюдаемости

### Предупреждение о переполнении кардинальности метрик

**Причина:** Слишком много различных значений меток в измерениях области видимости recall, категорий или провайдеров реранкинга.

**Решение:** Увеличьте лимиты кардинальности или нормализуйте входные данные:

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

При превышении лимитов новые значения меток молча отбрасываются и учитываются в `prx_memory_metrics_label_overflow_total`.

### Слишком чувствительные пороги оповещений

**Причина:** Пороги оповещений по умолчанию могут вызывать ложные срабатывания при первоначальном развёртывании.

**Решение:** Скорректируйте пороги исходя из ожидаемых показателей ошибок:

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## Проблемы сборки

### Функция LanceDB недоступна

**Причина:** Флаг функции `lancedb-backend` не был включён во время компиляции.

**Решение:** Пересоберите с флагом функции:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### Ошибки компиляции в Linux

**Причина:** Отсутствуют системные зависимости для сборки нативного кода.

**Решение:** Установите зависимости сборки:

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## Проверка работоспособности

Используйте HTTP-эндпоинт работоспособности для проверки корректной работы сервера:

```bash
curl -sS http://127.0.0.1:8787/health
```

Проверьте метрики для оценки операционного статуса:

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## Команды валидации

Запустите полный набор проверок для верификации установки:

```bash
# Валидация для нескольких клиентов
./scripts/run_multi_client_validation.sh

# Нагрузочный тест (60 секунд, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## Получение помощи

- **Репозиторий:** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **Issues:** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **Документация:** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)

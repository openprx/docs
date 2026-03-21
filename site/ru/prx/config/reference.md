---
title: Справочник конфигурации
description: Полный пофилевый справочник всех разделов и параметров конфигурации PRX.
---

# Справочник конфигурации

На этой странице описан каждый раздел и поле конфигурации PRX в `config.toml`. Поля, для которых указано значение по умолчанию, можно не указывать — PRX будет использовать значение по умолчанию.

## Верхний уровень (настройки по умолчанию)

Эти поля располагаются на корневом уровне `config.toml`, вне каких-либо заголовков секций.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `default_provider` | `string` | `"openrouter"` | ID или псевдоним провайдера (например, `"anthropic"`, `"openai"`, `"ollama"`) |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | Идентификатор модели, маршрутизируемый через выбранного провайдера |
| `default_temperature` | `float` | `0.7` | Температура сэмплирования (0.0--2.0). Ниже = более детерминированный |
| `api_key` | `string?` | `null` | API-ключ для выбранного провайдера. Переопределяется провайдер-специфичными переменными окружения |
| `api_url` | `string?` | `null` | Переопределение базового URL API провайдера (например, удалённый эндпоинт Ollama) |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

HTTP-шлюзовой сервер для эндпоинтов вебхуков, сопряжения и веб-API.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `host` | `string` | `"127.0.0.1"` | Адрес привязки. Используйте `"0.0.0.0"` для публичного доступа |
| `port` | `u16` | `16830` | Порт прослушивания |
| `require_pairing` | `bool` | `true` | Требовать сопряжение устройства перед приёмом API-запросов |
| `allow_public_bind` | `bool` | `false` | Разрешить привязку к нелокальному адресу без туннеля |
| `pair_rate_limit_per_minute` | `u32` | `5` | Макс. запросов сопряжения в минуту от клиента |
| `webhook_rate_limit_per_minute` | `u32` | `60` | Макс. запросов вебхуков в минуту от клиента |
| `api_rate_limit_per_minute` | `u32` | `120` | Макс. API-запросов в минуту на аутентифицированный токен |
| `trust_forwarded_headers` | `bool` | `false` | Доверять заголовкам `X-Forwarded-For` / `X-Real-IP` (включать только за обратным прокси) |
| `request_timeout_secs` | `u64` | `300` | Таймаут обработчика HTTP в секундах |
| `idempotency_ttl_secs` | `u64` | `300` | TTL для ключей идемпотентности вебхуков |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
Изменение `host` или `port` требует полного перезапуска. Эти значения привязываются при запуске сервера и не могут быть перезагружены на лету.
:::

## `[channels_config]`

Конфигурация каналов верхнего уровня. Отдельные каналы — вложенные подсекции.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `cli` | `bool` | `true` | Включить интерактивный CLI-канал |
| `message_timeout_secs` | `u64` | `300` | Таймаут обработки одного сообщения (LLM + инструменты) |

### `[channels_config.telegram]`

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `bot_token` | `string` | *(обязательный)* | Токен Telegram Bot API от @BotFather |
| `allowed_users` | `string[]` | `[]` | Разрешённые Telegram user ID или имена пользователей. Пусто = запрещено всем |
| `mention_only` | `bool` | `false` | В группах отвечать только на сообщения с @-упоминанием бота |
| `stream_mode` | `"off" \| "partial"` | `"off"` | Режим потоковой передачи: `off` — полный ответ, `partial` — прогрессивное редактирование черновика |
| `draft_update_interval_ms` | `u64` | `1000` | Минимальный интервал между редактированиями черновика (защита от ограничений частоты) |
| `interrupt_on_new_message` | `bool` | `false` | Отменить текущий ответ, когда тот же пользователь отправляет новое сообщение |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `bot_token` | `string` | *(обязательный)* | Токен Discord-бота из Developer Portal |
| `guild_id` | `string?` | `null` | Ограничить одним сервером (гильдией) |
| `allowed_users` | `string[]` | `[]` | Разрешённые Discord user ID. Пусто = запрещено всем |
| `listen_to_bots` | `bool` | `false` | Обрабатывать сообщения от других ботов (собственные сообщения всегда игнорируются) |
| `mention_only` | `bool` | `false` | Отвечать только на @-упоминания |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `bot_token` | `string` | *(обязательный)* | OAuth-токен Slack-бота (`xoxb-...`) |
| `app_token` | `string?` | `null` | Токен уровня приложения для Socket Mode (`xapp-...`) |
| `channel_id` | `string?` | `null` | Ограничить одним каналом |
| `allowed_users` | `string[]` | `[]` | Разрешённые Slack user ID. Пусто = запрещено всем |
| `mention_only` | `bool` | `false` | В группах отвечать только на @-упоминания |

### `[channels_config.lark]`

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `app_id` | `string` | *(обязательный)* | App ID Lark/Feishu |
| `app_secret` | `string` | *(обязательный)* | App Secret Lark/Feishu |
| `encrypt_key` | `string?` | `null` | Ключ шифрования событий |
| `verification_token` | `string?` | `null` | Токен верификации событий |
| `allowed_users` | `string[]` | `[]` | Разрешённые user ID. Пусто = запрещено всем |
| `use_feishu` | `bool` | `false` | Использовать API-эндпоинты Feishu (Китай) вместо Lark (международных) |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | Режим получения сообщений |
| `port` | `u16?` | `null` | Порт прослушивания вебхуков (только для режима webhook) |
| `mention_only` | `bool` | `false` | Отвечать только на @-упоминания |

PRX также поддерживает следующие дополнительные каналы (настраиваемые в `[channels_config.*]`):

- **Matrix** — `homeserver`, `access_token`, списки разрешённых комнат
- **Signal** — через signal-cli REST API
- **WhatsApp** — Cloud API или режим Web
- **iMessage** — только macOS, списки разрешённых контактов
- **DingTalk** — Stream Mode с `client_id` / `client_secret`
- **QQ** — Official Bot SDK с `app_id` / `app_secret`
- **Email** — IMAP/SMTP
- **IRC** — сервер, канал, ник
- **Mattermost** — URL + токен бота
- **Nextcloud Talk** — базовый URL + токен приложения
- **Webhook** — общие входящие вебхуки

## `[memory]`

Бэкенд памяти для истории разговоров, знаний и эмбеддингов.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `backend` | `string` | `"sqlite"` | Тип бэкенда: `"sqlite"`, `"lucid"`, `"postgres"`, `"markdown"`, `"none"` |
| `auto_save` | `bool` | `true` | Автоматически сохранять пользовательский ввод разговоров в память |
| `acl_enabled` | `bool` | `false` | Включить списки контроля доступа к памяти |
| `hygiene_enabled` | `bool` | `true` | Периодическое архивирование и очистка по правилам хранения |
| `archive_after_days` | `u32` | `7` | Архивировать ежедневные/сессионные файлы старше этого срока |
| `purge_after_days` | `u32` | `30` | Удалять архивные файлы старше этого срока |
| `conversation_retention_days` | `u32` | `3` | SQLite: удаление строк разговоров старше этого срока |
| `daily_retention_days` | `u32` | `7` | SQLite: удаление ежедневных строк старше этого срока |
| `embedding_provider` | `string` | `"none"` | Провайдер эмбеддингов: `"none"`, `"openai"`, `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | Имя модели эмбеддингов |
| `embedding_dimensions` | `usize` | `1536` | Размерность вектора эмбеддингов |
| `vector_weight` | `f64` | `0.7` | Вес векторного сходства в гибридном поиске (0.0--1.0) |
| `keyword_weight` | `f64` | `0.3` | Вес ключевого поиска BM25 (0.0--1.0) |
| `min_relevance_score` | `f64` | `0.4` | Минимальный гибридный балл для включения памяти в контекст |
| `embedding_cache_size` | `usize` | `10000` | Макс. записей кэша эмбеддингов перед LRU-вытеснением |
| `snapshot_enabled` | `bool` | `false` | Экспорт ключевых воспоминаний в `MEMORY_SNAPSHOT.md` |
| `snapshot_on_hygiene` | `bool` | `false` | Снимок при выполнении гигиены |
| `auto_hydrate` | `bool` | `true` | Автозагрузка из снимка при отсутствии `brain.db` |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

Эвристический маршрутизатор LLM для многомодельных развёртываний. Оценивает кандидатные модели по взвешенной формуле, сочетающей возможности, рейтинг Elo, стоимость и задержку.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `false` | Включить эвристическую маршрутизацию |
| `alpha` | `f32` | `0.0` | Вес оценки сходства |
| `beta` | `f32` | `0.5` | Вес оценки возможностей |
| `gamma` | `f32` | `0.3` | Вес рейтинга Elo |
| `delta` | `f32` | `0.1` | Коэффициент штрафа за стоимость |
| `epsilon` | `f32` | `0.1` | Коэффициент штрафа за задержку |
| `knn_enabled` | `bool` | `false` | Включить семантическую маршрутизацию KNN из истории |
| `knn_min_records` | `usize` | `10` | Минимальное количество записей истории, чтобы KNN влиял на маршрутизацию |
| `knn_k` | `usize` | `7` | Количество ближайших соседей для голосования |

### `[router.automix]`

Адаптивная политика эскалации: начинаем с дешёвой модели, эскалируем на премиальную при снижении уверенности.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `false` | Включить эскалацию Automix |
| `confidence_threshold` | `f32` | `0.7` | Эскалировать при снижении уверенности ниже этого значения (0.0--1.0) |
| `cheap_model_tiers` | `string[]` | `[]` | Уровни моделей, считающиеся «сначала дешёвые» |
| `premium_model_id` | `string` | `""` | Модель, используемая для эскалации |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

Безопасность на уровне ОС: песочница, ограничения ресурсов и журнал аудита.

### `[security.sandbox]`

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool?` | `null` (автоопределение) | Включить изоляцию в песочнице |
| `backend` | `string` | `"auto"` | Бэкенд: `"auto"`, `"landlock"`, `"firejail"`, `"bubblewrap"`, `"docker"`, `"none"` |
| `firejail_args` | `string[]` | `[]` | Пользовательские аргументы Firejail |

### `[security.resources]`

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `max_memory_mb` | `u32` | `512` | Максимальная память на команду (МБ) |
| `max_cpu_time_seconds` | `u64` | `60` | Максимальное процессорное время на команду |
| `max_subprocesses` | `u32` | `10` | Максимальное количество подпроцессов |
| `memory_monitoring` | `bool` | `true` | Включить мониторинг использования памяти |

### `[security.audit]`

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `true` | Включить журнал аудита |
| `log_path` | `string` | `"audit.log"` | Путь к файлу журнала аудита (относительно каталога конфигурации) |
| `max_size_mb` | `u32` | `100` | Максимальный размер журнала перед ротацией |
| `sign_events` | `bool` | `false` | Подписывать события HMAC для защиты от подделки |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

Бэкенд метрик и распределённой трассировки.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `backend` | `string` | `"none"` | Бэкенд: `"none"`, `"log"`, `"prometheus"`, `"otel"` |
| `otel_endpoint` | `string?` | `null` | URL эндпоинта OTLP (например, `"http://localhost:4318"`) |
| `otel_service_name` | `string?` | `null` | Имя сервиса для OTel-коллектора (по умолчанию `"prx"`) |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

Интеграция сервера [Model Context Protocol](https://modelcontextprotocol.io/). PRX выступает как MCP-клиент, подключаясь к внешним MCP-серверам для получения дополнительных инструментов.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `false` | Включить интеграцию MCP-клиента |

### `[mcp.servers.<name>]`

Каждый именованный сервер — подсекция в `[mcp.servers]`.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `true` | Переключатель включения для сервера |
| `transport` | `"stdio" \| "http"` | `"stdio"` | Тип транспорта |
| `command` | `string?` | `null` | Команда для режима stdio |
| `args` | `string[]` | `[]` | Аргументы команды для режима stdio |
| `url` | `string?` | `null` | URL для HTTP-транспорта |
| `env` | `map<string, string>` | `{}` | Переменные окружения для режима stdio |
| `startup_timeout_ms` | `u64` | `10000` | Таймаут запуска |
| `request_timeout_ms` | `u64` | `30000` | Таймаут каждого запроса |
| `tool_name_prefix` | `string` | `"mcp"` | Префикс для имён предоставляемых инструментов |
| `allow_tools` | `string[]` | `[]` | Список разрешённых инструментов (пусто = все) |
| `deny_tools` | `string[]` | `[]` | Список запрещённых инструментов |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

Конфигурация инструмента автоматизации браузера.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `false` | Включить инструмент `browser_open` |
| `allowed_domains` | `string[]` | `[]` | Разрешённые домены (точное совпадение или поддомен) |
| `session_name` | `string?` | `null` | Именованная сессия браузера для автоматизации |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

Конфигурация инструментов веб-поиска и загрузки URL.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `false` | Включить инструмент `web_search` |
| `provider` | `string` | `"duckduckgo"` | Провайдер поиска: `"duckduckgo"` (бесплатный) или `"brave"` (требуется API-ключ) |
| `brave_api_key` | `string?` | `null` | API-ключ Brave Search |
| `max_results` | `usize` | `5` | Максимум результатов на запрос (1--10) |
| `timeout_secs` | `u64` | `15` | Таймаут запроса |
| `fetch_enabled` | `bool` | `true` | Включить инструмент `web_fetch` |
| `fetch_max_chars` | `usize` | `10000` | Макс. символов, возвращаемых `web_fetch` |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

Xin (сердце/разум) — автономный движок задач, планирующий и выполняющий фоновые задачи, включая эволюцию, проверки пригодности и операции гигиены.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `false` | Включить движок задач Xin |
| `interval_minutes` | `u32` | `5` | Интервал тика в минутах (минимум 1) |
| `max_concurrent` | `usize` | `4` | Максимум параллельно выполняемых задач за тик |
| `max_tasks` | `usize` | `128` | Максимум задач в хранилище |
| `stale_timeout_minutes` | `u32` | `60` | Минуты до пометки запущенной задачи как устаревшей |
| `builtin_tasks` | `bool` | `true` | Автоматическая регистрация встроенных системных задач |
| `evolution_integration` | `bool` | `false` | Позволить Xin управлять планированием эволюции/пригодности |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

Лимиты расходов и ценообразование по моделям для отслеживания затрат.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `false` | Включить отслеживание затрат |
| `daily_limit_usd` | `f64` | `10.0` | Дневной лимит расходов в USD |
| `monthly_limit_usd` | `f64` | `100.0` | Месячный лимит расходов в USD |
| `warn_at_percent` | `u8` | `80` | Предупреждать при достижении этого процента от лимита |
| `allow_override` | `bool` | `false` | Разрешить запросам превышать бюджет с флагом `--override` |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

Конфигурация повторных попыток и цепочки резервных провайдеров для устойчивого доступа.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `max_retries` | `u32` | `3` | Максимум повторных попыток при временных сбоях |
| `fallback_providers` | `string[]` | `[]` | Упорядоченный список имён резервных провайдеров |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

Зашифрованное хранилище учётных данных на основе ChaCha20-Poly1305.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `encrypt` | `bool` | `true` | Включить шифрование API-ключей и токенов в конфигурации |

## `[auth]`

Настройки импорта внешних учётных данных.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `codex_auth_json_auto_import` | `bool` | `true` | Автоимпорт OAuth-учётных данных из файла `auth.json` Codex CLI |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | Путь к файлу аутентификации Codex CLI |

## `[proxy]`

Конфигурация исходящего HTTP/HTTPS/SOCKS5 прокси.

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `false` | Включить прокси |
| `http_proxy` | `string?` | `null` | URL HTTP-прокси |
| `https_proxy` | `string?` | `null` | URL HTTPS-прокси |
| `all_proxy` | `string?` | `null` | Резервный прокси для всех схем |
| `no_proxy` | `string[]` | `[]` | Список обхода (тот же формат, что и `NO_PROXY`) |
| `scope` | `string` | `"zeroclaw"` | Область: `"environment"`, `"zeroclaw"`, `"services"` |
| `services` | `string[]` | `[]` | Селекторы сервисов для области `"services"` |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```

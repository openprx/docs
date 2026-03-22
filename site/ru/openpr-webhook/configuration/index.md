---
title: Справочник конфигурации
description: "Полная схема TOML-конфигурации OpenPR-Webhook: сервер, безопасность, флаги функций, runtime, туннель и агенты."
---

# Справочник конфигурации

OpenPR-Webhook использует единый файл конфигурации TOML. По умолчанию он ищет `config.toml` в текущей директории. Вы можете указать пользовательский путь как первый аргумент командной строки.

## Полная схема

```toml
# ─── Server ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # Адрес и порт привязки

# ─── Security ─────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # HMAC-SHA256 секреты (поддерживает ротацию)
allow_unsigned = false                     # Разрешить неподписанные запросы (по умолчанию: false)

# ─── Feature Flags ────────────────────────────────────────
[features]
tunnel_enabled = false                 # Включить подсистему WSS-туннеля (по умолчанию: false)
cli_enabled = false                    # Включить исполнитель CLI-агентов (по умолчанию: false)
callback_enabled = false               # Включить обратные вызовы переходов состояний (по умолчанию: false)

# ─── Runtime Tuning ───────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # Макс. одновременных CLI-задач (по умолчанию: 1)
http_timeout_secs = 15                 # Таймаут HTTP-клиента (по умолчанию: 15)
tunnel_reconnect_backoff_max_secs = 60 # Макс. задержка переподключения туннеля (по умолчанию: 60)

# ─── WSS Tunnel ───────────────────────────────────────────
[tunnel]
enabled = false                        # Включить этот экземпляр туннеля (по умолчанию: false)
url = "wss://control.example.com/ws"   # URL WebSocket
agent_id = "my-agent"                  # Идентификатор агента
auth_token = "bearer-token"            # Bearer-токен авторизации
reconnect_secs = 3                     # Базовый интервал переподключения (по умолчанию: 3)
heartbeat_secs = 20                    # Интервал heartbeat (по умолчанию: 20, мин: 3)
hmac_secret = "envelope-signing-key"   # Секрет HMAC-подписи конверта
require_inbound_sig = false            # Требовать подписи входящих сообщений (по умолчанию: false)

# ─── Agents ───────────────────────────────────────────────

# --- OpenClaw Agent ---
[[agents]]
id = "notify-signal"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- OpenPRX Agent (HTTP API mode) ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- OpenPRX Agent (CLI mode) ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Webhook Agent ---
[[agents]]
id = "forward-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # Опционально: подпись исходящих запросов

# --- Custom Agent ---
[[agents]]
id = "custom-script"
name = "Custom Script"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- CLI Agent ---
[[agents]]
id = "ai-coder"
name = "AI Coder"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
```

## Справочник секций

### `[server]`

| Поле | Тип | Обязательное | По умолчанию | Описание |
|------|-----|-------------|------------|----------|
| `listen` | String | Да | — | TCP-адрес привязки в формате `host:port` |

### `[security]`

| Поле | Тип | Обязательное | По умолчанию | Описание |
|------|-----|-------------|------------|----------|
| `webhook_secrets` | Массив строк | Нет | `[]` | Список допустимых HMAC-SHA256 секретов для верификации входящих запросов. Несколько секретов поддерживают ротацию ключей. |
| `allow_unsigned` | Boolean | Нет | `false` | Принимать неподписанные запросы без верификации подписи. **Не рекомендуется для продакшена.** |

**Верификация подписи** проверяет два заголовка по порядку:
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

Значение заголовка должно быть в формате `sha256={hex-digest}`. Сервис пробует каждый секрет из `webhook_secrets` до совпадения.

### `[features]`

Все флаги функций по умолчанию `false`. Этот подход защиты в глубину обеспечивает явное включение опасных функций.

| Поле | Тип | По умолчанию | Описание |
|------|-----|------------|----------|
| `tunnel_enabled` | Boolean | `false` | Включить подсистему WSS-туннеля |
| `cli_enabled` | Boolean | `false` | Включить исполнитель CLI-агентов |
| `callback_enabled` | Boolean | `false` | Включить обратные вызовы переходов состояний |

### `[runtime]`

| Поле | Тип | По умолчанию | Описание |
|------|-----|------------|----------|
| `cli_max_concurrency` | Integer | `1` | Максимальное количество одновременных задач CLI-агентов |
| `http_timeout_secs` | Integer | `15` | Таймаут исходящих HTTP-запросов (пересылка webhook, обратные вызовы, Signal API) |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | Максимальный интервал задержки переподключения туннеля |

### `[tunnel]`

Подробную документацию см. в [WSS-туннель](../tunnel/index.md).

### `[[agents]]`

Подробную документацию см. в [Типы агентов](../agents/index.md) и [Справочник исполнителей](../agents/executors.md).

## Переменные окружения

| Переменная | Описание |
|-----------|----------|
| `OPENPR_WEBHOOK_SAFE_MODE` | Установите `1`, `true`, `yes` или `on` для отключения функций туннеля, CLI и обратного вызова независимо от конфигурации. Полезно для аварийной блокировки. |
| `RUST_LOG` | Управляет детализацией логирования. По умолчанию: `openpr_webhook=info`. Примеры: `openpr_webhook=debug`, `openpr_webhook=trace` |

## Безопасный режим

Установка `OPENPR_WEBHOOK_SAFE_MODE=1` отключает:

- Выполнение CLI-агентов (`cli_enabled` принудительно `false`)
- Отправку обратных вызовов (`callback_enabled` принудительно `false`)
- WSS-туннель (`tunnel_enabled` принудительно `false`)

Небезопасные агенты (openclaw, openprx, webhook, custom) продолжают работать нормально. Это позволяет быстро заблокировать сервис без изменения файла конфигурации.

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## Минимальная конфигурация

Наименьшая допустимая конфигурация:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

Запускает сервис без агентов и без верификации подписи. Полезно только для разработки.

## Контрольный список для продакшена

- [ ] Установить хотя бы одну запись в `webhook_secrets`
- [ ] Установить `allow_unsigned = false`
- [ ] Настроить хотя бы одного агента
- [ ] При использовании CLI-агентов: установить `cli_enabled = true` и проверить белый список исполнителей
- [ ] При использовании туннеля: использовать `wss://` (не `ws://`), установить `hmac_secret` и `require_inbound_sig = true`
- [ ] Установить `RUST_LOG=openpr_webhook=info` (избегать `debug`/`trace` в продакшене для производительности)
- [ ] Рассмотреть запуск с `OPENPR_WEBHOOK_SAFE_MODE=1` изначально для проверки функциональности без CLI

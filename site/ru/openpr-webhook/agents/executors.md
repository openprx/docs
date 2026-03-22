---
title: Справочник исполнителей
description: "Подробная документация по всем 5 типам исполнителей OpenPR-Webhook: openclaw, openprx, webhook, custom и cli."
---

# Справочник исполнителей

На этой странице подробно документированы все 5 типов исполнителей, включая их поля конфигурации, поведение и примеры.

## openclaw

Отправляет уведомления через платформы обмена сообщениями (Signal, Telegram) с помощью инструмента CLI OpenClaw.

**Принцип работы:** Формирует shell-команду, которая вызывает бинарный файл OpenClaw с аргументами `--channel`, `--target` и `--message`.

**Конфигурация:**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # Путь к бинарному файлу OpenClaw
channel = "signal"                     # Канал: "signal" или "telegram"
target = "+1234567890"                 # Номер телефона, ID группы или имя канала
```

**Поля:**

| Поле | Обязательное | Описание |
|------|-------------|----------|
| `command` | Да | Путь к CLI-бинарному файлу OpenClaw |
| `channel` | Да | Канал обмена сообщениями (`signal`, `telegram`) |
| `target` | Да | Идентификатор получателя (номер телефона, ID группы и т.д.) |

---

## openprx

Отправляет сообщения через инфраструктуру обмена сообщениями OpenPRX. Поддерживает два режима: HTTP API (Signal daemon) или CLI-команда.

**Режим 1: Signal API (предпочтительный)**

Отправляет JSON POST на REST API daemon signal-cli:

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # Базовый URL REST API signal-cli
account = "+1234567890"                 # Номер телефона отправителя
target = "+0987654321"                  # Номер телефона или UUID получателя
channel = "signal"                      # По умолчанию: "signal"
```

HTTP-запрос, отправляемый к Signal API:

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**Режим 2: CLI-команда**

Откатывается к выполнению shell-команды, если `signal_api` не задан:

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**Поля:**

| Поле | Обязательное | Описание |
|------|-------------|----------|
| `signal_api` | Нет | Базовый URL HTTP API Signal daemon |
| `account` | Нет | Номер телефона аккаунта (используется с `signal_api`) |
| `target` | Да | Номер телефона или UUID получателя |
| `channel` | Нет | Имя канала (по умолчанию: `signal`) |
| `command` | Нет | CLI-команда (откат, когда `signal_api` не задан) |

Должно быть указано хотя бы одно из `signal_api` или `command`.

---

## webhook

Пересылает полный webhook-payload как есть на HTTP-эндпоинт. Полезно для интеграции с Slack, Discord, пользовательскими API или цепочки к другому webhook-сервису.

**Принцип работы:** Отправляет JSON POST на настроенный URL с оригинальным payload. Опционально подписывает исходящие запросы с помощью HMAC-SHA256.

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Опционально: подпись исходящих запросов
```

**Поля:**

| Поле | Обязательное | Описание |
|------|-------------|----------|
| `url` | Да | Целевой URL |
| `secret` | Нет | Секрет HMAC-SHA256 для исходящей подписи (отправляется как заголовок `X-Webhook-Signature`) |

При установке `secret`, исходящий запрос включает заголовок `X-Webhook-Signature: sha256=...`, вычисленный над телом JSON, позволяя принимающей стороне проверить подлинность.

---

## custom

Выполняет произвольную shell-команду, передавая отформатированное сообщение в качестве аргумента. Полезно для пользовательских интеграций, логирования или запуска внешних скриптов.

**Принцип работы:** Запускает `sh -c '{command} "{message}"'`, где `{message}` — отрисованный шаблон со специальными экранированными символами.

```toml
[[agents]]
id = "custom-logger"
name = "Log to File"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # Опциональные дополнительные аргументы
```

**Поля:**

| Поле | Обязательное | Описание |
|------|-------------|----------|
| `command` | Да | Путь к исполняемому файлу или shell-команда |
| `args` | Нет | Дополнительные аргументы командной строки |

**Примечание по безопасности:** Пользовательский исполнитель запускает shell-команды. Убедитесь, что путь к команде надёжен и не контролируется пользователем.

---

## cli

Выполняет AI-кодирующие агенты для обработки задач. Это наиболее мощный тип исполнителя, предназначенный для автоматической генерации кода и решения задач.

**Требует:** `features.cli_enabled = true` в конфигурации. Блокируется при `OPENPR_WEBHOOK_SAFE_MODE=1`.

**Поддерживаемые исполнители (белый список):**

| Исполнитель | Бинарный | Паттерн команды |
|------------|--------|----------------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

Любой исполнитель, не входящий в этот белый список, будет отклонён.

**Конфигурация:**

```toml
[features]
cli_enabled = true
callback_enabled = true  # Требуется для переходов состояний

[[agents]]
id = "my-coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # Один из: codex, claude-code, opencode
workdir = "/opt/projects/backend"      # Рабочая директория для CLI-инструмента
timeout_secs = 900                     # Таймаут в секундах (по умолчанию: 900)
max_output_chars = 12000               # Макс. символов для захвата из stdout/stderr (по умолчанию: 12000)
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"

# Переходы состояний (требует callback_enabled)
update_state_on_start = "in_progress"  # Установить состояние задачи при запуске
update_state_on_success = "done"       # Установить состояние задачи при успехе
update_state_on_fail = "todo"          # Установить состояние задачи при ошибке/таймауте

# Конфигурация обратного вызова
callback = "mcp"                       # Режим обратного вызова: "mcp" или "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # Опциональный Bearer-токен для обратного вызова
```

**Поля:**

| Поле | Обязательное | По умолчанию | Описание |
|------|-------------|------------|----------|
| `executor` | Да | — | Имя CLI-инструмента (`codex`, `claude-code`, `opencode`) |
| `workdir` | Нет | — | Рабочая директория |
| `timeout_secs` | Нет | 900 | Таймаут процесса |
| `max_output_chars` | Нет | 12000 | Лимит захвата хвоста вывода |
| `prompt_template` | Нет | `Fix issue {issue_id}: {title}\nContext: {reason}` | Промпт, отправляемый CLI-инструменту |
| `update_state_on_start` | Нет | — | Состояние задачи при запуске |
| `update_state_on_success` | Нет | — | Состояние задачи при успехе |
| `update_state_on_fail` | Нет | — | Состояние задачи при ошибке или таймауте |
| `callback` | Нет | `mcp` | Протокол обратного вызова (`mcp` или `api`) |
| `callback_url` | Нет | — | URL для отправки обратных вызовов |
| `callback_token` | Нет | — | Bearer-токен для аутентификации обратного вызова |

**Заполнители шаблона промпта (специфичные для cli):**

| Заполнитель | Источник |
|------------|--------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**Payload обратного вызова (режим MCP):**

При `callback = "mcp"`, сервис отправляет JSON-RPC-подобный POST на `callback_url`:

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**Жизненный цикл перехода состояний:**

```
Событие получено
    |
    v
[update_state_on_start] --> состояние задачи = "in_progress"
    |
    v
CLI-инструмент запущен (до timeout_secs)
    |
    +-- успех --> [update_state_on_success] --> состояние задачи = "done"
    |
    +-- ошибка --> [update_state_on_fail] --> состояние задачи = "todo"
    |
    +-- таймаут --> [update_state_on_fail] --> состояние задачи = "todo"
```

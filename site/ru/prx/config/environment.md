---
title: Переменные окружения
description: Переменные окружения для конфигурации PRX — API-ключи, пути и переопределения во время работы.
---

# Переменные окружения

PRX читает переменные окружения для API-ключей, путей конфигурации и переопределений во время работы. Переменные окружения имеют приоритет над значениями в `config.toml` для критически важных с точки зрения безопасности полей, таких как API-ключи.

## Пути конфигурации

| Переменная | По умолчанию | Описание |
|------------|--------------|----------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | Переопределение каталога конфигурации. PRX ищет `config.toml` и `config.d/` внутри этого каталога |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | Переопределение каталога рабочей области (память, сессии, данные) |

Когда `OPENPRX_CONFIG_DIR` задана, она имеет приоритет над `OPENPRX_WORKSPACE` и маркером активной рабочей области.

Порядок определения каталога конфигурации:

1. `OPENPRX_CONFIG_DIR` (наивысший приоритет)
2. `OPENPRX_WORKSPACE`
3. Маркер активной рабочей области (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (по умолчанию)

## API-ключи провайдеров

Для каждого провайдера существует выделенная переменная окружения. PRX проверяет их перед обращением к полю `api_key` в `config.toml`.

### Основные провайдеры

| Переменная | Провайдер |
|------------|-----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini (альтернативная) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama (обычно не требуется) |
| `GLM_API_KEY` | Zhipu GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### OAuth-токены

Некоторые провайдеры поддерживают OAuth-аутентификацию в дополнение к (или вместо) API-ключей:

| Переменная | Провайдер | Описание |
|------------|-----------|----------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | OAuth-токен Claude Code |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | Токен доступа Claude Code (альтернативный) |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | Токен обновления Claude Code для автопродления |
| `MINIMAX_OAUTH_TOKEN` | Minimax | OAuth-токен доступа Minimax |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | OAuth-токен обновления Minimax |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | Переопределение ID клиента OAuth |
| `MINIMAX_OAUTH_REGION` | Minimax | Регион OAuth (`global` или `cn`) |
| `QWEN_OAUTH_TOKEN` | Qwen | OAuth-токен доступа Qwen |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | OAuth-токен обновления Qwen |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | Переопределение ID клиента OAuth Qwen |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | Переопределение URL ресурса OAuth Qwen |

### Совместимые / сторонние провайдеры

| Переменная | Провайдер |
|------------|-----------|
| `GROQ_API_KEY` | Groq |
| `MISTRAL_API_KEY` | Mistral |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `XAI_API_KEY` | xAI (Grok) |
| `TOGETHER_API_KEY` | Together AI |
| `FIREWORKS_API_KEY` | Fireworks AI |
| `PERPLEXITY_API_KEY` | Perplexity |
| `COHERE_API_KEY` | Cohere |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `VENICE_API_KEY` | Venice |
| `LLAMACPP_API_KEY` | llama.cpp server |
| `KIMI_CODE_API_KEY` | Kimi Code (Moonshot) |
| `QIANFAN_API_KEY` | Baidu Qianfan |
| `CLOUDFLARE_API_KEY` | Cloudflare AI |
| `VERCEL_API_KEY` | Vercel AI |

### Резервный вариант

| Переменная | Описание |
|------------|----------|
| `API_KEY` | Общий резервный вариант, используемый когда провайдер-специфичная переменная не задана |

## Переменные инструментов и каналов

| Переменная | Описание |
|------------|----------|
| `BRAVE_API_KEY` | API-ключ Brave Search (для `[web_search]` с `provider = "brave"`) |
| `GITHUB_TOKEN` | Персональный токен доступа GitHub (используется навыками и интеграциями) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Путь к файлу Google Cloud ADC (Gemini через сервисный аккаунт) |

## Переменные времени выполнения

| Переменная | Описание |
|------------|----------|
| `OPENPRX_VERSION` | Переопределение строки отображаемой версии |
| `OPENPRX_AUTOSTART_CHANNELS` | Установите в `"1"` для автоматического запуска слушателей каналов при загрузке |
| `OPENPRX_EVOLUTION_CONFIG` | Переопределение пути к конфигурации эволюции |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | Включение необработанного отладочного логирования эволюции |

## Подстановка переменных в конфигурации

PRX **не** поддерживает нативное раскрытие синтаксиса `${VAR_NAME}` внутри `config.toml`. Однако подстановку переменных окружения можно реализовать следующими способами:

### 1. Использование переменных окружения напрямую

Для API-ключей PRX автоматически проверяет соответствующую переменную окружения. Их не нужно указывать в файле конфигурации:

```toml
# api_key не нужен -- PRX автоматически проверяет ANTHROPIC_API_KEY
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. Использование обёртки оболочки

Генерация `config.toml` из шаблона с помощью `envsubst` или аналогичного инструмента:

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. Использование разделённой конфигурации с секретами

Храните секреты в отдельном файле, генерируемом из переменных окружения при развёртывании:

```bash
# Генерация фрагмента секретов
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## Поддержка файлов `.env`

PRX не загружает файлы `.env` автоматически. Если вам нужна поддержка файлов `.env`, используйте один из следующих подходов:

### С systemd

Добавьте `EnvironmentFile` в ваш юнит-файл сервиса:

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### С обёрткой оболочки

Загрузите файл `.env` перед запуском PRX:

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### С direnv

Если вы используете [direnv](https://direnv.net/), разместите файл `.envrc` в вашем рабочем каталоге:

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## Рекомендации по безопасности

- **Никогда не коммитьте API-ключи** в систему контроля версий. Используйте переменные окружения или зашифрованные секреты.
- Подсистема `[secrets]` PRX шифрует чувствительные поля в `config.toml` с помощью ChaCha20-Poly1305. Включите её через `[secrets] encrypt = true` (включена по умолчанию).
- `.dockerignore`, поставляемый с PRX, исключает файлы `.env` и `.env.*` из сборок контейнеров.
- Журналы аудита автоматически маскируют API-ключи и токены.
- При использовании `OPENPRX_CONFIG_DIR` для указания на общий каталог убедитесь в корректности прав доступа к файлам (`chmod 600 config.toml`).

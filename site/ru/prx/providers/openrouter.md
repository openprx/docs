---
title: OpenRouter
description: Настройка OpenRouter в качестве LLM-провайдера в PRX
---

# OpenRouter

> Доступ к 200+ моделям от нескольких провайдеров (OpenAI, Anthropic, Google, Meta, Mistral и другие) через единый API-ключ и унифицированный интерфейс.

## Предварительные требования

- API-ключ OpenRouter с [openrouter.ai](https://openrouter.ai/)

## Быстрая настройка

### 1. Получение API-ключа

1. Зарегистрируйтесь на [openrouter.ai](https://openrouter.ai/)
2. Перейдите в **Keys** в панели управления
3. Нажмите **Create Key** и скопируйте его (начинается с `sk-or-`)

### 2. Конфигурация

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[providers.openrouter]
api_key = "${OPENROUTER_API_KEY}"
```

Или задайте переменную окружения:

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. Проверка

```bash
prx doctor models
```

## Доступные модели

OpenRouter предоставляет доступ к сотням моделей. Некоторые популярные варианты:

| Модель | Провайдер | Контекст | Зрение | Вызов инструментов | Примечания |
|--------|-----------|----------|--------|-------------------|------------|
| `anthropic/claude-sonnet-4` | Anthropic | 200K | Да | Да | Claude Sonnet 4 |
| `anthropic/claude-opus-4` | Anthropic | 200K | Да | Да | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | Да | Да | GPT-4o |
| `openai/o3` | OpenAI | 128K | Да | Да | Модель рассуждения |
| `google/gemini-2.5-pro` | Google | 1M | Да | Да | Gemini Pro |
| `google/gemini-2.5-flash` | Google | 1M | Да | Да | Gemini Flash |
| `meta-llama/llama-3.1-405b-instruct` | Meta | 128K | Нет | Да | Крупнейшая открытая модель |
| `deepseek/deepseek-chat` | DeepSeek | 128K | Нет | Да | DeepSeek V3 |
| `mistralai/mistral-large` | Mistral | 128K | Нет | Да | Mistral Large |
| `x-ai/grok-2` | xAI | 128K | Нет | Да | Grok 2 |

Полный список моделей доступен на [openrouter.ai/models](https://openrouter.ai/models).

## Справочник конфигурации

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `api_key` | string | обязательный | API-ключ OpenRouter (`sk-or-...`) |
| `model` | string | обязательный | ID модели в формате `provider/model` |

## Возможности

### Единый мультипровайдерный доступ

С одним API-ключом OpenRouter вы можете получить доступ к моделям от OpenAI, Anthropic, Google, Meta, Mistral, Cohere и многих других. Это избавляет от необходимости управлять несколькими API-ключами.

### OpenAI-совместимый API

OpenRouter предоставляет OpenAI-совместимый Chat Completions API по адресу `https://openrouter.ai/api/v1/chat/completions`. PRX отправляет запросы с:

- `Authorization: Bearer <key>` для аутентификации
- `HTTP-Referer: https://github.com/theonlyhennygod/openprx` для идентификации приложения
- `X-Title: OpenPRX` для атрибуции имени приложения

### Нативный вызов инструментов

Инструменты отправляются в нативном формате вызова функций OpenAI. Провайдер поддерживает `tool_choice: "auto"` и корректно обрабатывает структурированные ответы с вызовами инструментов, включая маппинг `tool_call_id` для многоходовых взаимодействий с инструментами.

### Многоходовая история разговора

Полная история разговора сохраняется с корректным структурированным форматированием:
- Сообщения ассистента с вызовами инструментов сериализуются с массивами `tool_calls`
- Сообщения с результатами инструментов включают ссылки `tool_call_id`
- Системные, пользовательские и сообщения ассистента передаются напрямую

### Прогрев соединения

При запуске PRX отправляет лёгкий запрос на `https://openrouter.ai/api/v1/auth/key` для проверки API-ключа и установки TLS/HTTP2-пула соединений.

### Маршрутизация моделей

OpenRouter поддерживает маршрутизацию моделей и откат на уровне API. Вы также можете использовать встроенный `fallback_providers` PRX для клиентского отката:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[reliability]
fallback_providers = ["openai"]
```

## Провайдер по умолчанию

OpenRouter является провайдером PRX по умолчанию. Если в конфигурации не указан `provider`, PRX по умолчанию использует OpenRouter.

## Устранение неполадок

### «OpenRouter API key not set»

Задайте переменную окружения `OPENROUTER_API_KEY` или добавьте `api_key` в секцию `[providers.openrouter]` вашего `config.toml`. Вы также можете выполнить `prx onboard` для интерактивной настройки.

### 402 Payment Required

На вашем аккаунте OpenRouter недостаточно средств. Пополните баланс на [openrouter.ai/credits](https://openrouter.ai/credits).

### Ошибки, специфичные для моделей

Разные модели на OpenRouter имеют разные возможности и лимиты частоты. Если конкретная модель возвращает ошибки:
- Проверьте, поддерживает ли модель вызов инструментов (не все поддерживают)
- Убедитесь, что модель не устарела на OpenRouter
- Попробуйте другой вариант модели

### Медленные ответы

OpenRouter маршрутизирует к базовому провайдеру. Время ответа зависит от:
- Текущей нагрузки на провайдера модели
- Вашего географического расстояния от провайдера
- Размера модели и длины контекста

Рассмотрите использование `fallback_providers` для переключения на прямое подключение к провайдеру при медленных ответах OpenRouter.

### Ограничение частоты запросов

OpenRouter имеет собственные лимиты частоты в дополнение к лимитам базовых провайдеров. При ограничении:
- Проверьте использование на [openrouter.ai/usage](https://openrouter.ai/usage)
- Обновите план для повышения лимитов
- Используйте обёртку reliable provider PRX для автоматических повторов с задержкой

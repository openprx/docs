---
title: Custom Compatible
description: Настройка любого OpenAI-совместимого API-эндпоинта в качестве LLM-провайдера в PRX
---

# Custom Compatible

> Подключение PRX к любому LLM API, следующему формату OpenAI Chat Completions. Работает с LiteLLM, vLLM, Groq, Mistral, xAI, Venice, Vercel AI, Cloudflare AI, HuggingFace Inference и любым другим OpenAI-совместимым сервисом.

## Предварительные требования

- Работающий LLM API, реализующий формат OpenAI Chat Completions (`/v1/chat/completions` или `/chat/completions`)
- API-ключ (если требуется сервисом)

## Быстрая настройка

### 1. Определение эндпоинта

Определите базовый URL и метод аутентификации для вашего API. Например:

- Groq: `https://api.groq.com/openai/v1`
- Mistral: `https://api.mistral.ai/v1`
- xAI: `https://api.x.ai/v1`
- Локальный vLLM: `http://localhost:8000/v1`
- LiteLLM прокси: `http://localhost:4000`

### 2. Конфигурация

```toml
[default]
provider = "compatible"
model = "your-model-name"

[providers.compatible]
api_key = "${YOUR_API_KEY}"
api_url = "https://api.your-provider.com/v1"
```

### 3. Проверка

```bash
prx doctor models
```

## Встроенные совместимые провайдеры

PRX включает преднастроенные псевдонимы для популярных OpenAI-совместимых сервисов:

| Имя провайдера | Псевдонимы | Базовый URL | Стиль аутентификации |
|----------------|------------|-------------|---------------------|
| Venice | `venice` | `https://api.venice.ai` | Bearer |
| Vercel AI | `vercel`, `vercel-ai` | `https://api.vercel.ai` | Bearer |
| Cloudflare AI | `cloudflare`, `cloudflare-ai` | `https://gateway.ai.cloudflare.com/v1` | Bearer |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Bearer |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Bearer |
| xAI | `xai`, `grok` | `https://api.x.ai/v1` | Bearer |
| Qianfan | `qianfan`, `baidu` | `https://aip.baidubce.com` | Bearer |
| Synthetic | `synthetic` | `https://api.synthetic.com` | Bearer |
| OpenCode Zen | `opencode`, `opencode-zen` | `https://opencode.ai/zen/v1` | Bearer |
| LiteLLM | `litellm`, `lite-llm` | настраиваемый | Bearer |
| vLLM | `vllm`, `v-llm` | настраиваемый | Bearer |
| HuggingFace | `huggingface`, `hf` | настраиваемый | Bearer |

## Справочник конфигурации

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `api_key` | string | опционально | API-ключ аутентификации |
| `api_url` | string | обязательный | Базовый URL эндпоинта API |
| `model` | string | обязательный | Имя/ID модели |
| `auth_style` | string | `"bearer"` | Стиль заголовка аутентификации (см. ниже) |

### Стили аутентификации

| Стиль | Формат заголовка | Использование |
|-------|-----------------|---------------|
| `bearer` | `Authorization: Bearer <key>` | Большинство провайдеров (по умолчанию) |
| `x-api-key` | `x-api-key: <key>` | Некоторые китайские провайдеры |
| `custom` | Пользовательское имя заголовка | Специальные случаи |

## Возможности

### Автоматическое определение эндпоинта

PRX автоматически добавляет `/chat/completions` к вашему базовому URL. Не нужно включать путь эндпоинта:

```toml
# Корректно - PRX добавляет /chat/completions
api_url = "https://api.groq.com/openai/v1"

# Тоже корректно - явный путь работает
api_url = "https://api.groq.com/openai/v1/chat/completions"
```

### Резервный Responses API

Для провайдеров, поддерживающих более новый Responses API OpenAI, PRX может переключиться на `/v1/responses` при получении 404 от `/v1/chat/completions`. Это включено по умолчанию, но может быть отключено для провайдеров, которые его не поддерживают (например, GLM/Zhipu).

### Нативный вызов инструментов

Инструменты отправляются в стандартном формате вызова функций OpenAI:

```json
{
  "type": "function",
  "function": {
    "name": "tool_name",
    "description": "Tool description",
    "parameters": { "type": "object", "properties": {...} }
  }
}
```

Провайдер поддерживает `tool_choice: "auto"` и корректно десериализует структурированные ответы `tool_calls`.

### Поддержка зрения

Для моделей с поддержкой зрения изображения, встроенные в сообщения как маркеры `[IMAGE:data:image/png;base64,...]`, автоматически конвертируются в формат зрения OpenAI с блоками содержимого `image_url`.

### Поддержка стриминга

Совместимый провайдер поддерживает SSE-стриминг для доставки токенов в реальном времени. События потока парсятся инкрементально с поддержкой:
- Чанков текста `delta.content`
- `delta.tool_calls` для инкрементального построения вызовов инструментов
- Обнаружение маркера `[DONE]`
- Корректная обработка таймаутов

### Объединение системных сообщений

Некоторые провайдеры (например, MiniMax) отклоняют сообщения `role: system`. PRX может автоматически объединять содержимое системного сообщения с первым сообщением пользователя. Это включено по умолчанию для известных несовместимых провайдеров.

### Принудительный режим HTTP/1.1

Некоторые провайдеры (особенно DashScope/Qwen) требуют HTTP/1.1 вместо HTTP/2. PRX автоматически определяет эти эндпоинты и принудительно использует HTTP/1.1 для надёжности соединения.

### Резервное содержимое рассуждения

Для моделей рассуждения, возвращающих вывод в `reasoning_content` вместо `content`, PRX автоматически извлекает текст рассуждения.

## Расширенная конфигурация

### Локальный LLM-сервер (vLLM, llama.cpp и т.д.)

```toml
[default]
provider = "compatible"
model = "meta-llama/Llama-3.1-8B-Instruct"

[providers.compatible]
api_url = "http://localhost:8000/v1"
# api_key не нужен для локальных серверов
```

### LiteLLM Proxy

```toml
[default]
provider = "litellm"
model = "gpt-4o"

[providers.litellm]
api_key = "${LITELLM_API_KEY}"
api_url = "http://localhost:4000"
```

### Несколько пользовательских провайдеров

Используйте маршрутизатор моделей для настройки нескольких совместимых провайдеров:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[[model_routes]]
pattern = "groq/*"
provider = "compatible"
api_url = "https://api.groq.com/openai/v1"
api_key = "${GROQ_API_KEY}"

[[model_routes]]
pattern = "mistral/*"
provider = "compatible"
api_url = "https://api.mistral.ai/v1"
api_key = "${MISTRAL_API_KEY}"
```

## Устранение неполадок

### Соединение отклонено

Убедитесь, что эндпоинт API доступен:
```bash
curl -v https://api.your-provider.com/v1/models
```

### 401 Unauthorized

- Проверьте корректность API-ключа
- Убедитесь, что стиль аутентификации соответствует вашему провайдеру (Bearer или x-api-key)
- Некоторые провайдеры требуют дополнительных заголовков; используйте именованный псевдоним провайдера, если доступен

### «role: system» отклонён

Если ваш провайдер не поддерживает системные сообщения, PRX должен обработать это автоматически для известных провайдеров. Для пользовательских эндпоинтов это ограничение провайдера. Обходной путь: включите системные инструкции в первое сообщение пользователя.

### Стриминг не работает

Не все OpenAI-совместимые API поддерживают стриминг. При сбое стриминга PRX автоматически переключается в нестриминговый режим.

### Модель не найдена

Проверьте точное имя/ID модели, которое ожидает ваш провайдер. Разные провайдеры используют разные соглашения об именовании:
- Groq: `llama-3.3-70b-versatile`
- Mistral: `mistral-large-latest`
- xAI: `grok-2`

Обратитесь к документации вашего провайдера для корректных идентификаторов моделей.

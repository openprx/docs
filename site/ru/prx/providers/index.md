---
title: LLM-провайдеры
description: Обзор 9+ LLM-провайдеров, поддерживаемых PRX, включая матрицу возможностей, конфигурацию, цепочки отката и маршрутизацию.
---

# LLM-провайдеры

PRX подключается к большим языковым моделям через **провайдеров** — подключаемые бэкенды, реализующие трейт `Provider`. Каждый провайдер обрабатывает аутентификацию, форматирование запросов, потоковую передачу и классификацию ошибок для конкретного LLM API.

PRX поставляется с 9 встроенными провайдерами, OpenAI-совместимым эндпоинтом для сторонних сервисов, а также инфраструктурой для цепочек отката и интеллектуальной маршрутизации.

## Матрица возможностей

| Провайдер | Ключевые модели | Стриминг | Зрение | Вызов инструментов | OAuth | Самохостинг |
|-----------|----------------|----------|--------|-------------------|-------|-------------|
| [Anthropic](/ru/prx/providers/anthropic) | Claude Opus 4, Claude Sonnet 4 | Да | Да | Да | Да (Claude Code) | Нет |
| [OpenAI](/ru/prx/providers/openai) | GPT-4o, o1, o3 | Да | Да | Да | Нет | Нет |
| [Google Gemini](/ru/prx/providers/google-gemini) | Gemini 2.0 Flash, Gemini 1.5 Pro | Да | Да | Да | Да (Gemini CLI) | Нет |
| [OpenAI Codex](/ru/prx/providers/openai-codex) | Модели Codex | Да | Нет | Да | Да | Нет |
| [GitHub Copilot](/ru/prx/providers/github-copilot) | Модели Copilot Chat | Да | Нет | Да | Да (Device Flow) | Нет |
| [Ollama](/ru/prx/providers/ollama) | Llama 3, Mistral, Qwen, любой GGUF | Да | Зависит от модели | Да | Нет | Да |
| [AWS Bedrock](/ru/prx/providers/aws-bedrock) | Claude, Titan, Llama | Да | Зависит от модели | Зависит от модели | AWS IAM | Нет |
| [GLM](/ru/prx/providers/glm) | GLM-4, Zhipu, Minimax, Moonshot, Qwen, Z.AI | Да | Зависит от модели | Зависит от модели | Да (Minimax/Qwen) | Нет |
| [OpenRouter](/ru/prx/providers/openrouter) | 200+ моделей от разных вендоров | Да | Зависит от модели | Зависит от модели | Нет | Нет |
| [Custom Compatible](/ru/prx/providers/custom-compatible) | Любой OpenAI-совместимый API | Да | Зависит от эндпоинта | Зависит от эндпоинта | Нет | Да |

## Быстрая конфигурация

Провайдеры настраиваются в `~/.config/openprx/config.toml` (или `~/.openprx/config.toml`). Как минимум, укажите провайдера по умолчанию и API-ключ:

```toml
# Выбор провайдера и модели по умолчанию
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API-ключ (можно также задать через переменную окружения ANTHROPIC_API_KEY)
api_key = "sk-ant-..."
```

Для самохостинговых провайдеров, таких как Ollama, укажите эндпоинт:

```toml
default_provider = "ollama"
default_model = "llama3:70b"
api_url = "http://localhost:11434"
```

Каждый провайдер определяет свой API-ключ из следующих источников (в порядке приоритета):

1. Поле `api_key` в `config.toml`
2. Переменная окружения конкретного провайдера (например, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
3. Общая переменная окружения `API_KEY`

См. [Переменные окружения](/ru/prx/config/environment) для полного списка поддерживаемых переменных.

## Цепочки отката с ReliableProvider

PRX оборачивает вызовы провайдеров в слой `ReliableProvider`, который обеспечивает:

- **Автоматические повторы** с экспоненциальной задержкой для транзитных ошибок (5xx, 429 rate limit, таймауты сети)
- **Цепочки отката** — при сбое основного провайдера запросы автоматически перенаправляются к следующему провайдеру в цепочке
- **Обнаружение неповторяемых ошибок** — клиентские ошибки вроде недействительных API-ключей (401/403) и неизвестных моделей (404) завершаются быстро без траты попыток

Настройка надёжности в секции `[reliability]`:

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

Когда основной провайдер (например, Anthropic) возвращает транзитную ошибку, PRX повторяет попытки до `max_retries` раз с задержкой. Если все попытки исчерпаны, запрос переходит к первому откатному провайдеру. Цепочка отката продолжается до успешного ответа или исчерпания всех провайдеров.

### Классификация ошибок

ReliableProvider классифицирует ошибки на две категории:

- **Повторяемые**: HTTP 5xx, 429 (rate limit), 408 (таймаут), сетевые ошибки
- **Неповторяемые**: HTTP 4xx (кроме 429/408), недействительные API-ключи, неизвестные модели, некорректные ответы

Неповторяемые ошибки пропускают повторные попытки и сразу переходят к следующему провайдеру, избегая лишних задержек.

## Интеграция с маршрутизатором

Для продвинутых мультимодельных конфигураций PRX поддерживает эвристический LLM-маршрутизатор, который выбирает оптимального провайдера и модель для каждого запроса на основе:

- **Оценка возможностей** — сопоставление сложности запроса с сильными сторонами модели
- **Рейтинг Elo** — отслеживание производительности модели с течением времени
- **Оптимизация стоимости** — предпочтение более дешёвых моделей для простых запросов
- **Взвешивание задержки** — учёт времени ответа
- **Семантическая маршрутизация KNN** — использование эмбеддингов исторических запросов для маршрутизации на основе сходства
- **Эскалация Automix** — начало с дешёвой модели и повышение до премиальной при низкой уверенности

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

См. [Конфигурация маршрутизатора](/ru/prx/router/) для полных деталей.

## Страницы провайдеров

- [Anthropic (Claude)](/ru/prx/providers/anthropic)
- [OpenAI](/ru/prx/providers/openai)
- [Google Gemini](/ru/prx/providers/google-gemini)
- [OpenAI Codex](/ru/prx/providers/openai-codex)
- [GitHub Copilot](/ru/prx/providers/github-copilot)
- [Ollama](/ru/prx/providers/ollama)
- [AWS Bedrock](/ru/prx/providers/aws-bedrock)
- [GLM (Zhipu / Minimax / Moonshot / Qwen / Z.AI)](/ru/prx/providers/glm)
- [OpenRouter](/ru/prx/providers/openrouter)
- [Custom Compatible Endpoint](/ru/prx/providers/custom-compatible)

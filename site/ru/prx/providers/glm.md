---
title: GLM (Zhipu AI)
description: Настройка GLM и связанных китайских AI-провайдеров (Minimax, Moonshot, Qwen, Z.AI) в PRX
---

# GLM (Zhipu AI)

> Доступ к моделям Zhipu GLM и семейству китайских AI-провайдеров через единую конфигурацию. Включает псевдонимы для Minimax, Moonshot (Kimi), Qwen (DashScope) и Z.AI.

## Предварительные требования

- API-ключ Zhipu AI с [open.bigmodel.cn](https://open.bigmodel.cn/) (для моделей GLM), **или**
- API-ключи для конкретного провайдера, который вы хотите использовать (Minimax, Moonshot, Qwen и т.д.)

## Быстрая настройка

### 1. Получение API-ключа

1. Зарегистрируйтесь на [open.bigmodel.cn](https://open.bigmodel.cn/)
2. Перейдите в раздел API Keys
3. Создайте новый ключ (формат: `id.secret`)

### 2. Конфигурация

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

Или задайте переменную окружения:

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. Проверка

```bash
prx doctor models
```

## Доступные модели

### Модели GLM

| Модель | Контекст | Зрение | Вызов инструментов | Примечания |
|--------|----------|--------|-------------------|------------|
| `glm-4-plus` | 128K | Да | Да | Наиболее мощная модель GLM |
| `glm-4` | 128K | Да | Да | Стандартный GLM-4 |
| `glm-4-flash` | 128K | Да | Да | Быстрая и экономичная |
| `glm-4v` | 128K | Да | Да | Оптимизирована для зрения |

### Провайдеры-псевдонимы

PRX также поддерживает эти провайдеры как псевдонимы, маршрутизируемые через OpenAI-совместимый интерфейс:

| Провайдер | Имена псевдонимов | Базовый URL | Ключевые модели |
|-----------|-------------------|-------------|-----------------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1` (междунар.), `api.minimaxi.com/v1` (КНР) | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1` (междунар.), `api.moonshot.cn/v1` (КНР) | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com` (КНР), `dashscope-intl.aliyuncs.com` (междунар.) | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4` (глобальн.), `open.bigmodel.cn/api/coding/paas/v4` (КНР) | Модели Z.AI для кода |

## Справочник конфигурации

### GLM (нативный провайдер)

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `api_key` | string | обязательный | API-ключ GLM в формате `id.secret` |
| `model` | string | обязательный | Имя модели GLM |

### Провайдеры-псевдонимы (OpenAI-совместимые)

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `api_key` | string | обязательный | API-ключ конкретного провайдера |
| `api_url` | string | автоопределяется | Переопределение базового URL по умолчанию |
| `model` | string | обязательный | Имя модели |

## Возможности

### JWT-аутентификация

GLM использует JWT-аутентификацию вместо обычных API-ключей. PRX автоматически:

1. Разделяет API-ключ на компоненты `id` и `secret`
2. Генерирует JWT-токен с:
   - Заголовок: `{"alg":"HS256","typ":"JWT","sign_type":"SIGN"}`
   - Полезная нагрузка: `{"api_key":"<id>","exp":<expiry_ms>,"timestamp":<now_ms>}`
   - Подпись: HMAC-SHA256 с секретным ключом
3. Кэширует JWT на 3 минуты (токен истекает через 3,5 минуты)
4. Отправляет как `Authorization: Bearer <jwt>`

### Региональные эндпоинты

Большинство провайдеров-псевдонимов предлагают как международные, так и эндпоинты материкового Китая:

```toml
# Международный (по умолчанию для большинства)
provider = "moonshot-intl"

# Материковый Китай
provider = "moonshot-cn"

# Явные региональные варианты
provider = "qwen-us"      # Регион US
provider = "qwen-intl"    # Международный
provider = "qwen-cn"      # Материковый Китай
```

### Поддержка OAuth Minimax

Minimax поддерживает OAuth-аутентификацию по токенам:

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

Установите `provider = "minimax-oauth"` или `provider = "minimax-oauth-cn"` для использования OAuth вместо аутентификации по API-ключу.

### Режимы OAuth и кодинга Qwen

Qwen предлагает дополнительные режимы доступа:

- **Qwen OAuth**: `provider = "qwen-oauth"` или `provider = "qwen-code"` для доступа через OAuth
- **Qwen Coding**: `provider = "qwen-coding"` или `provider = "dashscope-coding"` для специализированного API-эндпоинта кодирования

## Справочник псевдонимов провайдеров

| Псевдоним | Разрешается в | Эндпоинт |
|-----------|---------------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM (глобальн.) | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM (КНР) | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax (междунар.) | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax (КНР) | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot (КНР) | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot (междунар.) | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen (КНР) | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen (междунар.) | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen (US) | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI (глобальн.) | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI (КНР) | `open.bigmodel.cn/api/coding/paas/v4` |

## Устранение неполадок

### «GLM API key not set or invalid format»

API-ключ GLM должен быть в формате `id.secret` (содержит ровно одну точку). Проверьте формат ключа:
```
abc123.secretXYZ  # корректно
abc123secretXYZ   # неверно - отсутствует точка
```

### Ошибка генерации JWT

Убедитесь, что системные часы точны. JWT-токены включают временную метку и истекают через 3,5 минуты.

### MiniMax «role: system» отклонён

MiniMax не принимает сообщения `role: system`. PRX автоматически объединяет содержимое системного сообщения с первым сообщением пользователя при использовании провайдеров MiniMax.

### Таймаут Qwen/DashScope

API DashScope Qwen требует HTTP/1.1 (не HTTP/2). PRX автоматически принудительно использует HTTP/1.1 для эндпоинтов DashScope. Если вы испытываете таймауты, убедитесь, что ваша сеть разрешает HTTP/1.1-соединения.

### Ошибки региональных эндпоинтов

При ошибках подключения попробуйте переключиться между региональными эндпоинтами:
- Пользователи из Китая: используйте варианты `*-cn`
- Международные пользователи: используйте `*-intl` или базовые варианты
- Пользователи из США: попробуйте `qwen-us` для Qwen

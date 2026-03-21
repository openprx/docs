---
title: GitHub Copilot
description: Настройка GitHub Copilot в качестве LLM-провайдера в PRX
---

# GitHub Copilot

> Доступ к моделям GitHub Copilot Chat через Copilot API с автоматической OAuth-аутентификацией через device-flow и управлением токенами.

## Предварительные требования

- Аккаунт GitHub с активной подпиской **Copilot Individual**, **Copilot Business** или **Copilot Enterprise**
- Опционально: персональный токен доступа GitHub (иначе используется интерактивный device-flow вход)

## Быстрая настройка

### 1. Аутентификация

При первом использовании PRX предложит аутентифицироваться через device code flow GitHub:

```
GitHub Copilot authentication is required.
Visit: https://github.com/login/device
Code: XXXX-XXXX
Waiting for authorization...
```

Альтернативно можно предоставить токен GitHub напрямую:

```bash
export GITHUB_TOKEN="ghp_..."
```

### 2. Конфигурация

```toml
[default]
provider = "copilot"
model = "gpt-4o"
```

### 3. Проверка

```bash
prx doctor models
```

## Доступные модели

GitHub Copilot предоставляет доступ к курированному набору моделей. Конкретные доступные модели зависят от уровня подписки Copilot:

| Модель | Контекст | Зрение | Вызов инструментов | Примечания |
|--------|----------|--------|-------------------|------------|
| `gpt-4o` | 128K | Да | Да | Модель Copilot по умолчанию |
| `gpt-4o-mini` | 128K | Да | Да | Быстрее, экономичнее |
| `claude-sonnet-4` | 200K | Да | Да | Доступен в Copilot Enterprise |
| `o3-mini` | 128K | Нет | Да | Модель рассуждения |

Доступность моделей может варьироваться в зависимости от вашего плана GitHub Copilot и текущего набора моделей GitHub.

## Справочник конфигурации

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `api_key` | string | опционально | Персональный токен доступа GitHub (`ghp_...` или `gho_...`) |
| `model` | string | `gpt-4o` | Модель по умолчанию |

## Возможности

### Аутентификация без настройки

Провайдер Copilot реализует тот же OAuth device-code flow, что используется расширением Copilot для VS Code:

1. **Запрос device code**: PRX запрашивает device code у GitHub
2. **Авторизация пользователя**: Вы посещаете `github.com/login/device` и вводите код
3. **Обмен токена**: OAuth-токен GitHub обменивается на кратковременный API-ключ Copilot
4. **Автоматическое кэширование**: Токены кэшируются в `~/.config/openprx/copilot/` с безопасными правами файлов (0600)
5. **Автообновление**: Просроченные API-ключи Copilot автоматически переобмениваются без повторной аутентификации

### Безопасное хранение токенов

Токены хранятся со строгой безопасностью:
- Директория: `~/.config/openprx/copilot/` с правами 0700
- Файлы: `access-token` и `api-key.json` с правами 0600
- На не-Unix платформах используется стандартное создание файлов

### Динамический эндпоинт API

Ответ с API-ключом Copilot включает поле `endpoints.api`, указывающее фактический эндпоинт API. PRX учитывает это, используя `https://api.githubcopilot.com` по умолчанию, когда эндпоинт не указан.

### Нативный вызов инструментов

Инструменты отправляются в OpenAI-совместимом формате через Copilot Chat Completions API (`/chat/completions`). Провайдер поддерживает `tool_choice: "auto"` для автоматического выбора инструмента.

### Заголовки редактора

Запросы включают стандартные заголовки идентификации редактора Copilot:
- `Editor-Version: vscode/1.85.1`
- `Editor-Plugin-Version: copilot/1.155.0`
- `User-Agent: GithubCopilot/1.155.0`

## Устранение неполадок

### «Failed to get Copilot API key (401/403)»

Ваш OAuth-токен GitHub мог истечь или подписка Copilot неактивна:
- Убедитесь, что у вашего аккаунта GitHub есть активная подписка Copilot
- PRX автоматически очищает кэшированный токен доступа при 401/403 и повторно запросит device-flow вход

### «Timed out waiting for GitHub authorization»

Device code flow имеет 15-минутный таймаут. Если он истёк:
- Запустите команду PRX снова для получения нового кода
- Убедитесь, что вы посещаете корректный URL и вводите точный код

### «GitHub device authorization expired»

Device code истёк. Просто повторите команду для запуска нового потока авторизации.

### Модели недоступны

Доступные модели зависят от уровня подписки Copilot:
- **Copilot Individual**: GPT-4o, GPT-4o-mini
- **Copilot Business/Enterprise**: Могут включать дополнительные модели, такие как Claude

Проверьте подписку на [github.com/settings/copilot](https://github.com/settings/copilot).

### Ограничение частоты запросов

GitHub Copilot имеет собственные лимиты частоты, отдельные от OpenAI. При их достижении рассмотрите использование `fallback_providers` в конфигурации PRX для отката к другому провайдеру.

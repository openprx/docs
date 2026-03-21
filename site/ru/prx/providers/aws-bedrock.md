---
title: AWS Bedrock
description: Настройка AWS Bedrock в качестве LLM-провайдера в PRX
---

# AWS Bedrock

> Доступ к базовым моделям (Claude, Titan, Llama, Mistral и другие) через Converse API AWS Bedrock с SigV4-аутентификацией, нативным вызовом инструментов и кэшированием промптов.

## Предварительные требования

- Аккаунт AWS с включённым доступом к моделям Bedrock
- Учётные данные AWS (Access Key ID + Secret Access Key) с разрешениями `bedrock:InvokeModel`

## Быстрая настройка

### 1. Включение доступа к моделям

1. Откройте [консоль AWS Bedrock](https://console.aws.amazon.com/bedrock/)
2. Перейдите в **Model access** в левой боковой панели
3. Запросите доступ к нужным моделям (например, Anthropic Claude, Meta Llama)

### 2. Настройка учётных данных AWS

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # опционально, по умолчанию us-east-1
```

### 3. Конфигурация PRX

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. Проверка

```bash
prx doctor models
```

## Доступные модели

ID моделей следуют формату Bedrock `<provider>.<model>-<version>`:

| ID модели | Провайдер | Контекст | Зрение | Вызов инструментов | Примечания |
|-----------|-----------|----------|--------|-------------------|------------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | Да | Да | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | Да | Да | Последний Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | Да | Да | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | Да | Да | Быстрая модель Claude |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | Нет | Да | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | Нет | Да | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | Нет | Нет | Amazon Titan |

Ознакомьтесь с [документацией AWS Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) для полного списка доступных моделей в вашем регионе.

## Справочник конфигурации

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `model` | string | обязательный | ID модели Bedrock (например, `anthropic.claude-sonnet-4-6`) |

Аутентификация полностью обрабатывается через переменные окружения AWS:

| Переменная окружения | Обязательная | Описание |
|---------------------|-------------|----------|
| `AWS_ACCESS_KEY_ID` | Да | ID ключа доступа AWS |
| `AWS_SECRET_ACCESS_KEY` | Да | Секретный ключ доступа AWS |
| `AWS_SESSION_TOKEN` | Нет | Временный токен сессии (для предполагаемых ролей) |
| `AWS_REGION` | Нет | Регион AWS (по умолчанию: `us-east-1`) |
| `AWS_DEFAULT_REGION` | Нет | Резервный регион, если `AWS_REGION` не задан |

## Возможности

### SigV4-подпись без зависимостей

PRX реализует подпись запросов AWS SigV4 с использованием только крейтов `hmac` и `sha2`, без зависимости от AWS SDK. Это сохраняет бинарник маленьким и избегает конфликтов версий SDK. Подпись включает:

- Цепочку деривации ключей HMAC-SHA256
- Построение канонического запроса с отсортированными заголовками
- Поддержку `x-amz-security-token` для временных учётных данных

### Converse API

PRX использует Converse API Bedrock (а не устаревший InvokeModel API), который обеспечивает:
- Единый формат сообщений для всех провайдеров моделей
- Структурированный вызов инструментов с блоками `toolUse` и `toolResult`
- Поддержку системных промптов
- Единообразный формат ответов

### Нативный вызов инструментов

Инструменты отправляются в нативном формате Bedrock `toolConfig` с определениями `toolSpec`, включающими `name`, `description` и `inputSchema`. Результаты инструментов оборачиваются как блоки содержимого `toolResult` внутри сообщений `user`.

### Кэширование промптов

PRX применяет эвристики кэширования промптов Bedrock (с теми же порогами, что и провайдер Anthropic):
- Системные промпты > 3 КБ получают блок `cachePoint`
- Разговоры с > 4 несистемными сообщениями имеют последнее сообщение с аннотацией `cachePoint`

### URL-кодирование ID моделей

ID моделей Bedrock, содержащие двоеточия (например, `v1:0`), требуют специальной обработки. PRX:
- Отправляет сырые двоеточия в HTTP URL (как это делает reqwest)
- Кодирует двоеточия как `%3A` в каноническом URI для SigV4-подписи
- Этот двойной подход обеспечивает успех как HTTP-маршрутизации, так и верификации подписи

## Псевдонимы провайдера

Следующие имена разрешаются в провайдер Bedrock:

- `bedrock`
- `aws-bedrock`

## Устранение неполадок

### «AWS Bedrock credentials not set»

Убедитесь, что обе переменные `AWS_ACCESS_KEY_ID` и `AWS_SECRET_ACCESS_KEY` заданы как переменные окружения. PRX не читает из `~/.aws/credentials` или `~/.aws/config`.

### 403 AccessDeniedException

Распространённые причины:
- IAM пользователь/роль не имеет разрешения `bedrock:InvokeModel`
- Вы не запросили доступ к модели в консоли Bedrock
- Модель недоступна в вашем настроенном регионе

### SignatureDoesNotMatch

Обычно указывает на расхождение часов. Убедитесь, что системные часы синхронизированы:
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```

### Модель недоступна в регионе

Не все модели доступны во всех регионах. Проверьте [матрицу доступности моделей Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) и скорректируйте `AWS_REGION` соответственно.

### Использование временных учётных данных (STS)

При использовании AWS STS (предполагаемые роли, SSO) задайте все три переменные:
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

Токен сессии автоматически включается в SigV4-подпись как заголовок `x-amz-security-token`.

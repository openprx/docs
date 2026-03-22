---
title: Быстрый старт
description: "Настройте OpenPR-Webhook с простым агентом-форвардером webhook и протестируйте его с симулированным событием."
---

# Быстрый старт

Это руководство проведёт вас через настройку OpenPR-Webhook с простым агентом-форвардером webhook, а затем тестирование с симулированным событием.

## Шаг 1: Создание конфигурации

Создайте файл с именем `config.toml`:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["my-test-secret"]

[[agents]]
id = "echo-agent"
name = "Echo Agent"
agent_type = "webhook"

[agents.webhook]
url = "https://httpbin.org/post"
```

Эта конфигурация:

- Слушает на порту 9000
- Требует HMAC-SHA256 подписей с использованием секрета `my-test-secret`
- Маршрутизирует bot-события на httpbin.org для тестирования

## Шаг 2: Запуск сервиса

```bash
./target/release/openpr-webhook config.toml
```

Вы должны увидеть:

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## Шаг 3: Отправка тестового события

Сгенерируйте HMAC-SHA256 подпись для тестового payload и отправьте его:

```bash
# Тестовый payload
PAYLOAD='{"event":"issue.updated","bot_context":{"is_bot_task":true,"bot_name":"echo-agent","bot_agent_type":"webhook"},"data":{"issue":{"id":"42","key":"PROJ-42","title":"Fix login bug"}},"actor":{"name":"alice"},"project":{"name":"backend"}}'

# Вычислить HMAC-SHA256 подпись
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

# Отправить webhook
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

Ожидаемый ответ:

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## Шаг 4: Тестирование фильтрации

События без `bot_context.is_bot_task = true` молча игнорируются:

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

Ответ:

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## Шаг 5: Тестирование отклонения подписи

Недействительная подпись возвращает HTTP 401:

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

Ответ: `401 Unauthorized`

## Понимание сопоставления агентов

Когда приходит webhook-событие с `is_bot_task = true`, сервис сопоставляет агента по следующей логике:

1. **По имени** — если `bot_context.bot_name` совпадает с `id` или `name` агента (без учёта регистра)
2. **Откат по типу** — если нет совпадения по имени, использует первого агента, чей `agent_type` совпадает с `bot_context.bot_agent_type`

Если ни один агент не совпадает, ответ содержит `"status": "no_agent"`.

## Следующие шаги

- [Типы агентов](../agents/index.md) — узнайте обо всех 5 типах агентов
- [Справочник исполнителей](../agents/executors.md) — подробное изучение каждого исполнителя
- [Справочник конфигурации](../configuration/index.md) — полная схема TOML

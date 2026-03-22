---
title: სწრაფი დაწყება
description: OpenPR-Webhook-ის მარტივი webhook-გამომგზავნი აგენტით გამართვა და სიმულ-მოვლ-ის ტესტი.
---

# სწრაფი დაწყება

ეს სახელმ-ი OpenPR-Webhook-ის მ webhook-გ-ა-ი ა-ით გ-ს, შ-ა სიმ-მ-ის-ი ტ-ს.

## ნ 1: კ-ის შ

`config.toml` ფ-ი შ:

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

ეს კ:

- 9000 პ-ზე ს
- `my-test-secret` სა-ი HMAC-SHA256 სიგ-ებ-ს სჭ
- ბ-მ-ებ-ს ტ-ა httpbin.org-ზე

## ნ 2: სერვ-ის გ

```bash
./target/release/openpr-webhook config.toml
```

დ:

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## ნ 3: ტ-მ-ის გ

ტ-ი-ა HMAC-SHA256 სიგ-ი და გ:

```bash
# The test payload
PAYLOAD='{"event":"issue.updated","bot_context":{"is_bot_task":true,"bot_name":"echo-agent","bot_agent_type":"webhook"},"data":{"issue":{"id":"42","key":"PROJ-42","title":"Fix login bug"}},"actor":{"name":"alice"},"project":{"name":"backend"}}'

# Compute HMAC-SHA256 signature
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

# Send the webhook
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

სა-ი პ:

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## ნ 4: ფ-ი ტ

`bot_context.is_bot_task = true`-ის-ი-ი მ-ები ჩ-ით-ი:

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

პ:

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## ნ 5: სიგ-უ-ი ტ

ა-ი სიგ HTTP 401-ს:

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

პ: `401 Unauthorized`

## ა-შ-ი გ

`is_bot_task = true`-ის-ა webhook-მ-ის შ სერვ-ი ა-ს ამ ლ-ით შ:

1. **სახ-ით** -- `bot_context.bot_name` ა-ის `id` ან `name`-ს ემ (case-insensitive)
2. **ტ-ფ** -- სახ-შ-ის-ა, პ-ა-ი ა-ს, რ-ის `agent_type` `bot_context.bot_agent_type`-ს ემ

ა-ი-ა-ი-ა პ `"status": "no_agent"`-ს შ.

## შ-ნ

- [ა-ტ](../agents/index.md) -- ყ 5 ა-ტ-ის შ
- [Exec-ცნ](../agents/executors.md) -- ყ exec-ის სიღ
- [კ-ცნ](../configuration/index.md) -- სრ TOML-სქ

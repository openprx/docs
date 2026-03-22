---
title: Inicio Rápido
description: Configura OpenPR-Webhook con un agente de reenvío de webhook simple y pruébalo con un evento simulado.
---

# Inicio Rápido

Esta guía te lleva por la configuración de OpenPR-Webhook con un agente de reenvío de webhook simple, y luego lo prueba con un evento simulado.

## Paso 1: Crear la Configuración

Crea un archivo llamado `config.toml`:

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

Esta configuración:

- Escucha en el puerto 9000
- Requiere firmas HMAC-SHA256 usando el secreto `my-test-secret`
- Enruta eventos de bot a httpbin.org para pruebas

## Paso 2: Iniciar el Servicio

```bash
./target/release/openpr-webhook config.toml
```

Deberías ver:

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## Paso 3: Enviar un Evento de Prueba

Genera una firma HMAC-SHA256 para un payload de prueba y envíalo:

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

Respuesta esperada:

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## Paso 4: Probar el Filtrado

Los eventos sin `bot_context.is_bot_task = true` se ignoran silenciosamente:

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

Respuesta:

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## Paso 5: Probar el Rechazo de Firma

Una firma inválida devuelve HTTP 401:

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

Respuesta: `401 Unauthorized`

## Entender la Coincidencia de Agentes

Cuando llega un evento webhook con `is_bot_task = true`, el servicio hace coincidir un agente usando esta lógica:

1. **Por nombre** -- si `bot_context.bot_name` coincide con el `id` o `name` de un agente (sin distinción de mayúsculas/minúsculas)
2. **Por tipo de reserva** -- si no hay coincidencia por nombre, usa el primer agente cuyo `agent_type` coincida con `bot_context.bot_agent_type`

Si ningún agente coincide, la respuesta incluye `"status": "no_agent"`.

## Próximos Pasos

- [Tipos de Agentes](../agents/index.md) -- aprende sobre los 5 tipos de agentes
- [Referencia de Executors](../agents/executors.md) -- profundiza en cada executor
- [Referencia de Configuración](../configuration/index.md) -- esquema TOML completo

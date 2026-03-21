---
title: Webhooks
description: Notificaciones de webhooks salientes para eventos e integraciones de PRX.
---

# Webhooks

PRX soporta webhooks salientes para notificar a servicios externos de eventos del agente. Los webhooks permiten integraciones con sistemas CI/CD, herramientas de monitoreo y flujos de trabajo personalizados.

## Vision general

Cuando estan configurados, PRX envia solicitudes HTTP POST a las URLs de webhook registradas cuando ocurren eventos especificos:

- **session.created** -- se inicio una nueva sesion de agente
- **session.completed** -- una sesion de agente finalizo
- **tool.executed** -- se llamo y completo una herramienta
- **error.occurred** -- se encontro un error

## Configuracion

```toml
[[gateway.webhooks]]
url = "https://example.com/webhook"
secret = "your-webhook-secret"
events = ["session.completed", "error.occurred"]
timeout_secs = 10
max_retries = 3
```

## Formato de payload

Los payloads de webhook son objetos JSON con campos estandar:

```json
{
  "event": "session.completed",
  "timestamp": "2026-03-21T10:00:00Z",
  "data": { }
}
```

## Verificacion de firma

Cada solicitud de webhook incluye una cabecera `X-PRX-Signature` que contiene una firma HMAC-SHA256 del payload usando el secreto configurado.

## Paginas relacionadas

- [Vision general del gateway](./)
- [API HTTP](./http-api)

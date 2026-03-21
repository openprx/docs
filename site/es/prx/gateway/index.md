---
title: Gateway
description: Vision general de la capa de gateway de PRX que proporciona API HTTP, WebSocket e interfaces de webhooks.
---

# Gateway

El gateway de PRX es la capa orientada a la red que expone las capacidades del agente a traves de multiples protocolos. Proporciona APIs REST HTTP, conexiones WebSocket para streaming en tiempo real y endpoints de webhooks para integraciones basadas en eventos.

## Vision general

El gateway se ejecuta como parte del daemon de PRX y maneja:

- **API HTTP** -- endpoints RESTful para gestion de sesiones, ejecucion de herramientas y configuracion
- **WebSocket** -- streaming bidireccional para interacciones en tiempo real con el agente
- **Webhooks** -- notificaciones de eventos salientes para integraciones
- **Middleware** -- autenticacion, limitacion de velocidad, CORS y registro de solicitudes

## Arquitectura

```
┌─────────────────────────────────┐
│           Gateway                │
│  ┌──────────┐  ┌─────────────┐  │
│  │ HTTP API │  │  WebSocket  │  │
│  └────┬─────┘  └──────┬──────┘  │
│       │               │         │
│  ┌────┴───────────────┴──────┐  │
│  │       Middleware Stack     │  │
│  └────────────┬──────────────┘  │
│               │                  │
│  ┌────────────┴──────────────┐  │
│  │      Agent Runtime         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Configuracion

```toml
[gateway]
bind = "127.0.0.1:3120"
tls_cert = ""
tls_key = ""

[gateway.cors]
allowed_origins = ["*"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
```

## Paginas relacionadas

- [API HTTP](./http-api)
- [WebSocket](./websocket)
- [Webhooks](./webhooks)
- [Middleware](./middleware)

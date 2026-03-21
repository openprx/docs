---
title: Gateway
description: Ubersicht uber die PRX-Gateway-Schicht mit HTTP-API, WebSocket- und Webhook-Schnittstellen.
---

# Gateway

Das PRX-Gateway ist die netzwerkseitige Schicht, die Agenten-Fahigkeiten uber mehrere Protokolle bereitstellt. Es bietet HTTP-REST-APIs, WebSocket-Verbindungen fur Echtzeit-Streaming und Webhook-Endpunkte fur ereignisgesteuerte Integrationen.

## Ubersicht

Das Gateway lauft als Teil des PRX-Daemons und handhabt:

- **HTTP-API** -- RESTful-Endpunkte fur Sitzungsverwaltung, Werkzeugausfuhrung und Konfiguration
- **WebSocket** -- bidirektionales Streaming fur Echtzeit-Agenteninteraktionen
- **Webhooks** -- ausgehende Event-Benachrichtigungen fur Integrationen
- **Middleware** -- Authentifizierung, Ratenlimitierung, CORS und Anfragenprotokollierung

## Architektur

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

## Konfiguration

```toml
[gateway]
bind = "127.0.0.1:3120"
tls_cert = ""
tls_key = ""

[gateway.cors]
allowed_origins = ["*"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
```

## Verwandte Seiten

- [HTTP-API](./http-api)
- [WebSocket](./websocket)
- [Webhooks](./webhooks)
- [Middleware](./middleware)

---
title: HTTP-API
description: RESTful-HTTP-API-Referenz fur das PRX-Gateway.
---

# HTTP-API

Das PRX-Gateway stellt eine RESTful-HTTP-API zur Verwaltung von Agenten-Sitzungen, zum Senden von Nachrichten und zum Abfragen des Systemstatus bereit.

## Basis-URL

Standardmassig ist die API unter `http://127.0.0.1:3120/api/v1` verfugbar.

## Endpunkte

### Sitzungen

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| `POST` | `/sessions` | Eine neue Agenten-Sitzung erstellen |
| `GET` | `/sessions` | Aktive Sitzungen auflisten |
| `GET` | `/sessions/:id` | Sitzungsdetails abrufen |
| `DELETE` | `/sessions/:id` | Eine Sitzung beenden |

### Nachrichten

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| `POST` | `/sessions/:id/messages` | Eine Nachricht an den Agenten senden |
| `GET` | `/sessions/:id/messages` | Nachrichtenverlauf abrufen |

### System

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| `GET` | `/health` | Gesundheitsprufung |
| `GET` | `/info` | Systeminformationen |
| `GET` | `/metrics` | Prometheus-Metriken |

## Authentifizierung

API-Anfragen erfordern ein Bearer-Token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/sessions
```

## Verwandte Seiten

- [Gateway-Ubersicht](./)
- [WebSocket](./websocket)
- [Middleware](./middleware)

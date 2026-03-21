---
title: Webhooks
description: Ausgehende Webhook-Benachrichtigungen fur PRX-Events und Integrationen.
---

# Webhooks

PRX unterstutzt ausgehende Webhooks, um externe Dienste uber Agenten-Events zu benachrichtigen. Webhooks ermoglichen Integrationen mit CI/CD-Systemen, Uberwachungstools und benutzerdefinierten Workflows.

## Ubersicht

Wenn konfiguriert, sendet PRX HTTP-POST-Anfragen an registrierte Webhook-URLs, wenn bestimmte Events auftreten:

- **session.created** -- eine neue Agenten-Sitzung wurde gestartet
- **session.completed** -- eine Agenten-Sitzung wurde beendet
- **tool.executed** -- ein Werkzeug wurde aufgerufen und abgeschlossen
- **error.occurred** -- ein Fehler ist aufgetreten

## Konfiguration

```toml
[[gateway.webhooks]]
url = "https://example.com/webhook"
secret = "your-webhook-secret"
events = ["session.completed", "error.occurred"]
timeout_secs = 10
max_retries = 3
```

## Payload-Format

Webhook-Payloads sind JSON-Objekte mit Standardfeldern:

```json
{
  "event": "session.completed",
  "timestamp": "2026-03-21T10:00:00Z",
  "data": { }
}
```

## Signaturverifizierung

Jede Webhook-Anfrage enthalt einen `X-PRX-Signature`-Header mit einer HMAC-SHA256-Signatur des Payloads unter Verwendung des konfigurierten Geheimnisses.

## Verwandte Seiten

- [Gateway-Ubersicht](./)
- [HTTP-API](./http-api)

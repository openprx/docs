---
title: Webhooks
description: Outbound webhook notifications for PRX events and integrations.
---

# Webhooks

PRX prend en charge outbound webhooks to notify external services of agent events. Webhooks enable integrations with CI/CD systems, monitoring tools, and custom workflows.

## Apercu

When configured, PRX envoie HTTP POST requests to registered webhook URLs when specific events occur:

- **session.created** -- un nouveau session d'agent was started
- **session.completed** -- an session d'agent finished
- **tool.executed** -- a tool was called and completed
- **error.occurred** -- an error was encountered

## Configuration

```toml
[[gateway.webhooks]]
url = "https://example.com/webhook"
secret = "your-webhook-secret"
events = ["session.completed", "error.occurred"]
timeout_secs = 10
max_retries = 3
```

## Payload Format

Webhook payloads are JSON objects with standard fields:

```json
{
  "event": "session.completed",
  "timestamp": "2026-03-21T10:00:00Z",
  "data": { }
}
```

## Signature Verification

Each webhook request includes an `X-PRX-Signature` header containing an HMAC-SHA256 signature of the payload en utilisant le configured secret.

## Voir aussi Pages

- [Gateway Overview](./)
- [HTTP API](./http-api)

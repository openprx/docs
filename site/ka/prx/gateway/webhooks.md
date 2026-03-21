---
title: Webhook-ები
description: Outbound webhook notifications for PRX events and integrations.
---

# Webhooks

PRX supports outbound webhooks to notify external services of agent events. Webhooks enable integrations with CI/CD systems, monitoring tools, and custom workflows.

## მიმოხილვა

When configured, PRX sends HTTP POST requests to registered webhook URLs when specific events occur:

- **session.created** -- a new agent session was started
- **session.completed** -- an agent session finished
- **tool.executed** -- a tool was called and completed
- **error.occurred** -- an error was encountered

## კონფიგურაცია

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

Each webhook request includes an `X-PRX-Signature` header containing an HMAC-SHA256 signature of the payload using the configured secret.

## Related Pages

- [Gateway Overview](./)
- [HTTP API](./http-api)

---
title: Schnellstart
description: "OpenPR-Webhook mit einem einfachen Webhook-Weiterleitungs-Agenten einrichten und mit einem simulierten Event testen."
---

# Schnellstart

Dieser Leitfaden führt durch die Einrichtung von OpenPR-Webhook mit einem einfachen Webhook-Weiterleitungs-Agenten und anschließendes Testen mit einem simulierten Event.

## Schritt 1: Konfiguration erstellen

Eine Datei namens `config.toml` erstellen:

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

Diese Konfiguration:

- Lauscht auf Port 9000
- Erfordert HMAC-SHA256-Signaturen mit dem Secret `my-test-secret`
- Leitet Bot-Events zu httpbin.org zum Testen weiter

## Schritt 2: Dienst starten

```bash
./target/release/openpr-webhook config.toml
```

Es sollte folgendes angezeigt werden:

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## Schritt 3: Test-Event senden

Eine HMAC-SHA256-Signatur für eine Test-Nutzlast generieren und senden:

```bash
# Die Test-Nutzlast
PAYLOAD='{"event":"issue.updated","bot_context":{"is_bot_task":true,"bot_name":"echo-agent","bot_agent_type":"webhook"},"data":{"issue":{"id":"42","key":"PROJ-42","title":"Fix login bug"}},"actor":{"name":"alice"},"project":{"name":"backend"}}'

# HMAC-SHA256-Signatur berechnen
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

# Webhook senden
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

Erwartete Antwort:

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## Schritt 4: Filterung testen

Events ohne `bot_context.is_bot_task = true` werden lautlos ignoriert:

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

Antwort:

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## Schritt 5: Signaturablehnung testen

Eine ungültige Signatur gibt HTTP 401 zurück:

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

Antwort: `401 Unauthorized`

## Agenten-Abgleich verstehen

Wenn ein Webhook-Event mit `is_bot_task = true` ankommt, ordnet der Dienst einen Agenten mit dieser Logik zu:

1. **Nach Name** -- wenn `bot_context.bot_name` mit der `id` oder dem `name` eines Agenten übereinstimmt (Groß-/Kleinschreibung wird ignoriert)
2. **Nach Typ als Fallback** -- wenn kein Namensabgleich, wird der erste Agent verwendet, dessen `agent_type` mit `bot_context.bot_agent_type` übereinstimmt

Wenn kein Agent übereinstimmt, enthält die Antwort `"status": "no_agent"`.

## Nächste Schritte

- [Agenten-Typen](../agents/index.md) -- alle 5 Agenten-Typen kennenlernen
- [Executor-Referenz](../agents/executors.md) -- Details zu jedem Executor
- [Konfigurationsreferenz](../configuration/index.md) -- vollständiges TOML-Schema

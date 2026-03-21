# Quick Start

This guide walks you through setting up OpenPR-Webhook with a simple webhook forwarder agent, then testing it with a simulated event.

## Step 1: Create the Configuration

Create a file named `config.toml`:

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

This configuration:

- Listens on port 9000
- Requires HMAC-SHA256 signatures using the secret `my-test-secret`
- Routes bot events to httpbin.org for testing

## Step 2: Start the Service

```bash
./target/release/openpr-webhook config.toml
```

You should see:

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## Step 3: Send a Test Event

Generate an HMAC-SHA256 signature for a test payload and send it:

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

Expected response:

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## Step 4: Test Filtering

Events without `bot_context.is_bot_task = true` are silently ignored:

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

Response:

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## Step 5: Test Signature Rejection

An invalid signature returns HTTP 401:

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

Response: `401 Unauthorized`

## Understanding Agent Matching

When a webhook event arrives with `is_bot_task = true`, the service matches an agent using this logic:

1. **By name** -- if `bot_context.bot_name` matches an agent's `id` or `name` (case-insensitive)
2. **By type fallback** -- if no name match, uses the first agent whose `agent_type` matches `bot_context.bot_agent_type`

If no agent matches, the response includes `"status": "no_agent"`.

## Next Steps

- [Agent Types](../agents/index.md) -- learn about all 5 agent types
- [Executor Reference](../agents/executors.md) -- deep dive into each executor
- [Configuration Reference](../configuration/index.md) -- full TOML schema

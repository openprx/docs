# WSS Tunnel

The WSS Tunnel (Phase B) provides an active WebSocket connection from OpenPR-Webhook to a control plane server. Instead of waiting for inbound HTTP webhooks, the tunnel allows the control plane to push tasks directly to the agent over a persistent connection.

This is particularly useful when the webhook service runs behind a NAT or firewall and cannot receive inbound HTTP requests.

## How It Works

```
Control Plane (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   tunnel client   |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  CLI agent (codex / claude-code / opencode)
```

1. OpenPR-Webhook opens a WebSocket connection to the control plane URL
2. Authenticates using a Bearer token in the `Authorization` header
3. Sends periodic heartbeat messages to keep the connection alive
4. Receives `task.dispatch` messages from the control plane
5. Acknowledges immediately with `task.ack`
6. Executes the task asynchronously via the CLI agent
7. Sends back `task.result` when execution completes

## Enabling the Tunnel

The tunnel requires **two** things to be enabled:

1. Feature flag: `features.tunnel_enabled = true`
2. Tunnel section: `tunnel.enabled = true`

Both conditions must be true, and `OPENPR_WEBHOOK_SAFE_MODE` must not be set.

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # Usually needed for task execution

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## Message Envelope Format

All tunnel messages use a standard envelope:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "heartbeat",
  "ts": 1711234567,
  "agent_id": "my-webhook-agent",
  "payload": { "alive": true },
  "sig": "sha256=abc123..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Unique message identifier |
| `type` | String | Message type (see below) |
| `ts` | Integer | Unix timestamp (seconds) |
| `agent_id` | String | ID of the sending agent |
| `payload` | Object | Type-specific payload |
| `sig` | String (optional) | HMAC-SHA256 signature of the envelope |

## Message Types

### Outbound (agent to control plane)

| Type | When | Payload |
|------|------|---------|
| `heartbeat` | Every N seconds | `{"alive": true}` |
| `task.ack` | Immediately on receiving a task | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | After task completion | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | On protocol errors | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### Inbound (control plane to agent)

| Type | Purpose | Payload |
|------|---------|---------|
| `task.dispatch` | Assign a task to this agent | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## Task Dispatch Flow

```
Control Plane                    openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack (immediate)
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- run CLI agent
    |                                 |    (async, up to timeout)
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

The `task.dispatch` payload fields:

| Field | Type | Description |
|-------|------|-------------|
| `run_id` | String | Unique run identifier (auto-generated if missing) |
| `issue_id` | String | Issue ID to work on |
| `agent` | String (optional) | Target agent ID (falls back to first `cli` agent) |
| `body` | Object | Full webhook payload to pass to the dispatcher |

## HMAC Envelope Signing

When `tunnel.hmac_secret` is configured, all outbound envelopes are signed:

1. The envelope is serialized to JSON with `sig` set to `null`
2. HMAC-SHA256 is computed over the JSON bytes using the secret
3. The signature is set as `sha256={hex}` in the `sig` field

For inbound messages, if `tunnel.require_inbound_sig = true`, any message without a valid signature is rejected with an `error` envelope.

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## Reconnection Behavior

The tunnel client automatically reconnects on disconnection:

- Initial retry delay: `reconnect_secs` (default: 3 seconds)
- Backoff: doubles on each consecutive failure
- Maximum backoff: `runtime.tunnel_reconnect_backoff_max_secs` (default: 60 seconds)
- Resets to base delay on successful connection

## Concurrency Control

CLI task execution through the tunnel is limited by `runtime.cli_max_concurrency`:

```toml
[runtime]
cli_max_concurrency = 2  # Allow 2 concurrent CLI tasks (default: 1)
```

Tasks exceeding the concurrency limit wait for a semaphore permit. This prevents overloading the machine when multiple tasks are dispatched in rapid succession.

## Configuration Reference

| Field | Default | Description |
|-------|---------|-------------|
| `tunnel.enabled` | `false` | Enable/disable the tunnel |
| `tunnel.url` | -- | WebSocket URL (`wss://` or `ws://`) |
| `tunnel.agent_id` | `openpr-webhook` | Agent identifier |
| `tunnel.auth_token` | -- | Bearer token for authentication |
| `tunnel.reconnect_secs` | `3` | Base reconnect interval |
| `tunnel.heartbeat_secs` | `20` | Heartbeat interval (minimum 3s) |
| `tunnel.hmac_secret` | -- | HMAC-SHA256 signing secret |
| `tunnel.require_inbound_sig` | `false` | Reject unsigned inbound messages |

## Security Notes

- Always use `wss://` in production. The service logs a warning if `ws://` is used.
- The `auth_token` is sent as an HTTP header during the WebSocket upgrade; ensure TLS is used.
- Enable `require_inbound_sig` with an `hmac_secret` to prevent spoofed task dispatches.

# Configuration Reference

OpenPR-Webhook uses a single TOML configuration file. By default, it looks for `config.toml` in the current directory. You can specify a custom path as the first command-line argument.

## Full Schema

```toml
# ─── Server ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # Bind address and port

# ─── Security ─────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # HMAC-SHA256 secrets (supports rotation)
allow_unsigned = false                     # Allow unsigned webhook requests (default: false)

# ─── Feature Flags ────────────────────────────────────────
[features]
tunnel_enabled = false                 # Enable WSS tunnel subsystem (default: false)
cli_enabled = false                    # Enable CLI agent executor (default: false)
callback_enabled = false               # Enable state-transition callbacks (default: false)

# ─── Runtime Tuning ───────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # Max concurrent CLI tasks (default: 1)
http_timeout_secs = 15                 # HTTP client timeout (default: 15)
tunnel_reconnect_backoff_max_secs = 60 # Max tunnel reconnect backoff (default: 60)

# ─── WSS Tunnel ───────────────────────────────────────────
[tunnel]
enabled = false                        # Enable this tunnel instance (default: false)
url = "wss://control.example.com/ws"   # WebSocket URL
agent_id = "my-agent"                  # Agent identifier
auth_token = "bearer-token"            # Bearer auth token
reconnect_secs = 3                     # Base reconnect interval (default: 3)
heartbeat_secs = 20                    # Heartbeat interval (default: 20, min: 3)
hmac_secret = "envelope-signing-key"   # Envelope HMAC signing secret
require_inbound_sig = false            # Require inbound message signatures (default: false)

# ─── Agents ───────────────────────────────────────────────

# --- OpenClaw Agent ---
[[agents]]
id = "notify-signal"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- OpenPRX Agent (HTTP API mode) ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- OpenPRX Agent (CLI mode) ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Webhook Agent ---
[[agents]]
id = "forward-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # Optional: sign outbound requests

# --- Custom Agent ---
[[agents]]
id = "custom-script"
name = "Custom Script"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- CLI Agent ---
[[agents]]
id = "ai-coder"
name = "AI Coder"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
```

## Section Reference

### `[server]`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `listen` | String | Yes | -- | TCP bind address in `host:port` format |

### `[security]`

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `webhook_secrets` | Array of strings | No | `[]` | List of valid HMAC-SHA256 secrets for inbound verification. Multiple secrets support key rotation. |
| `allow_unsigned` | Boolean | No | `false` | Accept unsigned requests without signature verification. **Not recommended for production.** |

**Signature verification** checks two headers in order:
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

The header value should be in the format `sha256={hex-digest}`. The service tries each secret in `webhook_secrets` until one matches.

### `[features]`

All feature flags default to `false`. This defense-in-depth approach ensures dangerous features are explicitly opted into.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tunnel_enabled` | Boolean | `false` | Enable the WSS tunnel subsystem |
| `cli_enabled` | Boolean | `false` | Enable the CLI agent executor |
| `callback_enabled` | Boolean | `false` | Enable state-transition callbacks |

### `[runtime]`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cli_max_concurrency` | Integer | `1` | Maximum number of concurrent CLI agent tasks |
| `http_timeout_secs` | Integer | `15` | Timeout for outbound HTTP requests (webhook forwarding, callbacks, Signal API) |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | Maximum backoff interval for tunnel reconnection |

### `[tunnel]`

See [WSS Tunnel](../tunnel/index.md) for detailed documentation.

### `[[agents]]`

See [Agent Types](../agents/index.md) and [Executor Reference](../agents/executors.md) for detailed documentation.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENPR_WEBHOOK_SAFE_MODE` | Set to `1`, `true`, `yes`, or `on` to disable tunnel, CLI, and callback features regardless of config. Useful for emergency lockdown. |
| `RUST_LOG` | Controls log verbosity. Default: `openpr_webhook=info`. Examples: `openpr_webhook=debug`, `openpr_webhook=trace` |

## Safe Mode

Setting `OPENPR_WEBHOOK_SAFE_MODE=1` disables:

- CLI agent execution (`cli_enabled` forced to `false`)
- Callback sending (`callback_enabled` forced to `false`)
- WSS tunnel (`tunnel_enabled` forced to `false`)

Non-dangerous agents (openclaw, openprx, webhook, custom) continue to function normally. This allows you to quickly lock down the service without modifying the config file.

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## Minimal Configuration

The smallest valid configuration:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

This starts the service with no agents and no signature verification. Useful only for development.

## Production Checklist

- [ ] Set at least one entry in `webhook_secrets`
- [ ] Set `allow_unsigned = false`
- [ ] Configure at least one agent
- [ ] If using CLI agents: set `cli_enabled = true` and review executor whitelist
- [ ] If using tunnel: use `wss://` (not `ws://`), set `hmac_secret` and `require_inbound_sig = true`
- [ ] Set `RUST_LOG=openpr_webhook=info` (avoid `debug`/`trace` in production for performance)
- [ ] Consider running with `OPENPR_WEBHOOK_SAFE_MODE=1` initially to verify non-CLI functionality

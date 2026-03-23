# Executor Reference

This page documents all 5 executor types in detail, including their configuration fields, behavior, and examples.

## openclaw

Sends notifications through messaging platforms (Signal, Telegram) via the OpenClaw CLI tool.

**How it works:** Constructs a shell command that invokes the OpenClaw binary with `--channel`, `--target`, and `--message` arguments.

**Configuration:**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # Path to the OpenClaw binary
channel = "signal"                     # Channel: "signal" or "telegram"
target = "+1234567890"                 # Phone number, group ID, or channel name
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | Path to the OpenClaw CLI binary |
| `channel` | Yes | Messaging channel (`signal`, `telegram`) |
| `target` | Yes | Recipient identifier (phone number, group ID, etc.) |

---

## openprx

Sends messages via the OpenPRX messaging infrastructure. Supports two modes: HTTP API (Signal daemon) or CLI command.

**Mode 1: Signal API (preferred)**

Sends a JSON POST to a signal-cli REST API daemon:

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # signal-cli REST API base URL
account = "+1234567890"                 # Sender phone number
target = "+0987654321"                  # Recipient phone number or UUID
channel = "signal"                      # Default: "signal"
```

The HTTP request sent to the Signal API:

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**Mode 2: CLI command**

Falls back to executing a shell command if `signal_api` is not set:

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `signal_api` | No | Signal daemon HTTP API base URL |
| `account` | No | Account phone number (used with `signal_api`) |
| `target` | Yes | Recipient phone number or UUID |
| `channel` | No | Channel name (default: `signal`) |
| `command` | No | CLI command (fallback when `signal_api` is not set) |

At least one of `signal_api` or `command` must be provided.

---

## webhook

Forwards the full webhook payload as-is to an HTTP endpoint. Useful for integrating with Slack, Discord, custom APIs, or chaining to another webhook service.

**How it works:** Sends a JSON POST to the configured URL with the original payload. Optionally signs outbound requests with HMAC-SHA256.

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Optional: sign outbound requests
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Destination URL |
| `secret` | No | HMAC-SHA256 secret for outbound signature (sent as `X-Webhook-Signature` header) |

When `secret` is set, the outbound request includes an `X-Webhook-Signature: sha256=...` header computed over the JSON body, allowing the receiving end to verify authenticity.

---

## custom

Executes an arbitrary shell command, passing the formatted message as an argument. Useful for custom integrations, logging, or triggering external scripts.

**How it works:** Runs `sh -c '{command} "{message}"'` where `{message}` is the rendered template with special characters escaped.

```toml
[[agents]]
id = "custom-logger"
name = "Log to File"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # Optional additional arguments
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `command` | Yes | Path to the executable or shell command |
| `args` | No | Additional command-line arguments |

**Security note:** The custom executor runs shell commands. Make sure the command path is trusted and not user-controllable.

---

## cli

Executes AI coding agents to process issues. This is the most powerful executor type, designed for automated code generation and issue resolution.

**Requires:** `features.cli_enabled = true` in configuration. Blocked when `OPENPR_WEBHOOK_SAFE_MODE=1`.

**Supported executors (whitelist):**

| Executor | Binary | Command Pattern |
|----------|--------|-----------------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions [--mcp-config path] "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

Any executor not in this whitelist is rejected.

**Configuration:**

```toml
[features]
cli_enabled = true
callback_enabled = true  # Required for state transitions

[[agents]]
id = "my-coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # One of: codex, claude-code, opencode
workdir = "/opt/projects/backend"      # Working directory for the CLI tool
timeout_secs = 900                     # Timeout in seconds (default: 900)
max_output_chars = 12000               # Max chars to capture from stdout/stderr (default: 12000)
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"

# State transitions (requires callback_enabled)
update_state_on_start = "in_progress"  # Set issue state when task starts
update_state_on_success = "done"       # Set issue state on success
update_state_on_fail = "todo"          # Set issue state on failure/timeout

# Callback configuration
callback = "mcp"                       # Callback mode: "mcp" or "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # Optional Bearer token for callback

# MCP closed-loop (v0.3.0+)
skip_callback_state = true             # Skip callback state updates (AI manages via MCP)
# mcp_instructions = "..."            # Custom MCP tool instructions (overrides default)
# mcp_config_path = "/path/to/mcp.json"  # claude-code --mcp-config path

# Per-agent environment variables
[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
OPENPR_WORKSPACE_ID = "e5166fd1-..."
```

**Fields:**

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `executor` | Yes | -- | CLI tool name (`codex`, `claude-code`, `opencode`) |
| `workdir` | No | -- | Working directory |
| `timeout_secs` | No | 900 | Process timeout |
| `max_output_chars` | No | 12000 | Output tail capture limit |
| `prompt_template` | No | `Fix issue {issue_id}: {title}\nContext: {reason}` | Prompt sent to the CLI tool |
| `update_state_on_start` | No | -- | Issue state on task start |
| `update_state_on_success` | No | -- | Issue state on success |
| `update_state_on_fail` | No | -- | Issue state on failure or timeout |
| `callback` | No | `mcp` | Callback protocol (`mcp` or `api`) |
| `callback_url` | No | -- | URL to send callbacks to |
| `callback_token` | No | -- | Bearer token for callback auth |
| `skip_callback_state` | No | `false` | Skip state updates in callbacks (when AI manages state via MCP) |
| `mcp_instructions` | No | built-in | Custom MCP tool instructions appended to the prompt |
| `mcp_config_path` | No | -- | Path to MCP config file (passed to claude-code via `--mcp-config`) |
| `env_vars` | No | `{}` | Extra environment variables injected into the executor subprocess |

**Prompt template placeholders (cli-specific):**

| Placeholder | Source |
|-------------|--------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**Callback payload (MCP mode):**

When `callback = "mcp"`, the service sends a JSON-RPC-style POST to `callback_url`:

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**State transition lifecycle:**

```
Event received
    |
    v
[update_state_on_start] --> issue state = "in_progress"
    |
    v
CLI tool runs (up to timeout_secs)
    |
    +-- success --> [update_state_on_success] --> issue state = "done"
    |
    +-- failure --> [update_state_on_fail] --> issue state = "todo"
    |
    +-- timeout --> [update_state_on_fail] --> issue state = "todo"
```

When `skip_callback_state = true`, all state transitions above are suppressed — the AI agent is expected to manage issue state directly via MCP tools.

---

### MCP Closed-Loop Automation

When the AI agent has OpenPR MCP tools available, it can autonomously read full issue context, fix the problem, and write results back — forming a complete closed loop.

**How it works:**

1. openpr-webhook receives a bot-task webhook event
2. It builds a prompt from `prompt_template` and appends MCP instructions (default or custom)
3. The CLI executor runs with injected `env_vars` (e.g., `OPENPR_BOT_TOKEN`)
4. The AI agent uses MCP tools to read issue details, fix the code, post comments, and update state
5. The callback reports execution metadata (duration, exit code) but skips state updates

**Default MCP instructions** (appended automatically when `mcp_instructions`, `mcp_config_path`, or `env_vars` are configured):

```
1. Call work_items.get with work_item_id="{issue_id}" to read full issue details
2. Call comments.list with work_item_id="{issue_id}" to read all comments
3. Call work_items.list_labels with work_item_id="{issue_id}" to read labels
4. After completing the fix, call comments.create to post a summary
5. Call work_items.update to set state to "done" if successful
```

You can override these with a custom `mcp_instructions` field.

**Environment variables** (`env_vars`):

Inject per-agent environment variables into the executor subprocess. Useful for providing different API URLs, tokens, or workspace IDs to different agents:

```toml
[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_bot_token_here"
OPENPR_WORKSPACE_ID = "e5166fd1-..."
```

**MCP config path** (`mcp_config_path`):

For `claude-code` executor, if the agent needs a non-global MCP configuration, specify the path:

```toml
mcp_config_path = "/etc/openpr-webhook/mcp-config.json"
```

This adds `--mcp-config /etc/openpr-webhook/mcp-config.json` to the claude command.

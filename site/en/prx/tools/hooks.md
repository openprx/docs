---
title: Hooks
description: Event-driven extension system with 8 lifecycle events, shell hook execution, WASM plugin callbacks, HTTP API management, and event bus integration for observability and automation.
---

# Hooks

PRX hooks provide an event-driven extension system that lets you react to lifecycle events during agent execution. Every significant moment in the agent loop -- starting a turn, calling an LLM, invoking a tool, encountering an error -- emits a hook event. You attach actions to these events via a `hooks.json` configuration file, WASM plugin manifests, or the HTTP API.

Hooks are **fire-and-forget** by design. They never block the agent loop, never modify execution flow, and never inject data back into the conversation. This makes them ideal for audit logging, metrics collection, external notifications, and side-effect automation without introducing latency or failure modes into the core agent pipeline.

There are three hook execution backends:

- **Shell hooks** -- Run an external command with the event payload passed via environment variable, temp file, or stdin. Configured in `hooks.json`.
- **WASM plugin hooks** -- Call the `on-event` function exported by a WASM plugin. Declared in the plugin's `plugin.toml` manifest.
- **Event bus hooks** -- Publish to the internal event bus on topic `prx.lifecycle.<event>`. Always active; no configuration needed.

## Hook Events

PRX emits 8 lifecycle events. Each event carries a JSON payload with context-specific fields.

| Event | When Emitted | Payload Fields |
|-------|-------------|----------------|
| `agent_start` | Agent loop begins a new turn | `agent` (string), `session` (string) |
| `agent_end` | Agent loop completes a turn | `success` (bool), `messages_count` (number) |
| `llm_request` | Before sending a request to the LLM provider | `provider` (string), `model` (string), `messages_count` (number) |
| `llm_response` | After receiving the LLM response | `provider` (string), `model` (string), `duration_ms` (number), `success` (bool) |
| `tool_call_start` | Before a tool begins execution | `tool` (string), `arguments` (object) |
| `tool_call` | After a tool completes execution | `tool` (string), `success` (bool), `output` (string) |
| `turn_complete` | Full turn finished (all tools resolved) | _(empty object)_ |
| `error` | Any error during execution | `component` (string), `message` (string) |

### Payload Schemas

All payloads are JSON objects. The top-level structure wraps the event-specific fields:

```json
{
  "event": "llm_response",
  "timestamp": "2026-03-21T08:15:30.123Z",
  "session_id": "sess_abc123",
  "payload": {
    "provider": "openai",
    "model": "gpt-4o",
    "duration_ms": 1842,
    "success": true
  }
}
```

The `event`, `timestamp`, and `session_id` fields are present on every hook event. The `payload` object varies by event type as described in the table above.

## Configuration

Shell hooks are configured in a `hooks.json` file placed in the workspace directory (the same directory as `config.toml`). PRX watches this file for changes and **hot-reloads** the configuration without requiring a restart.

### Basic Structure

```json
{
  "hooks": {
    "<event_name>": [
      {
        "command": "/path/to/script",
        "args": ["--flag", "value"],
        "env": {
          "CUSTOM_VAR": "value"
        },
        "cwd": "/working/directory",
        "timeout_ms": 5000,
        "stdin_json": true
      }
    ]
  }
}
```

Each event name maps to an array of hook actions. Multiple actions can be attached to the same event; they execute concurrently and independently.

### Full Example

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/usr/local/bin/notify",
        "args": ["--channel", "ops", "--title", "Agent Started"],
        "timeout_ms": 3000
      }
    ],
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/log_latency.py"],
        "stdin_json": true,
        "timeout_ms": 2000
      }
    ],
    "tool_call": [
      {
        "command": "/opt/hooks/audit_tool_usage.sh",
        "env": {
          "LOG_DIR": "/var/log/prx/audit"
        },
        "timeout_ms": 5000
      }
    ],
    "error": [
      {
        "command": "curl",
        "args": [
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

## Hook Action Fields

Each hook action object supports the following fields:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `command` | string | Yes | -- | Absolute path to the executable or a command name found in the sanitized PATH |
| `args` | string[] | No | `[]` | Arguments passed to the command |
| `env` | object | No | `{}` | Additional environment variables merged into the sanitized execution environment |
| `cwd` | string | No | workspace dir | Working directory for the spawned process |
| `timeout_ms` | number | No | `30000` | Maximum execution time in milliseconds. The process is killed (SIGKILL) if it exceeds this limit |
| `stdin_json` | bool | No | `false` | When `true`, the full event payload JSON is piped to the process via stdin |

### Notes on `command`

The `command` field undergoes security validation before execution. It must not contain shell metacharacters (`;`, `|`, `&`, `` ` ``, `$()`) -- these are rejected to prevent shell injection. If you need shell features, wrap them in a script file and point `command` to that script.

Relative paths are resolved against the workspace directory. However, using absolute paths is recommended for predictability.

## Payload Delivery

Hook actions receive the event payload through three channels simultaneously. This redundancy ensures scripts in any language can access the data through whichever method is most convenient.

### 1. Environment Variable (`ZERO_HOOK_PAYLOAD`)

The payload JSON string is set as the `ZERO_HOOK_PAYLOAD` environment variable. This is the simplest access method for shell scripts:

```bash
#!/bin/bash
# Read payload from environment variable
echo "$ZERO_HOOK_PAYLOAD" | jq '.payload.tool'
```

**Size limit**: 8 KB. If the serialized payload exceeds 8 KB, the environment variable is **not set** and the payload is only available via the temp file and stdin channels.

### 2. Temporary File (`ZERO_HOOK_PAYLOAD_FILE`)

The payload is written to a temporary file, and the file path is set in the `ZERO_HOOK_PAYLOAD_FILE` environment variable. The temp file is automatically deleted after the hook process exits.

```python
import os, json

payload_file = os.environ["ZERO_HOOK_PAYLOAD_FILE"]
with open(payload_file) as f:
    data = json.load(f)
print(f"Tool: {data['payload']['tool']}, Success: {data['payload']['success']}")
```

This channel has no size limit and is the recommended method for payloads that may be large (e.g., `tool_call` with verbose output).

### 3. Standard Input (stdin)

When `stdin_json` is set to `true` in the hook action, the payload JSON is piped to the process via stdin. This is useful for commands that natively read from stdin, such as `curl -d @-` or `jq`.

```bash
#!/bin/bash
# Read from stdin (requires stdin_json: true in hook config)
read -r payload
echo "$payload" | jq -r '.payload.message'
```

## Environment Variables

Every hook process receives the following environment variables, in addition to `ZERO_HOOK_PAYLOAD` and `ZERO_HOOK_PAYLOAD_FILE`:

| Variable | Description | Example |
|----------|-------------|---------|
| `ZERO_HOOK_EVENT` | The event name that triggered this hook | `tool_call` |
| `ZERO_HOOK_SESSION` | Current session identifier | `sess_abc123` |
| `ZERO_HOOK_TIMESTAMP` | ISO 8601 timestamp of the event | `2026-03-21T08:15:30.123Z` |
| `ZERO_HOOK_PAYLOAD` | Full payload as JSON string (omitted if >8 KB) | `{"event":"tool_call",...}` |
| `ZERO_HOOK_PAYLOAD_FILE` | Path to temp file containing the payload | `/tmp/prx-hook-a1b2c3.json` |

The execution environment is **sanitized** before the hook process starts. Sensitive and dangerous environment variables are stripped (see [Security](#security) below), and only the variables listed above plus any `env` overrides from the hook action are available.

## WASM Plugin Hooks

WASM plugins can subscribe to hook events by exporting the `on-event` function defined in the PRX WIT (WebAssembly Interface Types) interface.

### WIT Interface

```wit
interface hooks {
    /// Called when a subscribed event fires.
    /// Returns Ok(()) on success, Err(message) on failure.
    on-event: func(event: string, payload-json: string) -> result<_, string>;
}
```

The `event` parameter is the event name (e.g., `"tool_call"`), and `payload-json` is the full payload serialized as a JSON string, identical to what shell hooks receive.

### Event Subscription Patterns

Plugins declare which events they want to receive in their `plugin.toml` manifest using pattern matching:

| Pattern | Matches | Example |
|---------|---------|---------|
| Exact match | A single specific event | `"tool_call"` |
| Wildcard suffix | All events matching a prefix | `"prx.lifecycle.*"` |
| Universal | Every event | `"*"` |

### Plugin Manifest Example

```toml
[plugin]
name = "audit-logger"
version = "0.1.0"
description = "Logs all lifecycle events to an audit trail"

[[capabilities]]
type = "hook"
events = ["agent_start", "agent_end", "error"]

[[capabilities]]
type = "hook"
events = ["prx.lifecycle.*"]
```

A single plugin can declare multiple `[[capabilities]]` blocks with different event patterns. The union of all matched events determines which events the plugin receives.

### Execution Model

WASM plugin hooks run inside the WASM sandbox with the same resource limits as other plugin functions. They are subject to:

- **Memory limit**: Defined in the plugin's resource configuration (default 64 MB)
- **Execution timeout**: Same as `timeout_ms` for shell hooks (default 30 seconds)
- **No filesystem access**: Unless explicitly granted via WASI capabilities
- **No network access**: Unless explicitly granted via capability flags

If a WASM hook returns `Err(message)`, the error is logged but does not affect the agent loop. Hooks are always fire-and-forget.

## Event Bus Integration

Every hook event is automatically published to the internal event bus on topic `prx.lifecycle.<event>`. This happens regardless of whether any shell or WASM hooks are configured.

### Topic Format

```
prx.lifecycle.agent_start
prx.lifecycle.agent_end
prx.lifecycle.llm_request
prx.lifecycle.llm_response
prx.lifecycle.tool_call_start
prx.lifecycle.tool_call
prx.lifecycle.turn_complete
prx.lifecycle.error
```

### Subscription Types

Internal components and plugins can subscribe to event bus topics using three patterns:

- **Exact**: `prx.lifecycle.tool_call` -- receives only `tool_call` events
- **Wildcard**: `prx.lifecycle.*` -- receives all lifecycle events
- **Hierarchical**: `prx.*` -- receives all PRX-domain events (lifecycle, metrics, etc.)

### Payload Limits

| Constraint | Value |
|------------|-------|
| Maximum payload size | 64 KB |
| Maximum recursion depth | 8 levels |
| Dispatch model | Fire-and-forget (async) |
| Delivery guarantee | At-most-once |

If a hook event triggers another hook event (e.g., a hook script calls a tool that emits `tool_call`), the recursion counter increments. At 8 levels deep, further event emissions are silently dropped to prevent infinite loops.

## HTTP API

Hooks can be managed programmatically through the HTTP API. All endpoints require authentication and return JSON responses.

### List All Hooks

```
GET /api/hooks
```

Response:

```json
{
  "hooks": [
    {
      "id": "hook_01",
      "event": "error",
      "action": {
        "command": "/opt/hooks/notify_error.sh",
        "args": [],
        "timeout_ms": 5000,
        "stdin_json": false
      },
      "enabled": true,
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  ]
}
```

### Create a Hook

```
POST /api/hooks
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true
}
```

Response (201 Created):

```json
{
  "id": "hook_02",
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true,
  "created_at": "2026-03-21T08:00:00Z",
  "updated_at": "2026-03-21T08:00:00Z"
}
```

### Update a Hook

```
PUT /api/hooks/hook_02
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency_v2.py"],
    "stdin_json": true,
    "timeout_ms": 5000
  },
  "enabled": true
}
```

Response (200 OK): Returns the updated hook object.

### Delete a Hook

```
DELETE /api/hooks/hook_02
```

Response (204 No Content): Empty body on success.

### Toggle a Hook

```
PATCH /api/hooks/hook_01/toggle
```

Response (200 OK):

```json
{
  "id": "hook_01",
  "enabled": false
}
```

This endpoint flips the `enabled` state. Disabled hooks remain in the configuration but are not executed when their event fires.

## Security

Hook execution is subject to several security measures to prevent privilege escalation, data exfiltration, and denial-of-service.

### Blocked Environment Variables

The following environment variables are stripped from the hook execution environment and cannot be overridden via the `env` field in hook actions:

| Variable | Reason |
|----------|--------|
| `LD_PRELOAD` | Library injection attack vector |
| `LD_LIBRARY_PATH` | Library search path manipulation |
| `DYLD_INSERT_LIBRARIES` | macOS library injection |
| `DYLD_LIBRARY_PATH` | macOS library path manipulation |
| `PATH` | Prevents PATH hijacking; a minimal safe PATH is provided |
| `HOME` | Prevents home directory spoofing |

### Input Validation

- **Null byte rejection**: Any `command`, `args`, `env` key, or `env` value containing a null byte (`\0`) is rejected. This prevents null byte injection attacks that could truncate strings at the OS level.
- **Shell metacharacter rejection**: The `command` field must not contain `;`, `|`, `&`, `` ` ``, `$(`, or other shell metacharacters. This prevents shell injection even if the command is accidentally passed through a shell.
- **Path traversal**: The `cwd` field is validated to ensure it does not escape the workspace directory via `..` components.

### Timeout Enforcement

Every hook process is subject to the configured `timeout_ms` (default 30 seconds). If the process exceeds this limit:

1. `SIGTERM` is sent to the process
2. After a 5-second grace period, `SIGKILL` is sent
3. The hook is marked as timed out in internal metrics
4. The agent loop is **not** affected

### Resource Isolation

Hook processes inherit the same cgroup and namespace restrictions as shell tool executions when a sandbox backend is active. In Docker sandbox mode, hooks run in a separate container with no network access by default.

## Examples

### Audit Logging Hook

Log every tool invocation to a file for compliance auditing:

```json
{
  "hooks": {
    "tool_call": [
      {
        "command": "/opt/hooks/audit_log.sh",
        "env": {
          "AUDIT_LOG": "/var/log/prx/tool_audit.jsonl"
        },
        "timeout_ms": 2000
      }
    ]
  }
}
```

`/opt/hooks/audit_log.sh`:

```bash
#!/bin/bash
echo "$ZERO_HOOK_PAYLOAD" >> "$AUDIT_LOG"
```

### Error Notification Hook

Send error events to a Slack channel:

```json
{
  "hooks": {
    "error": [
      {
        "command": "curl",
        "args": [
          "-s", "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

### LLM Latency Metrics Hook

Track LLM response times for monitoring dashboards:

```json
{
  "hooks": {
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/metrics.py"],
        "stdin_json": true,
        "timeout_ms": 3000
      }
    ]
  }
}
```

`/opt/hooks/metrics.py`:

```python
import sys, json

data = json.load(sys.stdin)
payload = data["payload"]
provider = payload["provider"]
model = payload["model"]
duration = payload["duration_ms"]
success = payload["success"]

# Push to StatsD, Prometheus pushgateway, or any metrics backend
print(f"prx.llm.duration,provider={provider},model={model} {duration}")
print(f"prx.llm.success,provider={provider},model={model} {1 if success else 0}")
```

### Session Lifecycle Tracking

Track agent session start and end for usage analytics:

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["start"],
        "timeout_ms": 2000
      }
    ],
    "agent_end": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["end"],
        "timeout_ms": 2000
      }
    ]
  }
}
```

## Related

- [Shell Execution](/en/prx/tools/shell) -- Shell tool that hooks often wrap
- [MCP Integration](/en/prx/tools/mcp) -- External tool protocol that emits `tool_call` events
- [Plugins](/en/prx/plugins/) -- WASM plugin system including hook capabilities
- [Observability](/en/prx/observability/) -- Metrics and tracing that complement hooks
- [Security](/en/prx/security/) -- Sandbox and policy engine that governs hook execution

---
title: Approval Workflow
description: How PRX handles supervised tool calls that require human approval before execution.
---

# Approval Workflow

When a tool's security policy is set to `"supervised"`, PRX pauses execution and waits for human approval before running the tool call. This provides a critical safety layer for high-risk operations -- shell commands, file writes, network requests, or any action that could have irreversible consequences.

## მიმოხილვა

The approval workflow sits between the agent loop and tool execution:

```
Agent Loop
    │
    ├── LLM emits tool call: shell("rm -rf /tmp/data")
    │
    ▼
┌───────────────────────────────────┐
│        Policy Engine              │
│                                   │
│  Tool: "shell"                    │
│  Policy: "supervised"             │
│  Action: REQUIRE APPROVAL         │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│      Approval Request             │
│                                   │
│  Pending...                       │
│  ├── Notify supervisor            │
│  ├── Wait for response            │
│  └── Timeout after N seconds      │
└───────────────┬───────────────────┘
                │
         ┌──────┴──────┐
         │             │
    ┌────▼────┐   ┌────▼────┐
    │ Approved│   │ Denied  │
    │         │   │         │
    │ Execute │   │ Return  │
    │ tool    │   │ error   │
    └─────────┘   └─────────┘
```

## კონფიგურაცია

### Setting Tool Policies

Configure which tools require approval in `config.toml`:

```toml
[security.tool_policy]
# Default policy for all tools.
# "allow" -- execute immediately
# "deny" -- block execution entirely
# "supervised" -- require approval before execution
default = "allow"

# Per-tool policy overrides.
[security.tool_policy.tools]
shell = "supervised"
file_write = "supervised"
http_request = "supervised"
git_operations = "allow"
memory_store = "allow"
browser = "deny"

# Group-level policies.
[security.tool_policy.groups]
sessions = "allow"
automation = "supervised"
```

### Approval Settings

```toml
[security.approval]
# How long to wait for a response before timing out (seconds).
timeout_secs = 300

# Action when approval times out: "deny" or "allow".
# "deny" is the safe default -- unanswered requests are rejected.
on_timeout = "deny"

# Notification channel for approval requests.
# The supervisor is notified through this channel.
notify_channel = "telegram"

# Supervisor user ID or identifier.
# Only this user can approve or deny requests.
supervisor_id = "admin"

# Auto-approve patterns: tool calls matching these patterns
# are approved automatically without human intervention.
# Use with caution.
[[security.approval.auto_approve]]
tool = "shell"
command_pattern = "^(ls|cat|head|tail|wc|grep|find|echo) "

[[security.approval.auto_approve]]
tool = "file_write"
path_pattern = "^/tmp/"
```

## Approval Flow

### Step 1: Policy Check

When the agent emits a tool call, the policy engine evaluates it:

1. Check per-tool policy (`security.tool_policy.tools.<name>`)
2. If no per-tool policy, check group policy (`security.tool_policy.groups.<group>`)
3. If no group policy, use the default policy (`security.tool_policy.default`)

If the resolved policy is `"supervised"`, the approval flow is triggered.

### Step 2: Auto-Approve Check

Before notifying the supervisor, PRX checks if the request matches any `auto_approve` pattern. Auto-approve rules use regex patterns to match tool arguments:

| Field | Description |
|-------|-------------|
| `tool` | Tool name that the rule applies to |
| `command_pattern` | Regex pattern matched against the shell command (for `shell` tool) |
| `path_pattern` | Regex pattern matched against file paths (for `file_write`, `file_read`) |
| `url_pattern` | Regex pattern matched against URLs (for `http_request`) |
| `args_pattern` | Regex pattern matched against the full JSON arguments |

If a match is found, the request is auto-approved and execution proceeds immediately. This is useful for safe, read-only commands that would create excessive approval fatigue.

### Step 3: Notification

If no auto-approve rule matches, PRX creates an approval request and notifies the supervisor:

```
[APPROVAL REQUIRED]

Tool: shell
Arguments: {"command": "rm -rf /tmp/data"}
Session: abc-123
Agent: default
Time: 2026-03-21 14:30:22 UTC

Reply with:
  /approve -- execute the tool call
  /deny -- reject the tool call
  /deny reason: <explanation> -- reject with reason
```

The notification is sent through the configured `notify_channel`. Supported channels:

| Channel | Notification Method |
|---------|-------------------|
| Telegram | Message to supervisor's chat |
| Discord | DM to supervisor |
| Slack | DM to supervisor |
| CLI | Terminal prompt (stdin) |
| Email | Email to configured address |
| Webhook | HTTP POST to configured URL |

### Step 4: Wait

The agent loop pauses while waiting for the supervisor's response. During this time:

- The agent cannot execute any tools (the current tool call blocks)
- Other sessions continue to operate independently
- The approval request has a unique ID for tracking

### Step 5: Resolution

The supervisor responds with one of:

| Response | Effect |
|----------|--------|
| **Approve** | The tool call executes normally and the result is returned to the agent |
| **Deny** | The tool call is rejected and an error message is returned to the agent |
| **Deny with reason** | Same as deny, but the reason is included in the error message so the agent can adapt |
| **Timeout** | The `on_timeout` action is applied (default: deny) |

## Request Lifecycle

Each approval request transitions through these states:

```
PENDING → APPROVED → EXECUTED
       → DENIED
       → TIMED_OUT
       → CANCELLED (if the session ends before resolution)
```

| State | Description |
|-------|-------------|
| `PENDING` | Waiting for supervisor response |
| `APPROVED` | Supervisor approved, tool executing |
| `EXECUTED` | Tool execution completed after approval |
| `DENIED` | Supervisor explicitly denied the request |
| `TIMED_OUT` | No response within `timeout_secs` |
| `CANCELLED` | Session terminated before resolution |

## Approval Interfaces

In CLI mode, approval requests appear as interactive terminal prompts with tool name, arguments, and risk level. For programmatic access, PRX exposes a REST API:

```bash
# List pending requests / approve / deny
curl http://localhost:8080/api/approvals?status=pending
curl -X POST http://localhost:8080/api/approvals/{id}/approve
curl -X POST http://localhost:8080/api/approvals/{id}/deny \
  -d '{"reason": "Not permitted"}'
```

## Audit Trail

All approval decisions are recorded in the activity log with fields: `request_id`, `tool`, `arguments`, `session_id`, `decision`, `decided_by`, `decided_at`, `reason`, and `execution_result`. Access via `prx audit approvals --last 50` or export with `--format json`.

## Security Notes

- **Default deny on timeout** -- always set `on_timeout = "deny"` in production. Allowing unanswered requests to proceed defeats the purpose of supervision.
- **Auto-approve carefully** -- overly broad auto-approve patterns can bypass the approval workflow. Use specific regex patterns and review them regularly.
- **Supervisor authentication** -- ensure the `notify_channel` authenticates the supervisor. A compromised notification channel could allow unauthorized approvals.
- **Rate limiting** -- if an agent repeatedly triggers approval requests for the same operation, consider updating the policy to `"deny"` for that tool or adding a more specific auto-approve rule.
- **Multi-supervisor** -- in team deployments, consider configuring multiple supervisors. Any one of them can approve or deny.

## Related Pages

- [Security Overview](/ka/prx/security/)
- [Policy Engine](/ka/prx/security/policy-engine)
- [Sandbox](/ka/prx/security/sandbox)
- [Audit Logging](/ka/prx/security/audit)
- [Tools Overview](/ka/prx/tools/)

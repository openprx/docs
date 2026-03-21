---
title: Approval Workflow
description: How PRX handles supervised tool calls that require human approval before execution.
---

# Approval Workflow

Lorsque la politique de securite d'un outil est definie a `"supervised"`, PRX met en pause execution et attend for approbation humaine before running l'outil call. This provides a critical safety layer for high-risk operations -- shell commands, file writes, network requests, ou any action that could have irreversible consequences.

## Apercu

Le flux d'approbation se situe entre la boucle de l'agent et l'execution d'outil:

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

## Configuration

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

When l'agent emet a appel d'outil, the moteur de politiques evaluates it:

1. Check per-tool policy (`security.tool_policy.tools.<name>`)
2. Si aucun per-tool policy, check group policy (`security.tool_policy.groups.<group>`)
3. Si aucun group policy, use la valeur par defaut policy (`security.tool_policy.default`)

Si le resolved policy is `"supervised"`, le flux d'approbation est declenche.

### Step 2: Auto-Approve Check

Before notifying the supervisor, PRX verifie if la requete matches any `auto_approve` pattern. Auto-approve rules use regex patterns to match tool arguments:

| Champ | Description |
|-------|-------------|
| `tool` | Tool name that the rule applies to |
| `command_pattern` | Regex pattern matched against the shell command (for `shell` tool) |
| `path_pattern` | Regex pattern matched against file paths (for `file_write`, `file_read`) |
| `url_pattern` | Regex pattern matched against URLs (for `http_request`) |
| `args_pattern` | Regex pattern matched against the full JSON arguments |

Si un match is found, la requete is auto-approved et execution proceeds immediately. This est utile pour safe, read-only commands that would create excessive approval fatigue.

### Step 3: Nontification

Si aucun auto-approve rule matches, PRX cree an approval request and notifies the supervisor:

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

The notification is sent via le configured `notify_channel`. Supported channels:

| Channel | Nontification Method |
|---------|-------------------|
| Telegram | Message to supervisor's chat |
| Discord | DM to supervisor |
| Slack | DM to supervisor |
| CLI | Terminal prompt (stdin) |
| Email | Email pour configurerd address |
| Webhook | HTTP POST pour configurerd URL |

### Step 4: Wait

L'boucle de l'agent met en pause tandis que waiting pour le supervisor's response. During this time:

- L'agent ne peut pas execute any tools (the current appel d'outil blocks)
- Other sessions continue to operate independently
- The approval request hcomme un unique ID for tracking

### Step 5: Resolution

The supervisor responds with one of:

| Response | Effect |
|----------|--------|
| **Approve** | L'outil call executes normally and le resultat is retournes to l'agent |
| **Deny** | L'outil call est rejete and an error message is retournes to l'agent |
| **Deny with reason** | Same as deny, mais le reason is inclus dans l'erreur message so l'agent can adapt |
| **Timeout** | The `on_timeout` action is applied (par defaut : deny) |

## Request Lifecycle

Each approval request transitions via lese states:

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
| `DENIED` | Supervisor explicitly denied la requete |
| `TIMED_OUT` | Non response within `timeout_secs` |
| `CANCELLED` | Session terminated before resolution |

## Approval Interfaces

In CLI mode, approval requests appear as interactive terminal prompts with tool name, arguments, and risk level. For programmatic access, PRX expose a REST API:

```bash
# List pending requests / approve / deny
curl http://localhost:8080/api/approvals?status=pending
curl -X POST http://localhost:8080/api/approvals/{id}/approve
curl -X POST http://localhost:8080/api/approvals/{id}/deny \
  -d '{"reason": "Not permitted"}'
```

## Audit Trail

All approval decisions sont enregistres dans le activity log with fields: `request_id`, `tool`, `arguments`, `session_id`, `decision`, `decided_by`, `decided_at`, `reason`, et `execution_result`. Access via `prx audit approvals --last 50` ou export with `--format json`.

## Securite Nontes

- **Defaut deny on timeout** -- always set `on_timeout = "deny"` in production. Allowing unanswered requests to proceed defeats the purpose of supervision.
- **Auto-approve carefully** -- overly broad auto-approve patterns can bypass the approval workflow. Use specific regex patterns and review them regularly.
- **Supervisor authentication** -- ensure the `notify_channel` authenticates the supervisor. A compromised notification channel could allow unauthorized approvals.
- **Rate limiting** -- if an agent repeatedly triggers approval requests pour le same operation, envisagez updating la politique to `"deny"` for that tool or adding a more specific auto-approve rule.
- **Multi-supervisor** -- in team deployments, envisagez configuring multiple supervisors. Any one of them can approve or deny.

## Voir aussi Pages

- [Security Overview](/fr/prx/security/)
- [Moteur de politiques](/fr/prx/security/policy-engine)
- [Sandbox](/fr/prx/security/sandbox)
- [Journalisation d'audit](/fr/prx/security/audit)
- [Tools Overview](/fr/prx/tools/)

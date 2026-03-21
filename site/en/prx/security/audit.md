---
title: Audit Logging
description: Security audit logging system for tracking all security-relevant operations in PRX.
---

# Audit Logging

PRX includes a built-in audit logging system that records all security-relevant operations. The `AuditLogger` tracks who did what, when, and whether it succeeded -- providing a tamper-evident trail for compliance, incident response, and forensic analysis.

## Overview

The audit system captures structured events for every security-sensitive action:

- Authentication attempts (success and failure)
- Authorization decisions (allow and deny)
- Configuration changes
- Tool executions and sandbox events
- Memory access and modification
- Channel connections and disconnections
- Evolution proposals and applications
- Plugin lifecycle events

Every audit event includes a timestamp, actor identity, action description, target resource, and outcome.

## Audit Event Structure

Each audit event is a structured record with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | `DateTime<Utc>` | When the event occurred (UTC, nanosecond precision) |
| `event_id` | `String` | Unique identifier for the event (UUIDv7, time-ordered) |
| `actor` | `Actor` | Who performed the action (user, agent, system, or plugin) |
| `action` | `String` | What was done (e.g., `auth.login`, `tool.execute`, `config.update`) |
| `target` | `String` | The resource acted upon (e.g., session ID, config key, file path) |
| `outcome` | `Outcome` | Result: `success`, `failure`, or `denied` |
| `metadata` | `Map<String, Value>` | Additional context (IP address, reason for denial, etc.) |
| `session_id` | `Option<String>` | Associated agent session, if any |
| `severity` | `Severity` | Event severity: `info`, `warning`, `critical` |

### Actor Types

| Actor Type | Description | Example |
|-----------|-------------|---------|
| `user` | A human user identified by channel or API auth | `user:telegram:123456789` |
| `agent` | The PRX agent itself | `agent:default` |
| `system` | Internal system processes (cron, evolution) | `system:evolution` |
| `plugin` | A WASM plugin | `plugin:my-plugin:v1.2.0` |

### Action Categories

Actions follow a dot-separated namespace convention:

| Category | Actions | Severity |
|----------|---------|----------|
| `auth.*` | `auth.login`, `auth.logout`, `auth.token_refresh`, `auth.pairing` | info / warning |
| `authz.*` | `authz.allow`, `authz.deny`, `authz.policy_check` | info / warning |
| `config.*` | `config.update`, `config.reload`, `config.hot_reload` | warning |
| `tool.*` | `tool.execute`, `tool.sandbox_escape_attempt`, `tool.timeout` | info / critical |
| `memory.*` | `memory.store`, `memory.recall`, `memory.delete`, `memory.compact` | info |
| `channel.*` | `channel.connect`, `channel.disconnect`, `channel.error` | info / warning |
| `evolution.*` | `evolution.propose`, `evolution.apply`, `evolution.rollback` | warning / critical |
| `plugin.*` | `plugin.load`, `plugin.unload`, `plugin.error`, `plugin.permission_denied` | info / warning |
| `session.*` | `session.create`, `session.terminate`, `session.timeout` | info |

## Configuration

```toml
[security.audit]
enabled = true
min_severity = "info"           # minimum severity to log: "info", "warning", "critical"

[security.audit.file]
enabled = true
path = "~/.local/share/openprx/audit.log"
format = "jsonl"                # "jsonl" or "csv"
max_size_mb = 100               # rotate when file exceeds this size
max_files = 10                  # keep up to 10 rotated files
compress_rotated = true         # gzip rotated files

[security.audit.database]
enabled = false
backend = "sqlite"              # "sqlite" or "postgres"
path = "~/.local/share/openprx/audit.db"
retention_days = 90             # auto-delete events older than 90 days
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable or disable audit logging globally |
| `min_severity` | `String` | `"info"` | Minimum severity level to record |
| `file.enabled` | `bool` | `true` | Write audit events to a log file |
| `file.path` | `String` | `"~/.local/share/openprx/audit.log"` | Path to the audit log file |
| `file.format` | `String` | `"jsonl"` | Log format: `"jsonl"` (one JSON object per line) or `"csv"` |
| `file.max_size_mb` | `u64` | `100` | Maximum file size before rotation (MB) |
| `file.max_files` | `u32` | `10` | Number of rotated files to retain |
| `file.compress_rotated` | `bool` | `true` | Compress rotated log files with gzip |
| `database.enabled` | `bool` | `false` | Write audit events to a database |
| `database.backend` | `String` | `"sqlite"` | Database backend: `"sqlite"` or `"postgres"` |
| `database.path` | `String` | `""` | Database path (SQLite) or connection URL (PostgreSQL) |
| `database.retention_days` | `u64` | `90` | Auto-delete events older than N days. 0 = keep forever |

## Storage Backends

### File (JSONL)

The default backend writes one JSON object per line to a log file. This format is compatible with standard log analysis tools (jq, grep, Elasticsearch ingest).

Example log entry:

```json
{
  "timestamp": "2026-03-21T10:15:30.123456789Z",
  "event_id": "019520a8-1234-7000-8000-000000000001",
  "actor": {"type": "user", "id": "user:telegram:123456789"},
  "action": "tool.execute",
  "target": "shell:ls -la /tmp",
  "outcome": "success",
  "metadata": {"sandbox": "bubblewrap", "duration_ms": 45},
  "session_id": "sess_abc123",
  "severity": "info"
}
```

### Database (SQLite / PostgreSQL)

The database backend stores events in a structured table with indexes on `timestamp`, `actor`, `action`, and `severity` for efficient querying.

## Querying Audit Trails

### CLI Queries

```bash
# View recent audit events
prx audit log --tail 50

# Filter by action category
prx audit log --action "auth.*" --last 24h

# Filter by severity
prx audit log --severity critical --last 7d

# Filter by actor
prx audit log --actor "user:telegram:123456789"

# Export to JSON
prx audit log --last 30d --format json > audit_export.json
```

### Database Queries

When using the database backend, you can query directly with SQL:

```sql
-- Failed authentication attempts in the last 24 hours
SELECT * FROM audit_events
WHERE action LIKE 'auth.%'
  AND outcome = 'failure'
  AND timestamp > datetime('now', '-24 hours')
ORDER BY timestamp DESC;

-- Tool execution by a specific user
SELECT action, target, outcome, timestamp
FROM audit_events
WHERE actor_id = 'user:telegram:123456789'
  AND action LIKE 'tool.%'
ORDER BY timestamp DESC
LIMIT 100;

-- Critical events summary
SELECT action, COUNT(*) as count
FROM audit_events
WHERE severity = 'critical'
  AND timestamp > datetime('now', '-7 days')
GROUP BY action
ORDER BY count DESC;
```

## Compliance

The audit logging system is designed to support compliance requirements:

- **Immutability** -- log files are append-only; rotated files can be integrity-checked with checksums
- **Completeness** -- all security-relevant operations are logged by default at the `info` level
- **Retention** -- configurable retention periods with automatic rotation and deletion
- **Non-repudiation** -- every event includes an actor identity and timestamp
- **Availability** -- dual output (file + database) ensures events are not lost if one backend fails

### Recommended Settings for Compliance

```toml
[security.audit]
enabled = true
min_severity = "info"

[security.audit.file]
enabled = true
format = "jsonl"
max_size_mb = 500
max_files = 50
compress_rotated = true

[security.audit.database]
enabled = true
backend = "postgres"
path = "postgresql://audit_user:password@localhost/prx_audit"
retention_days = 365
```

## Performance

The audit logger is designed for minimal overhead:

- Events are written asynchronously via a bounded channel (default capacity: 10,000 events)
- File writes are buffered and flushed periodically (every 1 second or every 100 events)
- Database writes are batched (default batch size: 50 events)
- If the event channel is full, events are dropped with a warning counter (never blocks the main agent loop)

## Limitations

- The file backend does not provide built-in tamper detection (consider external integrity monitoring for high-security deployments)
- Audit events from plugin code are logged by the host; plugins cannot bypass the audit system
- The CSV format does not support nested metadata fields (use JSONL for full fidelity)
- Database retention cleanup runs once per hour; events may persist slightly beyond the configured retention period

## Related Pages

- [Security Overview](./)
- [Policy Engine](./policy-engine) -- authorization decisions that generate audit events
- [Sandbox](./sandbox) -- tool execution isolation
- [Threat Model](./threat-model) -- security architecture and trust boundaries

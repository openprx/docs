---
title: Cron Tools
description: Nine tools for creating, managing, and executing scheduled tasks with cron expressions and the Xin autonomous task engine.
---

# Cron Tools

PRX provides nine tools for time-based task automation, spanning traditional cron job management and the advanced Xin scheduling engine. These tools let the agent create scheduled tasks, inspect job history, trigger manual runs, and orchestrate background operations on recurring schedules.

The cron tools are divided into two systems: the **cron subsystem** for standard scheduled jobs using cron expressions, and the **Xin engine** for advanced task scheduling with dependency chains, conditional execution, and integration with the self-evolution pipeline.

All cron and scheduling tools are registered in the `all_tools()` registry and are available whenever the daemon is running.

## Configuration

### Cron System

```toml
[cron]
enabled = true
timezone = "UTC"           # Timezone for cron expressions

# Define built-in scheduled tasks
[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"     # Every day at 09:00 UTC
action = "agent"
prompt = "Generate a daily summary report and send it to the user."

[[cron.tasks]]
name = "memory-cleanup"
schedule = "0 3 * * *"     # Every day at 03:00 UTC
action = "agent"
prompt = "Run memory hygiene: archive old daily entries and compact core memories."

[[cron.tasks]]
name = "repo-check"
schedule = "*/30 * * * *"  # Every 30 minutes
action = "shell"
command = "cd /home/user/project && git fetch --all"
```

### Xin Engine

```toml
[xin]
enabled = true
interval_minutes = 5            # Tick interval in minutes (minimum 1)
max_concurrent = 4              # Maximum concurrent task executions per tick
max_tasks = 128                 # Maximum total tasks in the store
stale_timeout_minutes = 60      # Minutes before a running task is marked stale
builtin_tasks = true            # Auto-register built-in system tasks
evolution_integration = false   # Let Xin manage evolution/fitness scheduling
```

## Tool Reference

### cron_add

Adds a new cron job with a cron expression, command or prompt, and optional description.

```json
{
  "name": "cron_add",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 2 * * *",
    "action": "shell",
    "command": "tar czf /tmp/workspace-$(date +%Y%m%d).tar.gz /home/user/workspace",
    "description": "Daily workspace backup at 2 AM"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | Unique name for the cron job |
| `schedule` | `string` | Yes | -- | Cron expression (5-field: minute hour day month weekday) |
| `action` | `string` | Yes | -- | Action type: `"shell"` (run command) or `"agent"` (run agent prompt) |
| `command` | `string` | Conditional | -- | Shell command (required when `action = "shell"`) |
| `prompt` | `string` | Conditional | -- | Agent prompt (required when `action = "agent"`) |
| `description` | `string` | No | -- | Human-readable description |

### cron_list

Lists all registered cron jobs with their schedules, status, and next run time.

```json
{
  "name": "cron_list",
  "arguments": {}
}
```

No parameters required. Returns a table of all cron jobs.

### cron_remove

Removes a cron job by its name or ID.

```json
{
  "name": "cron_remove",
  "arguments": {
    "name": "backup-workspace"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | Name or ID of the cron job to remove |

### cron_update

Updates an existing cron job's schedule, command, or settings.

```json
{
  "name": "cron_update",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 4 * * *",
    "description": "Daily workspace backup at 4 AM (shifted)"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | Name of the cron job to update |
| `schedule` | `string` | No | -- | New cron expression |
| `command` | `string` | No | -- | New shell command |
| `prompt` | `string` | No | -- | New agent prompt |
| `description` | `string` | No | -- | New description |

### cron_run

Manually triggers a cron job immediately, outside its normal schedule.

```json
{
  "name": "cron_run",
  "arguments": {
    "name": "daily-report"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | Name of the cron job to trigger |

### cron_runs

Views execution history and logs of cron job runs. Shows past executions with timestamps, status, and output.

```json
{
  "name": "cron_runs",
  "arguments": {
    "name": "daily-report",
    "limit": 10
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | No | -- | Filter by job name. If omitted, shows all recent runs. |
| `limit` | `integer` | No | `20` | Maximum number of history entries to return |

### schedule

Schedules a one-shot or recurring task with natural language time expressions. This is a higher-level interface than raw cron expressions.

```json
{
  "name": "schedule",
  "arguments": {
    "when": "in 30 minutes",
    "action": "agent",
    "prompt": "Check if the deployment completed and report the status."
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `when` | `string` | Yes | -- | Natural language time expression (e.g., `"in 30 minutes"`, `"tomorrow at 9am"`, `"every Monday at 10:00"`) |
| `action` | `string` | Yes | -- | Action type: `"shell"` or `"agent"` |
| `command` | `string` | Conditional | -- | Shell command (for `"shell"` action) |
| `prompt` | `string` | Conditional | -- | Agent prompt (for `"agent"` action) |

### cron (Legacy)

Legacy cron entry point for backward compatibility. Routes to the appropriate cron tool based on the action argument.

```json
{
  "name": "cron",
  "arguments": {
    "action": "list"
  }
}
```

### xin

The Xin scheduling engine for advanced task automation with dependency chains and conditional execution.

```json
{
  "name": "xin",
  "arguments": {
    "action": "status"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | Action: `"status"`, `"tasks"`, `"run"`, `"pause"`, `"resume"` |

## Cron Expression Format

PRX uses standard 5-field cron expressions:

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
```

**Examples:**

| Expression | Description |
|-----------|-------------|
| `0 9 * * *` | Every day at 9:00 AM |
| `*/15 * * * *` | Every 15 minutes |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `0 0 1 * *` | First day of every month at midnight |
| `30 8,12,18 * * *` | At 8:30, 12:30, and 18:30 daily |

## Xin Engine

The Xin engine is an advanced task scheduler that goes beyond simple cron timing:

- **Dependency chains**: Tasks can depend on the successful completion of other tasks
- **Conditional execution**: Tasks run only when specified conditions are met
- **Built-in tasks**: System maintenance tasks (heartbeat, memory hygiene, log rotation) are auto-registered when `builtin_tasks = true`
- **Evolution integration**: When `evolution_integration = true`, Xin manages the self-evolution and fitness check schedule
- **Stale detection**: Tasks running longer than `stale_timeout_minutes` are marked as stale and can be cleaned up
- **Concurrent execution**: Multiple tasks can run in parallel, limited by `max_concurrent`

## Usage

### CLI Cron Management

```bash
# List all cron jobs
prx cron list

# Add a new cron job
prx cron add --name "check-updates" --schedule "0 */6 * * *" --action agent --prompt "Check for package updates"

# Manually trigger a job
prx cron run daily-report

# View run history
prx cron runs --name daily-report --limit 5

# Remove a job
prx cron remove check-updates
```

### Xin Status

```bash
# Check Xin engine status
prx xin status

# List all Xin tasks
prx xin tasks
```

## Security

### Shell Command Sandboxing

Cron jobs with `action = "shell"` execute through the same sandbox as the `shell` tool. The configured sandbox backend (Landlock, Firejail, Bubblewrap, Docker) applies to scheduled commands.

### Agent Prompt Safety

Cron jobs with `action = "agent"` spawn a new agent session with the configured prompt. The agent session inherits the daemon's security policies, tool restrictions, and resource limits.

### Policy Engine

Cron tools are governed by the security policy engine:

```toml
[security.tool_policy.groups]
automation = "allow"

[security.tool_policy.tools]
cron_add = "supervised"    # Require approval to add new jobs
cron_remove = "supervised" # Require approval to remove jobs
cron_run = "allow"         # Allow manual triggers
```

### Audit Logging

All cron operations are recorded in the audit log: job creation, modification, deletion, manual triggers, and execution results.

### Resource Limits

Scheduled tasks share the daemon's resource limits. The `max_concurrent` setting in the Xin engine prevents resource exhaustion from too many simultaneous tasks.

## Related

- [Cron System](/en/prx/cron/) -- architecture and built-in tasks
- [Cron Heartbeat](/en/prx/cron/heartbeat) -- health monitoring
- [Cron Tasks](/en/prx/cron/tasks) -- built-in maintenance tasks
- [Self-Evolution](/en/prx/self-evolution/) -- Xin evolution integration
- [Shell Execution](/en/prx/tools/shell) -- sandbox for shell-based cron jobs
- [Configuration Reference](/en/prx/config/reference) -- `[cron]` and `[xin]` settings
- [Tools Overview](/en/prx/tools/) -- all tools and registry system

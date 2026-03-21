---
title: prx cron
description: Manage scheduled cron tasks that run on the PRX daemon.
---

# prx cron

Manage scheduled tasks that execute on the PRX cron scheduler. Cron tasks can run LLM prompts, shell commands, or tool invocations on a defined schedule.

## Usage

```bash
prx cron <SUBCOMMAND> [OPTIONS]
```

## Subcommands

### `prx cron list`

List all configured cron tasks and their status.

```bash
prx cron list [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--json` | `-j` | `false` | Output as JSON |
| `--verbose` | `-v` | `false` | Show full task details including schedule expression |

**Example output:**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

Add a new cron task.

```bash
prx cron add [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--name` | `-n` | required | Task name |
| `--schedule` | `-s` | required | Cron expression (5 or 6 fields) |
| `--prompt` | `-p` | | LLM prompt to execute |
| `--command` | `-c` | | Shell command to execute |
| `--channel` | | | Channel to send output to |
| `--provider` | `-P` | config default | LLM provider for prompt tasks |
| `--model` | `-m` | provider default | Model for prompt tasks |
| `--enabled` | | `true` | Enable task immediately |

Either `--prompt` or `--command` must be provided.

```bash
# Schedule a daily summary
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# Schedule a backup command
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# Weekly report every Monday at 10am
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

Remove a cron task by ID or name.

```bash
prx cron remove <ID|NAME> [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--force` | `-f` | `false` | Skip confirmation prompt |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

Pause a cron task. The task remains configured but will not execute until resumed.

```bash
prx cron pause <ID|NAME>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

Resume a paused cron task.

```bash
prx cron resume <ID|NAME>
```

```bash
prx cron resume weekly-report
```

## Cron Expression Format

PRX uses standard 5-field cron expressions:

```
 ┌───────── minute (0-59)
 │ ┌───────── hour (0-23)
 │ │ ┌───────── day of month (1-31)
 │ │ │ ┌───────── month (1-12)
 │ │ │ │ ┌───────── day of week (0-7, 0 and 7 = Sunday)
 │ │ │ │ │
 * * * * *
```

Common examples:

| Expression | Description |
|------------|-------------|
| `0 9 * * *` | Every day at 9:00 AM |
| `*/15 * * * *` | Every 15 minutes |
| `0 */6 * * *` | Every 6 hours |
| `0 10 * * 1` | Every Monday at 10:00 AM |
| `0 0 1 * *` | First day of every month at midnight |

## Related

- [Scheduling Overview](/en/prx/cron/) -- cron architecture and heartbeat
- [Cron Tasks](/en/prx/cron/tasks) -- task types and execution details
- [prx daemon](./daemon) -- the daemon that runs the cron scheduler

---
title: prx channel
description: Manage messaging channel connections -- list, add, remove, start, and diagnose channels.
---

# prx channel

Manage the messaging channels that PRX connects to. Channels are the bridges between messaging platforms (Telegram, Discord, Slack, etc.) and the PRX agent runtime.

## Usage

```bash
prx channel <SUBCOMMAND> [OPTIONS]
```

## Subcommands

### `prx channel list`

List all configured channels and their current status.

```bash
prx channel list [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--json` | `-j` | `false` | Output as JSON |
| `--verbose` | `-v` | `false` | Show detailed connection info |

**Example output:**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

Add a new channel configuration interactively or from flags.

```bash
prx channel add [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--type` | `-t` | | Channel type (e.g., `telegram`, `discord`, `slack`) |
| `--name` | `-n` | auto-generated | Display name for the channel |
| `--token` | | | Bot token or API key |
| `--enabled` | | `true` | Enable the channel immediately |
| `--interactive` | `-i` | `true` | Use the interactive wizard |

```bash
# Interactive mode (guided prompts)
prx channel add

# Non-interactive with flags
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

Remove a channel configuration.

```bash
prx channel remove <NAME> [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--force` | `-f` | `false` | Skip confirmation prompt |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

Start (or restart) a specific channel without restarting the daemon.

```bash
prx channel start <NAME>
```

```bash
# Restart a channel that errored
prx channel start slack-team
```

This command sends a control message to the running daemon. The daemon must be running for this command to work.

### `prx channel doctor`

Run diagnostics on channel connections. Checks token validity, network connectivity, webhook URLs, and permissions.

```bash
prx channel doctor [NAME]
```

If `NAME` is omitted, all channels are checked.

```bash
# Check all channels
prx channel doctor

# Check a specific channel
prx channel doctor telegram-main
```

**Example output:**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## Examples

```bash
# Full workflow: add, verify, start
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# List channels as JSON for scripting
prx channel list --json | jq '.[] | select(.status == "error")'
```

## Related

- [Channels Overview](/en/prx/channels/) -- detailed channel documentation
- [prx daemon](./daemon) -- the daemon that runs channel connections
- [prx doctor](./doctor) -- full system diagnostics including channels

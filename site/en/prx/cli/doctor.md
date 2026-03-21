---
title: prx doctor
description: Run system diagnostics to verify daemon health, channel status, and model availability.
---

# prx doctor

Run comprehensive diagnostics on the PRX installation. Checks configuration validity, daemon connectivity, channel health, provider API access, and model availability.

## Usage

```bash
prx doctor [SUBCOMMAND] [OPTIONS]
```

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Config file path |
| `--json` | `-j` | `false` | Output as JSON |
| `--verbose` | `-v` | `false` | Show detailed check output |
| `--fix` | | `false` | Attempt to auto-fix common issues |

## Subcommands

### `prx doctor` (no subcommand)

Run all diagnostic checks.

```bash
prx doctor
```

**Example output:**

```
 PRX Doctor
 ══════════════════════════════════════════

 Configuration
   Config file exists ............... OK
   Config file valid ................ OK
   Data directory writable .......... OK

 Daemon
   Daemon running ................... OK (PID 12345)
   Gateway reachable ................ OK (127.0.0.1:3120)
   Uptime ........................... 3d 14h 22m

 Providers
   anthropic ....................... OK (claude-sonnet-4-20250514)
   ollama .......................... OK (llama3, 2 models)
   openai .......................... WARN (key not configured)

 Channels
   telegram-main ................... OK (connected)
   discord-dev ..................... OK (connected)
   slack-team ...................... FAIL (auth error)

 Memory
   Backend (sqlite) ................ OK
   Entries ......................... 1,247

 Evolution
   Engine .......................... OK (running)
   Last L1 cycle ................... 2h ago

 Summary: 10 passed, 1 warning, 1 failure
```

### `prx doctor models`

Check model availability across all configured providers.

```bash
prx doctor models [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--provider` | `-P` | all | Check a specific provider only |

```bash
# Check all provider models
prx doctor models

# Check only Ollama models
prx doctor models --provider ollama
```

**Example output:**

```
 Provider     Model                        Status    Latency
 anthropic    claude-sonnet-4-20250514              OK        245ms
 anthropic    claude-haiku-4-20250514               OK        189ms
 ollama       llama3                       OK        12ms
 ollama       codellama                    OK        15ms
 openai       gpt-4o                       SKIP (no key)
```

## Diagnostic Checks

The doctor runs the following checks:

| Category | Check | Description |
|----------|-------|-------------|
| Config | File exists | Config file is present at the expected path |
| Config | Valid syntax | TOML parses without errors |
| Config | Schema valid | All values match expected types and ranges |
| Daemon | Process running | Daemon PID is alive |
| Daemon | Gateway reachable | HTTP health endpoint responds |
| Providers | API key set | Required API keys are configured |
| Providers | API reachable | Provider API responds to a test request |
| Channels | Token valid | Channel bot tokens are accepted |
| Channels | Connected | Channel is actively connected |
| Memory | Backend available | Memory store is accessible |
| Evolution | Engine running | Evolution engine is active |

## Auto-Fix

The `--fix` flag attempts to resolve common issues automatically:

- Creates missing data directories
- Refreshes expired OAuth tokens
- Restarts disconnected channels
- Removes invalid cache entries

```bash
prx doctor --fix
```

## Related

- [prx daemon](./daemon) -- start the daemon if it is not running
- [prx channel doctor](./channel) -- detailed channel diagnostics
- [Troubleshooting](/en/prx/troubleshooting/) -- common errors and solutions
- [Diagnostics Guide](/en/prx/troubleshooting/diagnostics) -- in-depth diagnostics

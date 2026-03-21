---
title: CLI
description: Use PRX interactively from the terminal via stdin/stdout
---

# CLI

> Use PRX directly from the terminal with stdin/stdout for interactive conversations without any external service dependencies.

## Prerequisites

- PRX installed and configured with at least one LLM provider
- A terminal with stdin/stdout support

## Quick Setup

### 1. Configure

The CLI channel is enabled by default. No additional configuration is needed.

```toml
[channels_config]
cli = true  # default, can be omitted
```

### 2. Start

```bash
prx
```

PRX will start in interactive mode, reading from stdin and writing responses to stdout.

### 3. Usage

Type your message and press Enter. Special commands:

```
> Hello, how are you?
[PRX responds...]

> /quit    # Exit the session
> /exit    # Exit the session (alternative)
```

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cli` | `bool` | `true` | Enable or disable the CLI interactive channel |

## Features

- **Zero dependencies** -- no external accounts, tokens, or APIs needed beyond the LLM provider
- **Always available** -- enabled by default; works out of the box after installation
- **stdin/stdout interface** -- standard Unix I/O for easy scripting and piping
- **Empty line filtering** -- blank lines are silently ignored
- **Graceful exit** -- type `/quit` or `/exit` to end the session cleanly
- **Full tool access** -- all configured tools (shell, file, browser, memory, etc.) are available

## Limitations

- Single-user, single-session only
- No persistent conversation history across sessions (unless session persistence is enabled globally)
- No media or file attachment support (text-only input)
- No streaming/progressive output (responses are printed in full after generation)
- Cannot run concurrently with other channels in the same process unless explicitly configured

## Troubleshooting

### PRX does not start in CLI mode
- Ensure `cli = true` (or omit it, as it defaults to `true`) in `[channels_config]`
- If other channels are configured, PRX may prioritize them; check the startup logs
- Verify that at least one LLM provider is configured

### Input is not processed
- Ensure you are typing in the terminal where PRX is running (not a backgrounded process)
- Empty lines are ignored; type a non-empty message
- Check that stdin is connected (not redirected from `/dev/null`)

### How to use CLI with pipes
- PRX reads from stdin line by line, so you can pipe input:
  ```bash
  echo "What is 2 + 2?" | prx
  ```
- For multi-turn conversations via scripts, use a FIFO or `expect`-based approach

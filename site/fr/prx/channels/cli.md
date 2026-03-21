---
title: CLI
description: Use PRX interactively from le terminal via stdin/stdout
---

# CLI

> Use PRX directly depuis le terminal with stdin/stdout for interactive conversations without any external service dependencies.

## Prerequis

- PRX installed and configured avec unu moins one LLM fournisseur
- A terminal with stdin/stdout support

## Quick Setup

### 1. Configure

Le CLI channel est active par defaut. Non additional configuration is needed.

```toml
[channels_config]
cli = true  # default, can be omitted
```

### 2. Start

```bash
prx
```

PRX will start in interactive mode, reading from stdin et writing responses to stdout.

### 3. Usage

Type your message and press Enter. Special commands:

```
> Hello, how are you?
[PRX responds...]

> /quit    # Exit the session
> /exit    # Exit the session (alternative)
```

## Configuration Reference

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `cli` | `bool` | `true` | Enable or disable le CLI interactive channel |

## Fonctionnalites

- **Zero dependencies** -- no external accounts, tokens, or APIs needed beyond le LLM fournisseur
- **Always available** -- enabled par defaut; works sur the box after installation
- **stdin/stdout interface** -- standard Unix I/O for easy scripting and piping
- **Empty line filtering** -- blank lines are silently ignored
- **Graceful exit** -- type `/quit` or `/exit` to end the session cleanly
- **Full tool access** -- tous les configures tools (shell, file, browser, memory, etc.) sont disponibles

## Limiteations

- Single-user, single-session only
- Non persistent conversation history across sessions (unless session persistence est active globally)
- Non media or file attachment support (text-only input)
- Non streaming/progressive output (responses are printed in full after generation)
- Cannot run concurrently with other channels in the same process unless explicitement configure

## Depannage

### PRX ne fait pas start in CLI mode
- Ensure `cli = true` (or omit it, as it par defaut `true`) in `[channels_config]`
- If other channels sont configures, PRX may prioritize them; check the startup logs
- Verifiez que au moins one LLM fournisseur is configured

### Input is not processed
- Ensure you are typing in the terminal where PRX is running (not a backgrounded process)
- Empty lines are ignored; type a non-empty message
- Verifiez que stdin is connected (not redirected from `/dev/null`)

### How to use CLI with pipes
- PRX reads from stdin line by line, so you can pipe input:
  ```bash
  echo "What is 2 + 2?" | prx
  ```
- For multi-tour conversations via scripts, use a FIFO or `expect`-based approach

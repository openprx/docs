---
title: prx chat
description: Rich terminal chat with streaming responses, history navigation, and multi-line input.
---

# prx chat

Start an interactive chat session in the terminal with streaming responses, conversation history, and full tool access.

## Usage

```bash
prx chat [OPTIONS]
```

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--provider` | `-P` | config default | LLM provider to use (e.g., `anthropic`, `openai`, `ollama`) |
| `--model` | `-m` | provider default | Model identifier (e.g., `claude-sonnet-4-20250514`, `gpt-4o`) |
| `--system` | `-s` | | Custom system prompt (overrides config) |
| `--session` | `-S` | new session | Resume a named session |
| `--no-tools` | | `false` | Disable tool usage for this session |
| `--no-memory` | | `false` | Disable memory reads and writes |
| `--no-stream` | | `false` | Wait for full response instead of streaming |
| `--max-turns` | | unlimited | Maximum conversation turns before auto-exit |
| `--temperature` | `-t` | provider default | Sampling temperature (0.0 - 2.0) |

## Interactive Controls

Once inside the chat session, the following keyboard shortcuts are available:

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Shift+Enter` or `\` then `Enter` | New line (multi-line input) |
| `Up` / `Down` | Navigate message history |
| `Ctrl+C` | Cancel current generation |
| `Ctrl+D` | Exit chat session |
| `Ctrl+L` | Clear screen |

## Slash Commands

Type these commands directly in the chat input:

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/model <name>` | Switch model mid-session |
| `/provider <name>` | Switch provider mid-session |
| `/system <prompt>` | Update system prompt |
| `/clear` | Clear conversation history |
| `/save [name]` | Save current session |
| `/load <name>` | Load a saved session |
| `/sessions` | List saved sessions |
| `/tools` | List available tools |
| `/exit` | Exit the chat |

## Examples

```bash
# Start with defaults
prx chat

# Use a specific model
prx chat --provider anthropic --model claude-sonnet-4-20250514

# Resume a previous session
prx chat --session project-planning

# Quick question with local model
prx chat --provider ollama --model llama3

# Limit to 10 turns (useful for scripted workflows)
prx chat --max-turns 10
```

## Session Management

Chat sessions are automatically saved when you exit. Each session records:

- Conversation messages (user + assistant)
- Tool calls and results
- Provider and model used
- Timestamp and duration

Sessions are stored in the PRX data directory (`~/.local/share/prx/sessions/` by default).

```bash
# List all sessions
prx chat --session ""  # empty name lists sessions

# Resume by name
prx chat --session my-project
```

## Multi-line Input

For longer prompts, use multi-line mode. Press `Shift+Enter` to insert a newline without sending. The prompt indicator changes from `>` to `...` to show you are in multi-line mode.

Alternatively, pipe input from a file:

```bash
# The chat still opens interactively, with the file content as the first message
prx chat < prompt.txt
```

## Provider and Model Override

The `--provider` and `--model` flags override the defaults from your config file for the duration of the session. You can also switch mid-session using slash commands.

```bash
# Start with OpenAI, switch to Anthropic mid-conversation
prx chat --provider openai
# In chat: /provider anthropic
# In chat: /model claude-sonnet-4-20250514
```

## Related

- [prx agent](./agent) -- non-interactive single-turn mode
- [Providers Overview](/en/prx/providers/) -- supported LLM providers
- [Memory Overview](/en/prx/memory/) -- how memory works in conversations
- [Tools Overview](/en/prx/tools/) -- available tools during chat

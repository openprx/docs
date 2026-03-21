---
title: prx agent
description: Single-turn LLM interaction for scripting and piping.
---

# prx agent

Execute a single-turn LLM interaction. The agent processes one prompt, returns the response, and exits. Designed for scripting, piping, and integration with other tools.

## Usage

```bash
prx agent [OPTIONS] [PROMPT]
```

If `PROMPT` is omitted, input is read from stdin.

## Options

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--provider` | `-P` | config default | LLM provider to use |
| `--model` | `-m` | provider default | Model identifier |
| `--system` | `-s` | | Custom system prompt |
| `--file` | `-f` | | Attach a file to the prompt context |
| `--no-tools` | | `false` | Disable tool usage |
| `--no-memory` | | `false` | Disable memory reads and writes |
| `--json` | `-j` | `false` | Output raw JSON response |
| `--temperature` | `-t` | provider default | Sampling temperature (0.0 - 2.0) |
| `--max-tokens` | | provider default | Maximum response tokens |
| `--timeout` | | `120` | Timeout in seconds |

## Examples

```bash
# Simple question
prx agent "What is the capital of France?"

# Pipe content for analysis
cat error.log | prx agent "Summarize these errors"

# Attach a file
prx agent -f report.pdf "Summarize the key findings"

# Use a specific model
prx agent -P anthropic -m claude-sonnet-4-20250514 "Explain quantum entanglement"

# JSON output for scripting
prx agent --json "List 5 programming languages" | jq '.content'

# Chain with other commands
git diff HEAD~1 | prx agent "Write a commit message for this diff"
```

## Stdin vs Argument

The prompt can be provided as a positional argument or via stdin. When both are present, they are concatenated (stdin content first, then the argument as instructions).

```bash
# Argument only
prx agent "Hello"

# Stdin only
echo "Hello" | prx agent

# Both: stdin as context, argument as instruction
cat data.csv | prx agent "Find anomalies in this dataset"
```

## File Attachments

The `--file` flag adds file content to the prompt context. Multiple files can be attached:

```bash
prx agent -f src/main.rs -f src/lib.rs "Review this code for bugs"
```

Supported file types include text files, PDFs, images (for vision-capable models), and common document formats.

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | General error (invalid config, network failure) |
| `2` | Timeout exceeded |
| `3` | Provider error (rate limit, auth failure) |

## Related

- [prx chat](./chat) -- interactive multi-turn chat
- [Providers Overview](/en/prx/providers/) -- supported LLM providers
- [Tools Overview](/en/prx/tools/) -- available tools during agent execution

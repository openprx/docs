---
title: Anthropic
description: Configure Anthropic Claude as your LLM provider in PRX
---

# Anthropic

> Access Claude models (Opus, Sonnet, Haiku) via the Anthropic Messages API with native tool use, vision, prompt caching, and OAuth token auto-refresh.

## Prerequisites

- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com/), **or**
- A Claude Code OAuth token (auto-detected from `~/.claude/.credentials.json`)

## Quick Setup

### 1. Get API Key

1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Navigate to **API Keys** in the dashboard
3. Click **Create Key** and copy the key (starts with `sk-ant-`)

### 2. Configure

```toml
[default]
provider = "anthropic"
model = "claude-sonnet-4-20250514"

[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

Or set the environment variable:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Verify

```bash
prx doctor models
```

## Available Models

| Model | Context | Vision | Tool Use | Notes |
|-------|---------|--------|----------|-------|
| `claude-opus-4-20250514` | 200K | Yes | Yes | Most capable, best for complex reasoning |
| `claude-sonnet-4-20250514` | 200K | Yes | Yes | Best balance of speed and capability |
| `claude-haiku-3-5-20241022` | 200K | Yes | Yes | Fastest, most cost-effective |
| `claude-sonnet-4-6` | 200K | Yes | Yes | Latest Sonnet release |
| `claude-opus-4-6` | 200K | Yes | Yes | Latest Opus release |

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_key` | string | required | Anthropic API key (`sk-ant-...`) or OAuth token |
| `api_url` | string | `https://api.anthropic.com` | Custom API base URL (for proxies) |
| `model` | string | `claude-sonnet-4-20250514` | Default model to use |

## Features

### Native Tool Calling

PRX sends tool definitions in Anthropic's native format with `input_schema`, avoiding lossy OpenAI-to-Anthropic format conversion. Tool results are properly wrapped as `tool_result` content blocks.

### Vision (Image Analysis)

Images embedded in messages as `[IMAGE:data:image/png;base64,...]` markers are automatically converted to Anthropic's native `image` content blocks with proper `media_type` and `source_type` fields. Images up to 20 MB are supported (a warning is logged for payloads exceeding this size).

### Prompt Caching

PRX automatically applies Anthropic's ephemeral prompt caching to reduce costs and latency:

- **System prompts** larger than ~1024 tokens (3 KB) receive a `cache_control` block
- **Conversations** with more than 4 non-system messages have the last message cached
- **Tool definitions** have the last tool marked with `cache_control: ephemeral`

No configuration is required; caching is applied transparently.

### OAuth Token Auto-Refresh

When using Claude Code credentials, PRX automatically:

1. Detects cached OAuth tokens from `~/.claude/.credentials.json`
2. Proactively refreshes tokens 90 seconds before expiry
3. Retries on 401 responses with a fresh token
4. Persists refreshed credentials back to disk

This means `prx` can piggyback on an existing Claude Code login with zero additional configuration.

### Claude Code Integration

PRX recognizes the following as Anthropic authentication sources:

| Source | Detection |
|--------|-----------|
| Direct API key | `sk-ant-api-...` prefix, sent via `x-api-key` header |
| OAuth setup token | `sk-ant-oat01-...` prefix, sent via `Authorization: Bearer` with `anthropic-beta` header |
| Claude Code cached credential | `~/.claude/.credentials.json` with `access_token` + `refresh_token` |
| Environment variable | `ANTHROPIC_API_KEY` |

### Custom Base URL

To route through a proxy or alternative endpoint:

```toml
[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
api_url = "https://my-proxy.example.com"
```

## Provider Aliases

The following names all resolve to the Anthropic provider:

- `anthropic`
- `claude-code`
- `claude-cli`

## Troubleshooting

### "Anthropic credentials not set"

PRX could not find any authentication. Ensure one of these is configured:

1. `ANTHROPIC_API_KEY` environment variable
2. `api_key` in `config.toml` under `[providers.anthropic]`
3. A valid `~/.claude/.credentials.json` from Claude Code

### 401 Unauthorized

- **API key**: Verify it starts with `sk-ant-api-` and is not expired
- **OAuth token**: Run `prx auth login --provider anthropic` to re-authenticate, or restart Claude Code to refresh the token
- **Proxy issue**: If using a custom `api_url`, confirm the proxy forwards the `x-api-key` or `Authorization` header correctly

### Image payload too large

Anthropic recommends images under 20 MB in base64-encoded form. Resize or compress large images before sending.

### Prompt caching not working

Caching is automatic but requires:
- System prompt > 3 KB to trigger system-level caching
- More than 4 non-system messages to trigger conversation caching
- API version `2023-06-01` (set automatically by PRX)

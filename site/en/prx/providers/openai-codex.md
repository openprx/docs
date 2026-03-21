---
title: OpenAI Codex
description: Configure OpenAI Codex (GitHub Copilot OAuth2 flow) as your LLM provider in PRX
---

# OpenAI Codex

> Access OpenAI's Codex models via the ChatGPT Responses API using GitHub Copilot's OAuth2 authentication flow. Provides access to GPT-5.x Codex models with reasoning capabilities and native tool calling.

## Prerequisites

- A ChatGPT Plus, Team, or Enterprise subscription
- An existing Codex CLI or GitHub Copilot OAuth2 token, **or** willingness to run the `prx auth login` flow

## Quick Setup

### 1. Authenticate

```bash
prx auth login --provider openai-codex
```

This initiates the GitHub OAuth device flow and stores tokens in `~/.openprx/`.

### 2. Configure

```toml
[default]
provider = "openai-codex"
model = "gpt-5.3-codex"
```

### 3. Verify

```bash
prx doctor models
```

## Available Models

| Model | Context | Vision | Tool Use | Notes |
|-------|---------|--------|----------|-------|
| `gpt-5.3-codex` | 128K | Yes | Yes | Latest Codex model, highest capability |
| `gpt-5.2-codex` | 128K | Yes | Yes | Previous generation Codex |
| `gpt-5.1-codex` | 128K | Yes | Yes | Stable Codex release |
| `gpt-5.1-codex-mini` | 128K | Yes | Yes | Smaller, faster Codex variant |
| `gpt-5-codex` | 128K | Yes | Yes | First generation Codex 5 |
| `o3` | 128K | Yes | Yes | OpenAI reasoning model |
| `o4-mini` | 128K | Yes | Yes | Smaller reasoning model |

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `model` | string | `gpt-5.3-codex` | Default Codex model to use |

No API key is needed in the config. Authentication is handled through the OAuth flow stored in `~/.openprx/`.

## Features

### Responses API

Unlike the standard OpenAI provider which uses the Chat Completions API, the Codex provider uses the newer Responses API (`/codex/responses`) with:

- SSE streaming with real-time delta text events
- Structured `function_call` output items for tool use
- Reasoning effort control (`minimal` / `low` / `medium` / `high` / `xhigh`)
- Reasoning summaries in response metadata

### Automatic Reasoning Effort

PRX automatically adjusts reasoning effort based on the model:

| Model | `minimal` | `xhigh` |
|-------|-----------|---------|
| `gpt-5.2-codex` / `gpt-5.3-codex` | Clamped to `low` | Allowed |
| `gpt-5.1` | Allowed | Clamped to `high` |
| `gpt-5.1-codex-mini` | Clamped to `medium` | Clamped to `high` |

Override with the `ZEROCLAW_CODEX_REASONING_EFFORT` environment variable.

### Native Tool Calling

Tool definitions are sent in the Responses API format with `type: "function"`, `name`, `description`, and `parameters`. Tool names containing dots (e.g., `email.execute`) are automatically sanitized to underscores (`email_execute`) with a reverse mapping to restore original names in results.

### OAuth2 Token Management

PRX manages the full OAuth2 lifecycle:

1. **Login**: `prx auth login --provider openai-codex` initiates the device code flow
2. **Token storage**: Tokens are stored encrypted in `~/.openprx/`
3. **Auto-refresh**: Expired access tokens are automatically refreshed using the stored refresh token
4. **Codex CLI import**: If you have an existing Codex CLI installation, PRX can import its tokens automatically

### Stream Handling

The provider handles SSE streams with:
- Idle timeout (45 seconds by default, configurable via `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS`)
- Maximum response size (4 MB)
- Graceful handling of `[DONE]` markers and terminal response events
- Automatic content-type detection (SSE vs JSON)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ZEROCLAW_CODEX_REASONING_EFFORT` | Override reasoning effort (`minimal` / `low` / `medium` / `high` / `xhigh`) |
| `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS` | Stream idle timeout in seconds (default: 45, minimum: 5) |

## Troubleshooting

### "OpenAI Codex auth profile not found"

Run `prx auth login --provider openai-codex` to authenticate. This requires a ChatGPT subscription.

### "OpenAI Codex account id not found"

The JWT token does not contain an account ID. Re-authenticate with `prx auth login --provider openai-codex`.

### Stream timeout errors

If you see `provider_response_timeout kind=stream_idle_timeout`, the model is taking too long to respond. Options:
- Increase the timeout: `export ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS=120`
- Use a faster model like `gpt-5.1-codex-mini`

### "payload_too_large" error

The response exceeded 4 MB. This usually indicates an unusually large model response. Try breaking your request into smaller parts.

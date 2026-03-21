---
title: OpenAI
description: Configure OpenAI as your LLM provider in PRX
---

# OpenAI

> Access GPT models via the OpenAI Chat Completions API with native function calling, vision, and reasoning model support.

## Prerequisites

- An OpenAI API key from [platform.openai.com](https://platform.openai.com/)

## Quick Setup

### 1. Get API Key

1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Navigate to **API Keys** in the left sidebar
3. Click **Create new secret key** and copy it (starts with `sk-`)

### 2. Configure

```toml
[default]
provider = "openai"
model = "gpt-4o"

[providers.openai]
api_key = "${OPENAI_API_KEY}"
```

Or set the environment variable:

```bash
export OPENAI_API_KEY="sk-..."
```

### 3. Verify

```bash
prx doctor models
```

## Available Models

| Model | Context | Vision | Tool Use | Notes |
|-------|---------|--------|----------|-------|
| `gpt-4o` | 128K | Yes | Yes | Best general-purpose model |
| `gpt-4o-mini` | 128K | Yes | Yes | Smaller, faster, cheaper |
| `gpt-4-turbo` | 128K | Yes | Yes | Previous generation flagship |
| `o3` | 128K | Yes | Yes | Reasoning model |
| `o4-mini` | 128K | Yes | Yes | Smaller reasoning model |
| `gpt-4` | 8K | No | Yes | Original GPT-4 |

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_key` | string | required | OpenAI API key (`sk-...`) |
| `api_url` | string | `https://api.openai.com/v1` | Custom API base URL |
| `model` | string | `gpt-4o` | Default model to use |

## Features

### Native Function Calling

PRX sends tools in OpenAI's native `function` format. Tool definitions include `name`, `description`, and `parameters` (JSON Schema). The provider supports `tool_choice: "auto"` for automatic tool selection.

### Vision

Vision-capable models (GPT-4o, GPT-4o-mini) can analyze images included in the conversation. Images are sent inline through the standard message format.

### Reasoning Model Support

For reasoning models (o1, o3, o4-mini), PRX automatically handles the `reasoning_content` fallback. When the model returns output in `reasoning_content` instead of `content`, PRX extracts the reasoning text transparently.

### Multi-turn Conversations

Full conversation history is preserved and sent to the API, including system prompts, user messages, assistant responses, and tool call/result pairs in OpenAI's native structured format.

### Custom Base URL

To use a proxy, Azure OpenAI, or any OpenAI-compatible endpoint:

```toml
[providers.openai]
api_key = "${OPENAI_API_KEY}"
api_url = "https://my-proxy.example.com/v1"
```

### Connection Warmup

On startup, PRX sends a lightweight `GET /models` request to establish TLS and HTTP/2 connection pooling, reducing latency on the first real request.

## Troubleshooting

### "OpenAI API key not set"

Set the `OPENAI_API_KEY` environment variable or add `api_key` to `[providers.openai]` in your `config.toml`.

### 429 Rate Limit

OpenAI enforces per-minute token and request limits. Solutions:
- Wait and retry (PRX handles this automatically with the reliable provider wrapper)
- Upgrade your OpenAI plan for higher rate limits
- Use `fallback_providers` to fall back to another provider during rate limiting

### Empty response from reasoning models

If using o1/o3/o4-mini and getting empty responses, this is expected behavior when the model's output is entirely in `reasoning_content`. PRX automatically falls back to `reasoning_content` when `content` is empty.

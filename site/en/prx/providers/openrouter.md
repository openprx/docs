---
title: OpenRouter
description: Configure OpenRouter as your LLM provider in PRX
---

# OpenRouter

> Access 200+ models from multiple providers (OpenAI, Anthropic, Google, Meta, Mistral, and more) through a single API key and unified interface.

## Prerequisites

- An OpenRouter API key from [openrouter.ai](https://openrouter.ai/)

## Quick Setup

### 1. Get API Key

1. Sign up at [openrouter.ai](https://openrouter.ai/)
2. Go to **Keys** in your dashboard
3. Click **Create Key** and copy it (starts with `sk-or-`)

### 2. Configure

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[providers.openrouter]
api_key = "${OPENROUTER_API_KEY}"
```

Or set the environment variable:

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. Verify

```bash
prx doctor models
```

## Available Models

OpenRouter provides access to hundreds of models. Some popular options:

| Model | Provider | Context | Vision | Tool Use | Notes |
|-------|----------|---------|--------|----------|-------|
| `anthropic/claude-sonnet-4` | Anthropic | 200K | Yes | Yes | Claude Sonnet 4 |
| `anthropic/claude-opus-4` | Anthropic | 200K | Yes | Yes | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | Yes | Yes | GPT-4o |
| `openai/o3` | OpenAI | 128K | Yes | Yes | Reasoning model |
| `google/gemini-2.5-pro` | Google | 1M | Yes | Yes | Gemini Pro |
| `google/gemini-2.5-flash` | Google | 1M | Yes | Yes | Gemini Flash |
| `meta-llama/llama-3.1-405b-instruct` | Meta | 128K | No | Yes | Largest open model |
| `deepseek/deepseek-chat` | DeepSeek | 128K | No | Yes | DeepSeek V3 |
| `mistralai/mistral-large` | Mistral | 128K | No | Yes | Mistral Large |
| `x-ai/grok-2` | xAI | 128K | No | Yes | Grok 2 |

Browse the full model list at [openrouter.ai/models](https://openrouter.ai/models).

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_key` | string | required | OpenRouter API key (`sk-or-...`) |
| `model` | string | required | Model ID in `provider/model` format |

## Features

### Unified Multi-Provider Access

With a single OpenRouter API key, you can access models from OpenAI, Anthropic, Google, Meta, Mistral, Cohere, and many more. This eliminates the need to manage multiple API keys.

### OpenAI-Compatible API

OpenRouter exposes an OpenAI-compatible Chat Completions API at `https://openrouter.ai/api/v1/chat/completions`. PRX sends requests with:

- `Authorization: Bearer <key>` for authentication
- `HTTP-Referer: https://github.com/theonlyhennygod/openprx` for app identification
- `X-Title: OpenPRX` for app name attribution

### Native Tool Calling

Tools are sent in OpenAI's native function-calling format. The provider supports `tool_choice: "auto"` and properly handles structured tool call responses including `tool_call_id` mapping for multi-turn tool interactions.

### Multi-Turn Conversation History

Full conversation history is preserved with proper structured formatting:
- Assistant messages with tool calls are serialized with `tool_calls` arrays
- Tool result messages include `tool_call_id` references
- System, user, and assistant messages are passed through directly

### Connection Warmup

On startup, PRX sends a lightweight request to `https://openrouter.ai/api/v1/auth/key` to verify the API key and establish TLS/HTTP2 connection pooling.

### Model Routing

OpenRouter supports model routing and fallback at the API level. You can also use PRX's built-in `fallback_providers` for client-side fallback:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[reliability]
fallback_providers = ["openai"]
```

## Default Provider

OpenRouter is PRX's default provider. If no `provider` is specified in your configuration, PRX defaults to OpenRouter.

## Troubleshooting

### "OpenRouter API key not set"

Set the `OPENROUTER_API_KEY` environment variable or add `api_key` under `[providers.openrouter]` in your `config.toml`. You can also run `prx onboard` for interactive setup.

### 402 Payment Required

Your OpenRouter account has insufficient credits. Add credits at [openrouter.ai/credits](https://openrouter.ai/credits).

### Model-specific errors

Different models on OpenRouter have different capabilities and rate limits. If a specific model returns errors:
- Check if the model supports tool calling (not all do)
- Verify the model is not deprecated on OpenRouter
- Try a different model variant

### Slow responses

OpenRouter routes to the underlying provider. Response time depends on:
- The model provider's current load
- Your geographic distance from the provider
- The model size and context length

Consider using `fallback_providers` to fail over to a direct provider connection if OpenRouter is slow.

### Rate limiting

OpenRouter has its own rate limits in addition to underlying provider limits. If rate-limited:
- Check your usage at [openrouter.ai/usage](https://openrouter.ai/usage)
- Upgrade your plan for higher limits
- Use PRX's reliable provider wrapper for automatic retry with backoff

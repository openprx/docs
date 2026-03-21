---
title: LLM Providers
description: Overview of the 9+ LLM providers supported by PRX, including capability matrix, configuration, fallback chains, and routing.
---

# LLM Providers

PRX connects to large language models through **providers** -- pluggable backends that implement the `Provider` trait. Each provider handles authentication, request formatting, streaming, and error classification for a specific LLM API.

PRX ships with 9 built-in providers, an OpenAI-compatible endpoint for third-party services, and infrastructure for fallback chains and intelligent routing.

## Capability Matrix

| Provider | Key Models | Streaming | Vision | Tool Use | OAuth | Self-hosted |
|----------|-----------|-----------|--------|----------|-------|-------------|
| [Anthropic](/en/prx/providers/anthropic) | Claude Opus 4, Claude Sonnet 4 | Yes | Yes | Yes | Yes (Claude Code) | No |
| [OpenAI](/en/prx/providers/openai) | GPT-4o, o1, o3 | Yes | Yes | Yes | No | No |
| [Google Gemini](/en/prx/providers/google-gemini) | Gemini 2.0 Flash, Gemini 1.5 Pro | Yes | Yes | Yes | Yes (Gemini CLI) | No |
| [OpenAI Codex](/en/prx/providers/openai-codex) | Codex models | Yes | No | Yes | Yes | No |
| [GitHub Copilot](/en/prx/providers/github-copilot) | Copilot Chat models | Yes | No | Yes | Yes (Device Flow) | No |
| [Ollama](/en/prx/providers/ollama) | Llama 3, Mistral, Qwen, any GGUF | Yes | Depends on model | Yes | No | Yes |
| [AWS Bedrock](/en/prx/providers/aws-bedrock) | Claude, Titan, Llama | Yes | Depends on model | Depends on model | AWS IAM | No |
| [GLM](/en/prx/providers/glm) | GLM-4, Zhipu, Minimax, Moonshot, Qwen, Z.AI | Yes | Depends on model | Depends on model | Yes (Minimax/Qwen) | No |
| [OpenRouter](/en/prx/providers/openrouter) | 200+ models from multiple vendors | Yes | Depends on model | Depends on model | No | No |
| [Custom Compatible](/en/prx/providers/custom-compatible) | Any OpenAI-compatible API | Yes | Depends on endpoint | Depends on endpoint | No | Yes |

## Quick Configuration

Providers are configured in `~/.config/openprx/config.toml` (or `~/.openprx/config.toml`). At minimum, set the default provider and supply an API key:

```toml
# Select the default provider and model
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (can also be set via ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."
```

For self-hosted providers like Ollama, specify the endpoint:

```toml
default_provider = "ollama"
default_model = "llama3:70b"
api_url = "http://localhost:11434"
```

Each provider resolves its API key from (in order):

1. The `api_key` field in `config.toml`
2. Provider-specific environment variable (e.g., `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
3. The generic `API_KEY` environment variable

See [Environment Variables](/en/prx/config/environment) for the full list of supported variables.

## Fallback Chains with ReliableProvider

PRX wraps provider calls in a `ReliableProvider` layer that provides:

- **Automatic retry** with exponential backoff for transient failures (5xx, 429 rate limits, network timeouts)
- **Fallback chains** -- when the primary provider fails, requests are automatically routed to the next provider in the chain
- **Non-retryable error detection** -- client errors like invalid API keys (401/403) and unknown models (404) fail fast without wasting retries

Configure reliability in the `[reliability]` section:

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

When the primary provider (e.g., Anthropic) returns a transient error, PRX retries up to `max_retries` times with backoff. If all retries are exhausted, it falls through to the first fallback provider. The fallback chain continues until a successful response or all providers are exhausted.

### Error Classification

The ReliableProvider classifies errors into two categories:

- **Retryable**: HTTP 5xx, 429 (rate limit), 408 (timeout), network errors
- **Non-retryable**: HTTP 4xx (except 429/408), invalid API keys, unknown models, malformed responses

Non-retryable errors skip retries and immediately fall through to the next provider, avoiding wasted latency.

## Router Integration

For advanced multi-model setups, PRX supports a heuristic LLM router that selects the optimal provider and model per request based on:

- **Capability scoring** -- matches query complexity to model strengths
- **Elo rating** -- tracks model performance over time
- **Cost optimization** -- prefers cheaper models for simple queries
- **Latency weighting** -- factors in response time
- **KNN semantic routing** -- uses historical query embeddings for similarity-based routing
- **Automix escalation** -- starts with a cheap model and escalates to a premium model when confidence is low

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

See [Router Configuration](/en/prx/router/) for full details.

## Provider Pages

- [Anthropic (Claude)](/en/prx/providers/anthropic)
- [OpenAI](/en/prx/providers/openai)
- [Google Gemini](/en/prx/providers/google-gemini)
- [OpenAI Codex](/en/prx/providers/openai-codex)
- [GitHub Copilot](/en/prx/providers/github-copilot)
- [Ollama](/en/prx/providers/ollama)
- [AWS Bedrock](/en/prx/providers/aws-bedrock)
- [GLM (Zhipu / Minimax / Moonshot / Qwen / Z.AI)](/en/prx/providers/glm)
- [OpenRouter](/en/prx/providers/openrouter)
- [Custom Compatible Endpoint](/en/prx/providers/custom-compatible)

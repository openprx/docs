---
title: GLM (Zhipu AI)
description: Configure GLM and related Chinese AI providers (Minimax, Moonshot, Qwen, Z.AI) in PRX
---

# GLM (Zhipu AI)

> Access Zhipu GLM models and a family of Chinese AI providers through a unified configuration. Includes aliases for Minimax, Moonshot (Kimi), Qwen (DashScope), and Z.AI.

## Prerequisites

- A Zhipu AI API key from [open.bigmodel.cn](https://open.bigmodel.cn/) (for GLM models), **or**
- API keys for the specific provider you want to use (Minimax, Moonshot, Qwen, etc.)

## Quick Setup

### 1. Get API Key

1. Sign up at [open.bigmodel.cn](https://open.bigmodel.cn/)
2. Navigate to the API Keys section
3. Create a new key (format: `id.secret`)

### 2. Configure

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

Or set the environment variable:

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. Verify

```bash
prx doctor models
```

## Available Models

### GLM Models

| Model | Context | Vision | Tool Use | Notes |
|-------|---------|--------|----------|-------|
| `glm-4-plus` | 128K | Yes | Yes | Most capable GLM model |
| `glm-4` | 128K | Yes | Yes | Standard GLM-4 |
| `glm-4-flash` | 128K | Yes | Yes | Fast and cost-effective |
| `glm-4v` | 128K | Yes | Yes | Vision-optimized |

### Aliased Providers

PRX also supports these providers as aliases that route through the OpenAI-compatible interface:

| Provider | Alias Names | Base URL | Key Models |
|----------|-------------|----------|------------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1` (intl), `api.minimaxi.com/v1` (CN) | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1` (intl), `api.moonshot.cn/v1` (CN) | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com` (CN), `dashscope-intl.aliyuncs.com` (intl) | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4` (global), `open.bigmodel.cn/api/coding/paas/v4` (CN) | Z.AI coding models |

## Configuration Reference

### GLM (Native Provider)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_key` | string | required | GLM API key in `id.secret` format |
| `model` | string | required | GLM model name |

### Aliased Providers (OpenAI-Compatible)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_key` | string | required | Provider-specific API key |
| `api_url` | string | auto-detected | Override the default base URL |
| `model` | string | required | Model name |

## Features

### JWT Authentication

GLM uses JWT-based authentication rather than plain API keys. PRX automatically:

1. Splits the API key into `id` and `secret` components
2. Generates a JWT token with:
   - Header: `{"alg":"HS256","typ":"JWT","sign_type":"SIGN"}`
   - Payload: `{"api_key":"<id>","exp":<expiry_ms>,"timestamp":<now_ms>}`
   - Signature: HMAC-SHA256 with the secret key
3. Caches the JWT for 3 minutes (token expires at 3.5 minutes)
4. Sends it as `Authorization: Bearer <jwt>`

### Regional Endpoints

Most aliased providers offer both international and China-mainland endpoints:

```toml
# International (default for most)
provider = "moonshot-intl"

# China mainland
provider = "moonshot-cn"

# Explicit regional variants
provider = "qwen-us"      # US region
provider = "qwen-intl"    # International
provider = "qwen-cn"      # China mainland
```

### Minimax OAuth Support

Minimax supports OAuth token authentication:

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

Set `provider = "minimax-oauth"` or `provider = "minimax-oauth-cn"` to use OAuth instead of API key authentication.

### Qwen OAuth and Coding Modes

Qwen offers additional access modes:

- **Qwen OAuth**: `provider = "qwen-oauth"` or `provider = "qwen-code"` for OAuth-based access
- **Qwen Coding**: `provider = "qwen-coding"` or `provider = "dashscope-coding"` for the coding-specialized API endpoint

## Provider Aliases Reference

| Alias | Resolves To | Endpoint |
|-------|-------------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM (global) | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM (CN) | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax (intl) | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax (CN) | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot (CN) | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot (intl) | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen (CN) | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen (intl) | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen (US) | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI (global) | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI (CN) | `open.bigmodel.cn/api/coding/paas/v4` |

## Troubleshooting

### "GLM API key not set or invalid format"

The GLM API key must be in `id.secret` format (contains exactly one dot). Verify your key format:
```
abc123.secretXYZ  # correct
abc123secretXYZ   # wrong - missing dot
```

### JWT generation fails

Ensure your system clock is accurate. JWT tokens include a timestamp and expire after 3.5 minutes.

### MiniMax "role: system" rejected

MiniMax does not accept `role: system` messages. PRX automatically merges system message content into the first user message when using MiniMax providers.

### Qwen/DashScope timeout

Qwen's DashScope API requires HTTP/1.1 (not HTTP/2). PRX automatically forces HTTP/1.1 for DashScope endpoints. If you experience timeouts, ensure your network allows HTTP/1.1 connections.

### Regional endpoint errors

If you get connection errors, try switching between regional endpoints:
- China users: Use `*-cn` variants
- International users: Use `*-intl` or base variants
- US-based users: Try `qwen-us` for Qwen

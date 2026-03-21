---
title: Google Gemini
description: Configure Google Gemini as your LLM provider in PRX
---

# Google Gemini

> Access Gemini models via the Google Generative Language API with support for API keys, Gemini CLI OAuth tokens, and long context windows up to 2M tokens.

## Prerequisites

- A Google AI Studio API key from [aistudio.google.com](https://aistudio.google.com/app/apikey), **or**
- Gemini CLI installed and authenticated (`gemini` command), **or**
- A `GEMINI_API_KEY` or `GOOGLE_API_KEY` environment variable

## Quick Setup

### 1. Get API Key

**Option A: API Key (recommended for most users)**

1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **Create API key**
3. Copy the key

**Option B: Gemini CLI (zero-config for existing users)**

If you already use the Gemini CLI, PRX automatically detects your OAuth token from `~/.gemini/oauth_creds.json`. No additional configuration needed.

### 2. Configure

```toml
[default]
provider = "gemini"
model = "gemini-2.5-flash"

[providers.gemini]
api_key = "${GEMINI_API_KEY}"
```

Or set the environment variable:

```bash
export GEMINI_API_KEY="AIza..."
```

### 3. Verify

```bash
prx doctor models
```

## Available Models

| Model | Context | Vision | Tool Use | Notes |
|-------|---------|--------|----------|-------|
| `gemini-2.5-pro` | 1M | Yes | Yes | Most capable Gemini model |
| `gemini-2.5-flash` | 1M | Yes | Yes | Fast and cost-effective |
| `gemini-2.0-flash` | 1M | Yes | Yes | Previous generation flash |
| `gemini-1.5-pro` | 2M | Yes | Yes | Longest context window |
| `gemini-1.5-flash` | 1M | Yes | Yes | Previous generation |

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_key` | string | optional | Google AI API key (`AIza...`) |
| `model` | string | `gemini-2.5-flash` | Default model to use |

## Features

### Multiple Authentication Methods

PRX resolves Gemini credentials in this priority order:

| Priority | Source | How it works |
|----------|--------|--------------|
| 1 | Explicit API key in config | Sent as `?key=` query parameter to public API |
| 2 | `GEMINI_API_KEY` env var | Same as above |
| 3 | `GOOGLE_API_KEY` env var | Same as above |
| 4 | Gemini CLI OAuth token | Sent as `Authorization: Bearer` to internal Code Assist API |

### Gemini CLI OAuth Integration

If you have authenticated with the Gemini CLI (`gemini` command), PRX automatically:

1. Reads `~/.gemini/oauth_creds.json`
2. Checks token expiry (skips expired tokens with a warning)
3. Routes requests to Google's internal Code Assist API (`cloudcode-pa.googleapis.com`) using the proper envelope format

This means existing Gemini CLI users can use PRX with zero additional setup.

### Long Context Windows

Gemini models support extremely long context windows (up to 2M tokens for Gemini 1.5 Pro). PRX sets `maxOutputTokens` to 8192 by default. The full conversation history is sent as `contents` with proper role mapping (`user`/`model`).

### System Instructions

System prompts are sent using Gemini's native `systemInstruction` field (not as a regular message), ensuring they are handled correctly by the model.

### Automatic Model Name Formatting

PRX automatically prepends `models/` to model names when needed. Both `gemini-2.5-flash` and `models/gemini-2.5-flash` work correctly.

## Provider Aliases

The following names all resolve to the Gemini provider:

- `gemini`
- `google`
- `google-gemini`

## Troubleshooting

### "Gemini API key not found"

PRX could not find any authentication. Options:

1. Set `GEMINI_API_KEY` environment variable
2. Run the `gemini` CLI to authenticate (tokens will be reused automatically)
3. Get an API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
4. Run `prx onboard` to configure interactively

### "400 Bad Request: API key not valid" with Gemini CLI

This occurs when OAuth tokens from the Gemini CLI are sent to the public API endpoint. PRX handles this by routing OAuth tokens to the internal `cloudcode-pa.googleapis.com` endpoint automatically. If you see this error, ensure you are using the latest version of PRX.

### "Gemini CLI OAuth token expired"

Re-run the `gemini` CLI to refresh your token. PRX does not refresh Gemini CLI tokens automatically (unlike Anthropic OAuth tokens).

### 403 Forbidden

Your API key may not have the Generative Language API enabled. Go to the [Google Cloud Console](https://console.cloud.google.com/) and enable the **Generative Language API** for your project.

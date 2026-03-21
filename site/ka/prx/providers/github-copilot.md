---
title: GitHub Copilot
description: GitHub Copilot-ის კონფიგურაცია PRX-ში LLM პროვაიდერად
---

# GitHub Copilot

> Access GitHub Copilot Chat models via the Copilot API with automatic OAuth device-flow authentication and token management.

## წინაპირობები

- A GitHub account with an active **Copilot Individual**, **Copilot Business**, or **Copilot Enterprise** subscription
- Optionally, a GitHub personal access token (otherwise, interactive device-flow login is used)

## სწრაფი დაყენება

### 1. Authenticate

On first use, PRX will prompt you to authenticate via GitHub's device code flow:

```
GitHub Copilot authentication is required.
Visit: https://github.com/login/device
Code: XXXX-XXXX
Waiting for authorization...
```

Alternatively, provide a GitHub token directly:

```bash
export GITHUB_TOKEN="ghp_..."
```

### 2. კონფიგურაცია

```toml
[default]
provider = "copilot"
model = "gpt-4o"
```

### 3. შემოწმება

```bash
prx doctor models
```

## Available Models

GitHub Copilot provides access to a curated set of models. The exact models available depend on your Copilot subscription tier:

| Model | Context | Vision | Tool Use | Notes |
|-------|---------|--------|----------|-------|
| `gpt-4o` | 128K | Yes | Yes | Default Copilot model |
| `gpt-4o-mini` | 128K | Yes | Yes | Faster, cost-effective |
| `claude-sonnet-4` | 200K | Yes | Yes | Available on Copilot Enterprise |
| `o3-mini` | 128K | No | Yes | Reasoning model |

Model availability may vary based on your GitHub Copilot plan and GitHub's current model offerings.

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `api_key` | string | optional | GitHub personal access token (`ghp_...` or `gho_...`) |
| `model` | string | `gpt-4o` | Default model to use |

## ფუნქციები

### Zero-Config Authentication

The Copilot provider implements the same OAuth device-code flow used by VS Code's Copilot extension:

1. **Device code request**: PRX requests a device code from GitHub
2. **User authorization**: You visit `github.com/login/device` and enter the code
3. **Token exchange**: The GitHub OAuth token is exchanged for a short-lived Copilot API key
4. **Automatic caching**: Tokens are cached to `~/.config/openprx/copilot/` with secure file permissions (0600)
5. **Auto-refresh**: Expired Copilot API keys are automatically re-exchanged without re-authentication

### Secure Token Storage

Tokens are stored with strict security:
- Directory: `~/.config/openprx/copilot/` with 0700 permissions
- Files: `access-token` and `api-key.json` with 0600 permissions
- On non-Unix platforms, standard file creation is used

### Dynamic API Endpoint

The Copilot API key response includes an `endpoints.api` field that specifies the actual API endpoint. PRX respects this, falling back to `https://api.githubcopilot.com` when no endpoint is specified.

### Native Tool Calling

Tools are sent in OpenAI-compatible format via the Copilot Chat Completions API (`/chat/completions`). The provider supports `tool_choice: "auto"` for automatic tool selection.

### Editor Headers

Requests include standard Copilot editor identification headers:
- `Editor-Version: vscode/1.85.1`
- `Editor-Plugin-Version: copilot/1.155.0`
- `User-Agent: GithubCopilot/1.155.0`

## პრობლემების მოგვარება

### "Failed to get Copilot API key (401/403)"

Your GitHub OAuth token may be expired or your Copilot subscription is inactive:
- Ensure your GitHub account has an active Copilot subscription
- PRX automatically clears the cached access token on 401/403 and will re-prompt for device-flow login

### "Timed out waiting for GitHub authorization"

The device code flow has a 15-minute timeout. If it expires:
- Run your PRX command again to get a new code
- Make sure you visit the correct URL and enter the exact code shown

### "GitHub device authorization expired"

The device code has expired. Simply retry your command to start a new authorization flow.

### Models not available

The available models depend on your Copilot subscription tier:
- **Copilot Individual**: GPT-4o, GPT-4o-mini
- **Copilot Business/Enterprise**: May include additional models like Claude

Check your subscription at [github.com/settings/copilot](https://github.com/settings/copilot).

### Rate limiting

GitHub Copilot has its own rate limits separate from OpenAI. If you encounter rate limiting, consider using `fallback_providers` in your PRX configuration to fall back to another provider.

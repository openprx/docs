---
title: OAuth2 Flows
description: OAuth2 authentication flows supported by PRX for LLM provider authorization.
---

# OAuth2 Flows

PRX implements OAuth2 authorization flows for providers that support browser-based authentication. This allows users to authenticate without manually managing API keys.

## Supported Flows

### Authorization Code Flow

Used by Anthropic (Claude Code), Google Gemini CLI, and Minimax:

1. PRX opens a browser to the provider's authorization URL
2. User grants permission
3. Provider redirects to PRX's local callback server
4. PRX exchanges the authorization code for access and refresh tokens
5. Tokens are securely stored for future use

### Device Code Flow

Used by GitHub Copilot:

1. PRX requests a device code from the provider
2. User visits a URL and enters the device code
3. PRX polls for authorization completion
4. Once authorized, tokens are received and stored

## Token Management

PRX automatically handles:

- Token caching to avoid repeated authorization
- Refresh token rotation when access tokens expire
- Secure storage of tokens (encrypted at rest)

## Configuration

```toml
[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
auto_refresh = true
```

## CLI Commands

```bash
prx auth login anthropic    # Start OAuth2 flow for Anthropic
prx auth login copilot      # Start device code flow for Copilot
prx auth status              # Show auth status for all providers
prx auth logout anthropic   # Revoke tokens for Anthropic
```

## Related Pages

- [Authentication Overview](./)
- [Provider Profiles](./profiles)

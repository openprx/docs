---
title: Authentication
description: Overview of PRX authentication system including OAuth2 flows and provider profiles.
---

# Authentication

PRX supports multiple authentication mechanisms for LLM providers, API access, and inter-node communication. The auth system handles OAuth2 flows, API key management, and provider-specific authentication.

## Overview

Authentication in PRX operates at multiple levels:

| Level | Mechanism | Purpose |
|-------|-----------|---------|
| Provider auth | OAuth2 / API keys | Authenticate with LLM providers |
| Gateway auth | Bearer tokens | Authenticate API clients |
| Node auth | Ed25519 pairing | Authenticate distributed nodes |

## Provider Authentication

Each LLM provider has its own authentication method:

- **API key** -- static key passed in request headers (most providers)
- **OAuth2** -- browser-based authorization flow (Anthropic, Google, GitHub Copilot)
- **AWS IAM** -- role-based authentication for Bedrock

## Configuration

```toml
[auth]
default_method = "api_key"

[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
```

## Related Pages

- [OAuth2 Flows](./oauth2)
- [Provider Profiles](./profiles)
- [Secrets Management](/en/prx/security/secrets)

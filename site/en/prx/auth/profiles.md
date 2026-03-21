---
title: Provider Profiles
description: Named authentication profiles for managing multiple provider accounts in PRX.
---

# Provider Profiles

Provider profiles allow you to configure multiple authentication contexts for the same provider. This is useful when you have separate accounts for personal and work use, or when switching between development and production API keys.

## Overview

A profile is a named configuration that includes:

- Provider identifier
- Authentication credentials (API key or OAuth2 tokens)
- Model preferences
- Rate limit overrides

## Configuration

```toml
[[auth.profiles]]
name = "personal"
provider = "anthropic"
api_key = "sk-ant-personal-..."
default_model = "claude-haiku"

[[auth.profiles]]
name = "work"
provider = "anthropic"
api_key = "sk-ant-work-..."
default_model = "claude-sonnet-4-6"
```

## Switching Profiles

```bash
# Use a specific profile
prx chat --profile work

# Set default profile
prx auth set-default work

# List profiles
prx auth profiles
```

## Environment Variables

Profiles can reference environment variables for credentials:

```toml
[[auth.profiles]]
name = "ci"
provider = "anthropic"
api_key = "${ANTHROPIC_API_KEY}"
```

## Related Pages

- [Authentication Overview](./)
- [OAuth2 Flows](./oauth2)
- [Secrets Management](/en/prx/security/secrets)

---
title: Profils de fournisseurs
description: Named authentication profiles for managing multiple provider accounts in PRX.
---

# Provider Profiles

Les profils de fournisseurs vous permettent de configurer plusieurs contextes d'authentification pour le meme fournisseur. This is useful when you have separate accounts for personal et work use, ou when switching between development et production API keys.

## Apercu

Un profil est une configuration nommee qui inclut :

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

Profiles can reference variables d'environnement for credentials:

```toml
[[auth.profiles]]
name = "ci"
provider = "anthropic"
api_key = "${ANTHROPIC_API_KEY}"
```

## Voir aussi Pages

- [Authentication Overview](./)
- [OAuth2 Flows](./oauth2)
- [Secrets Management](/fr/prx/security/secrets)

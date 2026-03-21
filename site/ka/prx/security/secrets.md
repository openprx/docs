---
title: Secrets Management
description: Secure storage and access control for API keys and credentials in PRX.
---

# Secrets Management

PRX provides secure storage for sensitive data like API keys, tokens, and credentials. Secrets are encrypted at rest and accessed through a controlled API.

## მიმოხილვა

The secrets system:

- Encrypts secrets at rest using AES-256-GCM
- Derives encryption keys from a master password or system keyring
- Provides environment variable injection for tool execution
- Supports secret rotation and expiration

## Storage

Secrets are stored in an encrypted file at `~/.local/share/openprx/secrets.enc`. The encryption key is derived from:

1. System keyring (preferred, when available)
2. Master password (interactive prompt)
3. Environment variable `PRX_MASTER_KEY` (for automation)

## კონფიგურაცია

```toml
[security.secrets]
store_path = "~/.local/share/openprx/secrets.enc"
key_derivation = "argon2id"
auto_rotate_days = 90
```

## CLI Commands

```bash
prx secret set OPENAI_API_KEY      # Set a secret (prompts for value)
prx secret get OPENAI_API_KEY      # Retrieve a secret
prx secret list                    # List secret names (not values)
prx secret delete OPENAI_API_KEY   # Delete a secret
prx secret rotate                  # Rotate the master key
```

## Related Pages

- [Security Overview](./)
- [Auth](/ka/prx/auth/)

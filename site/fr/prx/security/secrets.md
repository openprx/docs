---
title: Gestion des secrets
description: Secure storage and access control for API keys and credentials in PRX.
---

# Secrets Management

PRX fournit un stockage securise pour les donnees sensibles comme les cles API, les tokens et les identifiants. Secrets are encrypted at rest and accessed via un controlled API.

## Apercu

The secrets system:

- Encrypts secrets at rest using AES-256-GCM
- Derives encryption keys depuis un master password or system keyring
- Provides variable d'environnement injection for execution d'outil
- Supports secret rotation and expiration

## Storage

Secrets are stocke dans an encrypted file at `~/.local/share/openprx/secrets.enc`. La cle de chiffrement est derivee de:

1. System keyring (preferred, when available)
2. Master password (interactive prompt)
3. Environment variable `PRX_MASTER_KEY` (for automation)

## Configuration

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

## Voir aussi Pages

- [Security Overview](./)
- [Auth](/fr/prx/auth/)

---
title: prx auth
description: Manage OAuth authentication profiles for LLM providers and services.
---

# prx auth

Manage OAuth authentication profiles. PRX uses OAuth2 flows for providers and services that support them (GitHub Copilot, Google Gemini, etc.). Auth profiles store tokens securely in the PRX secrets store.

## Usage

```bash
prx auth <SUBCOMMAND> [OPTIONS]
```

## Subcommands

### `prx auth login`

Authenticate with a provider or service.

```bash
prx auth login [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--provider` | `-P` | | Provider to authenticate with (e.g., `github-copilot`, `google-gemini`) |
| `--profile` | | `default` | Named profile for multiple accounts |
| `--browser` | | `true` | Open browser for OAuth flow |
| `--device-code` | | `false` | Use device code flow (for headless environments) |

```bash
# Login to GitHub Copilot
prx auth login --provider github-copilot

# Device code flow (no browser)
prx auth login --provider github-copilot --device-code

# Login with a named profile
prx auth login --provider google-gemini --profile work
```

The login flow:

1. PRX opens a browser (or displays a device code) for the provider's OAuth consent page
2. You authorize PRX in the browser
3. PRX receives and securely stores the access and refresh tokens
4. The token is automatically used for subsequent API calls

### `prx auth refresh`

Manually refresh an expired access token.

```bash
prx auth refresh [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--provider` | `-P` | all | Provider to refresh (refreshes all if omitted) |
| `--profile` | | `default` | Named profile to refresh |

```bash
# Refresh all provider tokens
prx auth refresh

# Refresh a specific provider
prx auth refresh --provider github-copilot
```

::: tip
Token refresh happens automatically during normal operation. Use this command only when troubleshooting authentication issues.
:::

### `prx auth logout`

Remove stored credentials for a provider.

```bash
prx auth logout [OPTIONS]
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--provider` | `-P` | | Provider to log out from (required) |
| `--profile` | | `default` | Named profile to log out |
| `--all` | | `false` | Log out from all providers and profiles |

```bash
# Log out from GitHub Copilot
prx auth logout --provider github-copilot

# Log out from everything
prx auth logout --all
```

## Auth Profiles

Profiles allow multiple accounts for the same provider. This is useful when you have separate work and personal accounts.

```bash
# Login with two different Google accounts
prx auth login --provider google-gemini --profile personal
prx auth login --provider google-gemini --profile work

# Use a specific profile in chat
prx chat --provider google-gemini  # uses "default" profile
```

Set the active profile per provider in the config file:

```toml
[providers.google-gemini]
auth_profile = "work"
```

## Token Storage

Tokens are encrypted using the ChaCha20-Poly1305 cipher and stored in the PRX secrets store at `~/.local/share/prx/secrets/`. The encryption key is derived from the machine identity.

## Related

- [Authentication Overview](/en/prx/auth/) -- auth architecture
- [OAuth2 Flow](/en/prx/auth/oauth2) -- detailed OAuth2 flow documentation
- [Auth Profiles](/en/prx/auth/profiles) -- profile management
- [Secrets Store](/en/prx/security/secrets) -- how tokens are stored securely

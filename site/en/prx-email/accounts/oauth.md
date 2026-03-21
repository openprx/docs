---
title: OAuth Authentication
description: Set up OAuth 2.0 XOAUTH2 authentication for PRX-Email with Gmail and Outlook. Token lifecycle management, refresh providers, and hot-reload.
---

# OAuth Authentication

PRX-Email supports OAuth 2.0 authentication via the XOAUTH2 mechanism for both IMAP and SMTP. This is required for Outlook/Office 365 and recommended for Gmail. The plugin provides token expiry tracking, pluggable refresh providers, and environment-based hot-reload.

## How XOAUTH2 Works

XOAUTH2 replaces traditional password authentication with an OAuth access token. The client sends a specially formatted string during IMAP AUTHENTICATE or SMTP AUTH:

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

PRX-Email handles this automatically when `auth.oauth_token` is set.

## Gmail OAuth Setup

### 1. Create Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials (Desktop application type)
5. Note the **Client ID** and **Client Secret**

### 2. Obtain an Access Token

Use Google's OAuth playground or your own OAuth flow to obtain an access token with the following scopes:

- `https://mail.google.com/` (full IMAP/SMTP access)

### 3. Configure PRX-Email

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Outlook OAuth Setup

PRX-Email includes a bootstrap script for Outlook/Office 365 OAuth that handles the entire authorization code flow.

### 1. Register an Azure App

1. Go to [Azure Portal App Registrations](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Set a redirect URI (e.g., `http://localhost:53682/callback`)
4. Note the **Application (client) ID** and **Directory (tenant) ID**
5. Under API Permissions, add:
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. Run the Bootstrap Script

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

The script will:
1. Print an authorization URL -- open it in your browser
2. Wait for you to paste the callback URL or authorization code
3. Exchange the code for access and refresh tokens
4. Save tokens to `./outlook_oauth.local.env` with `chmod 600`

### Script Options

| Flag | Description |
|------|-------------|
| `--output <file>` | Custom output path (default: `./outlook_oauth.local.env`) |
| `--dry-run` | Print the authorization URL and exit |
| `-h`, `--help` | Show usage information |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLIENT_ID` | Yes | Azure application client ID |
| `TENANT` | Yes | Tenant ID, or `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | Yes | Redirect URI registered in Azure app |
| `SCOPE` | No | Custom scopes (default: IMAP + SMTP + offline_access) |

::: warning Security
Never commit the generated token file. Add `*.local.env` to your `.gitignore`.
:::

### 3. Load Tokens

After the bootstrap script generates tokens, source the env file and configure PRX-Email:

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## Token Lifecycle Management

### Expiry Tracking

PRX-Email tracks OAuth token expiry timestamps per protocol (IMAP/SMTP):

```rust
// Set expiry via environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

Before each operation, the plugin checks if the token expires within 60 seconds. If it does, a refresh is attempted.

### Pluggable Refresh Provider

Implement the `OAuthRefreshProvider` trait to handle automatic token refresh:

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // Call your OAuth provider's token endpoint
        // Return the new access token and optional expiry
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

Attach the provider when creating the plugin:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### Hot-Reload from Environment

Reload OAuth tokens at runtime without restarting:

```rust
// Set new tokens in environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// Trigger reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

The `reload_auth_from_env` method reads environment variables with the given prefix and updates the IMAP/SMTP OAuth tokens and expiry timestamps. When an OAuth token is loaded, the corresponding password is cleared to maintain the one-of-two-auth invariant.

### Full Config Reload

For a complete transport reconfiguration:

```rust
plugin.reload_config(new_transport_config)?;
```

This validates the new config and replaces the entire transport configuration atomically.

## OAuth Environment Variables

| Variable | Description |
|----------|-------------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth access token |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth access token |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP token expiry (Unix seconds) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP token expiry (Unix seconds) |

The prefix is passed to `reload_auth_from_env()`. For the default PRX-Email configuration, use `PRX_EMAIL` as the prefix.

## Security Best Practices

1. **Never log tokens.** PRX-Email sanitizes debug messages and redacts authorization-related content.
2. **Use refresh tokens.** Access tokens expire; always implement a refresh provider for production use.
3. **Store tokens securely.** Use file permissions (`chmod 600`) and never commit token files to version control.
4. **Rotate tokens regularly.** Even with automatic refresh, periodically verify that tokens are being rotated.

## Next Steps

- [Account Management](./index) -- Manage accounts and feature flags
- [Configuration Reference](../configuration/) -- All environment variables and settings
- [Troubleshooting](../troubleshooting/) -- OAuth-related error resolution

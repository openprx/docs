---
title: Configuration Reference
description: Complete configuration reference for Fenfa. Config file options, environment variables, storage settings, and Apple Developer API credentials.
---

# Configuration Reference

Fenfa can be configured through a `config.json` file, environment variables, or the admin panel (for runtime settings like storage and Apple API).

## Configuration Precedence

1. **Environment variables** -- Highest priority, override everything
2. **config.json file** -- Loaded at startup
3. **Default values** -- Used when nothing is specified

## Config File

Create a `config.json` in the working directory (or mount it in Docker):

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "Your Company Name",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## Server Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `server.port` | string | `"8000"` | HTTP listen port |
| `server.primary_domain` | string | `"http://localhost:8000"` | Public URL used in manifests, callbacks, and download links |
| `server.secondary_domains` | string[] | `[]` | Additional domains (CDN, alternate access) |
| `server.organization` | string | `"Fenfa Distribution"` | Organization name shown in iOS mobile config profiles |
| `server.bundle_id_prefix` | string | `""` | Bundle ID prefix for generated profiles |
| `server.data_dir` | string | `"data"` | Directory for SQLite database |
| `server.db_path` | string | `"data/fenfa.db"` | Explicit database file path |
| `server.dev_proxy_front` | string | `""` | Vite dev server URL for public page (development only) |
| `server.dev_proxy_admin` | string | `""` | Vite dev server URL for admin panel (development only) |

::: warning Primary Domain
The `primary_domain` setting is critical for iOS OTA distribution. It must be the HTTPS URL that end users access. iOS manifest files use this URL for download links, and UDID callbacks redirect to this domain.
:::

## Authentication

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | Tokens for the upload API |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | Tokens for the admin API (includes upload permission) |

::: danger Change Default Tokens
The default tokens (`dev-upload-token` and `dev-admin-token`) are for development only. Always change them before deploying to production.
:::

Multiple tokens are supported for each scope, allowing you to issue different tokens to different CI/CD pipelines or team members and revoke them individually.

## Environment Variables

Override any config value with environment variables:

| Variable | Config Equivalent | Description |
|----------|-------------------|-------------|
| `FENFA_PORT` | `server.port` | HTTP listen port |
| `FENFA_DATA_DIR` | `server.data_dir` | Database directory |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | Public domain URL |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | Admin token (replaces the first token) |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | Upload token (replaces the first token) |

Example:

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## Storage Configuration

### Local Storage (Default)

Files are stored at `uploads/{product_id}/{variant_id}/{release_id}/filename.ext` relative to the working directory. No additional configuration needed.

### S3-Compatible Storage

Configure S3 storage in the admin panel under **Settings > Storage**, or via the API:

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

Supported providers:
- **Cloudflare R2** -- No egress fees, S3-compatible
- **AWS S3** -- Standard S3
- **MinIO** -- Self-hosted S3-compatible storage
- Any S3-compatible provider

::: tip Upload Domain
If your primary domain has CDN limits on file size, configure `upload_domain` as a separate domain that bypasses CDN restrictions for large file uploads.
:::

## Apple Developer API

Configure Apple Developer API credentials for automatic device registration. Set these in the admin panel under **Settings > Apple Developer API**, or via the API:

| Field | Description |
|-------|-------------|
| `apple_key_id` | API Key ID from App Store Connect |
| `apple_issuer_id` | Issuer ID (UUID format) |
| `apple_private_key` | PEM-format private key content |
| `apple_team_id` | Apple Developer Team ID |

See [iOS Distribution](../distribution/ios) for setup instructions.

## Database

Fenfa uses SQLite via GORM. The database file is created automatically at the configured `db_path`. Migrations run automatically on startup.

::: info Backup
To back up Fenfa, copy the SQLite database file and the `uploads/` directory. For S3 storage, only the database file needs local backup.
:::

## Development Settings

For local development with hot reload:

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

When `dev_proxy_front` or `dev_proxy_admin` is set, Fenfa proxies requests to the Vite development server instead of serving the embedded frontend. This enables hot module replacement during development.

## Next Steps

- [Docker Deployment](../deployment/docker) -- Docker configuration and volumes
- [Production Deployment](../deployment/production) -- Reverse proxy and security hardening
- [API Overview](../api/) -- API authentication details

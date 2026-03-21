---
title: API Overview
description: Fenfa REST API reference. Token-based authentication, JSON responses, and endpoints for uploading builds, managing products, and querying analytics.
---

# API Overview

Fenfa exposes a REST API for uploading builds, managing products, and querying analytics. All programmatic interactions -- from CI/CD uploads to admin panel operations -- go through this API.

## Base URL

All API endpoints are relative to your Fenfa server URL:

```
https://your-domain.com
```

## Authentication

Protected endpoints require an `X-Auth-Token` header. Fenfa uses two token scopes:

| Scope | Can Do | Header |
|-------|--------|--------|
| `upload` | Upload builds | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | Full admin access (includes upload) | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

Tokens are configured in `config.json` or via environment variables. See [Configuration](../configuration/).

::: warning
Requests to protected endpoints without a valid token receive a `401 Unauthorized` response.
:::

## Response Format

All JSON responses follow a unified structure:

**Success:**

```json
{
  "ok": true,
  "data": { ... }
}
```

**Error:**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Invalid request parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Token lacks required scope |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

## Endpoint Summary

### Public Endpoints (No Auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/products/:slug` | Product download page (HTML) |
| GET | `/d/:releaseID` | Direct file download |
| GET | `/ios/:releaseID/manifest.plist` | iOS OTA manifest |
| GET | `/udid/profile.mobileconfig?variant=:id` | UDID binding profile |
| POST | `/udid/callback` | UDID callback (from iOS) |
| GET | `/udid/status?variant=:id` | UDID binding status |
| GET | `/healthz` | Health check |

### Upload Endpoints (Upload Token)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload a build file |

### Admin Endpoints (Admin Token)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/api/smart-upload` | Smart upload with auto-detection |
| GET | `/admin/api/products` | List products |
| POST | `/admin/api/products` | Create product |
| GET | `/admin/api/products/:id` | Get product with variants |
| PUT | `/admin/api/products/:id` | Update product |
| DELETE | `/admin/api/products/:id` | Delete product |
| POST | `/admin/api/products/:id/variants` | Create variant |
| PUT | `/admin/api/variants/:id` | Update variant |
| DELETE | `/admin/api/variants/:id` | Delete variant |
| GET | `/admin/api/variants/:id/stats` | Variant statistics |
| DELETE | `/admin/api/releases/:id` | Delete release |
| PUT | `/admin/api/apps/:id/publish` | Publish app |
| PUT | `/admin/api/apps/:id/unpublish` | Unpublish app |
| GET | `/admin/api/events` | Query events |
| GET | `/admin/api/ios_devices` | List iOS devices |
| POST | `/admin/api/devices/:id/register-apple` | Register device with Apple |
| POST | `/admin/api/devices/register-apple` | Batch register devices |
| GET | `/admin/api/settings` | Get settings |
| PUT | `/admin/api/settings` | Update settings |
| GET | `/admin/api/upload-config` | Get upload configuration |
| GET | `/admin/api/apple/status` | Apple API status |
| GET | `/admin/api/apple/devices` | Apple-registered devices |

### Export Endpoints (Admin Token)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/exports/releases.csv` | Export releases |
| GET | `/admin/exports/events.csv` | Export events |
| GET | `/admin/exports/ios_devices.csv` | Export iOS devices |

## ID Format

All resource IDs use a prefix + random string format:

| Prefix | Resource |
|--------|----------|
| `prd_` | Product |
| `var_` | Variant |
| `rel_` | Release |
| `app_` | App (legacy) |

## Detailed References

- [Upload API](./upload) -- Upload endpoint with field reference and examples
- [Admin API](./admin) -- Complete admin endpoint documentation

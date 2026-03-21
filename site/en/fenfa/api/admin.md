---
title: Admin API
description: Complete Fenfa admin API reference for managing products, variants, releases, devices, settings, and exports.
---

# Admin API

All admin endpoints require the `X-Auth-Token` header with an admin-scoped token. Admin tokens have full access to all API operations including upload.

## Products

### List Products

```
GET /admin/api/products
```

Returns all products with their basic information.

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### Create Product

```
POST /admin/api/products
Content-Type: application/json
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Product display name |
| `slug` | Yes | URL identifier (unique) |
| `description` | No | Product description |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "Cross-platform app"}'
```

### Get Product

```
GET /admin/api/products/:productID
```

Returns the product with all its variants.

### Update Product

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### Delete Product

```
DELETE /admin/api/products/:productID
```

::: danger Cascading Delete
Deleting a product permanently removes all its variants, releases, and uploaded files.
:::

## Variants

### Create Variant

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| Field | Required | Description |
|-------|----------|-------------|
| `platform` | Yes | `ios`, `android`, `macos`, `windows`, `linux` |
| `display_name` | Yes | Human-readable name |
| `identifier` | Yes | Bundle ID or package name |
| `arch` | No | CPU architecture |
| `installer_type` | No | File type (`ipa`, `apk`, `dmg`, etc.) |
| `min_os` | No | Minimum OS version |
| `sort_order` | No | Display order (lower = first) |

### Update Variant

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### Delete Variant

```
DELETE /admin/api/variants/:variantID
```

::: danger Cascading Delete
Deleting a variant permanently removes all its releases and uploaded files.
:::

### Variant Statistics

```
GET /admin/api/variants/:variantID/stats
```

Returns download counts and other statistics for the variant.

## Releases

### Delete Release

```
DELETE /admin/api/releases/:releaseID
```

Removes the release and its uploaded binary file.

## Publishing

Control whether a product/app is visible on the public download page.

### Publish

```
PUT /admin/api/apps/:appID/publish
```

### Unpublish

```
PUT /admin/api/apps/:appID/unpublish
```

## Events

### Query Events

```
GET /admin/api/events
```

Returns visit, click, and download events. Supports query parameters for filtering.

| Parameter | Description |
|-----------|-------------|
| `type` | Event type (`visit`, `click`, `download`) |
| `variant_id` | Filter by variant |
| `release_id` | Filter by release |

## iOS Devices

### List Devices

```
GET /admin/api/ios_devices
```

Returns all iOS devices that have completed UDID binding.

### Register Device with Apple

```
POST /admin/api/devices/:deviceID/register-apple
```

Registers a single device with your Apple Developer account.

### Batch Register Devices

```
POST /admin/api/devices/register-apple
```

Registers all unregistered devices with Apple in a single batch operation.

## Apple Developer API

### Check Status

```
GET /admin/api/apple/status
```

Returns whether Apple Developer API credentials are configured and valid.

### List Apple Devices

```
GET /admin/api/apple/devices
```

Returns devices registered in your Apple Developer account.

## Settings

### Get Settings

```
GET /admin/api/settings
```

Returns current system settings (domains, organization, storage type).

### Update Settings

```
PUT /admin/api/settings
Content-Type: application/json
```

Updatable fields include:
- `primary_domain` -- Public URL for manifests and callbacks
- `secondary_domains` -- CDN or alternate domains
- `organization` -- Organization name in iOS profiles
- `storage_type` -- `local` or `s3`
- S3 configuration (endpoint, bucket, keys, public URL)
- Apple Developer API credentials

### Get Upload Configuration

```
GET /admin/api/upload-config
```

Returns the current upload configuration including storage type and limits.

## Exports

Export data as CSV files for external analysis:

| Endpoint | Data |
|----------|------|
| `GET /admin/exports/releases.csv` | All releases with metadata |
| `GET /admin/exports/events.csv` | All events |
| `GET /admin/exports/ios_devices.csv` | All iOS devices |

```bash
# Example: export all releases
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Next Steps

- [Upload API](./upload) -- Upload endpoint reference
- [Configuration](../configuration/) -- Server configuration options
- [Production Deployment](../deployment/production) -- Secure your admin API

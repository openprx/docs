---
title: Platform Variants
description: Configure platform-specific variants for iOS, Android, macOS, Windows, and Linux under a Fenfa product.
---

# Platform Variants

A variant represents a platform-specific build target under a product. Each variant has its own platform, identifier (bundle ID or package name), architecture, and installer type. Releases are uploaded to specific variants.

## Supported Platforms

| Platform | Identifier Example | Installer Type | Architecture |
|----------|--------------------|----------------|--------------|
| `ios` | `com.example.myapp` | `ipa` | `arm64` |
| `android` | `com.example.myapp` | `apk` | `universal`, `arm64-v8a`, `armeabi-v7a` |
| `macos` | `com.example.myapp` | `dmg`, `pkg`, `zip` | `arm64`, `x86_64`, `universal` |
| `windows` | `com.example.myapp` | `exe`, `msi`, `zip` | `x64`, `arm64` |
| `linux` | `com.example.myapp` | `deb`, `rpm`, `appimage`, `tar.gz` | `x86_64`, `aarch64` |

## Creating a Variant

### Via Admin Panel

1. Open the product you want to add a variant to.
2. Click **Add Variant**.
3. Fill in the fields:

| Field | Required | Description |
|-------|----------|-------------|
| Platform | Yes | Target platform (`ios`, `android`, `macos`, `windows`, `linux`) |
| Display Name | Yes | Human-readable name (e.g., "iOS", "Android ARM64") |
| Identifier | Yes | Bundle ID or package name |
| Architecture | No | CPU architecture |
| Installer Type | No | File type (`ipa`, `apk`, `dmg`, etc.) |
| Minimum OS | No | Minimum OS version requirement |
| Sort Order | No | Display order on the download page (lower = first) |

4. Click **Save**.

### Via API

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0"
  }'
```

Response:

```json
{
  "ok": true,
  "data": {
    "id": "var_def456",
    "product_id": "prd_abc123",
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0",
    "published": true,
    "sort_order": 0
  }
}
```

## Typical Product Setup

A typical multi-platform product might have these variants:

```
MyApp (Product)
├── iOS (com.example.myapp, ipa, arm64)
├── Android (com.example.myapp, apk, universal)
├── macOS Apple Silicon (com.example.myapp, dmg, arm64)
├── macOS Intel (com.example.myapp, dmg, x86_64)
├── Windows (com.example.myapp, exe, x64)
└── Linux (com.example.myapp, appimage, x86_64)
```

::: tip Single Architecture vs. Multiple
For platforms that support universal binaries (like Android or macOS), you can create a single variant with `universal` architecture. For platforms where you ship separate binaries per architecture, create one variant per arch.
:::

## Updating a Variant

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "iOS (Ad-Hoc)",
    "min_os": "16.0"
  }'
```

## Deleting a Variant

::: danger Cascading Delete
Deleting a variant removes all its releases and uploaded files permanently.
:::

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Variant Statistics

Get download statistics for a specific variant:

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## ID Format

Variant IDs use the prefix `var_` followed by a random string (e.g., `var_def456`).

## Next Steps

- [Release Management](./releases) -- Upload builds to your variants
- [iOS Distribution](../distribution/ios) -- iOS-specific variant configuration for OTA and UDID binding
- [Desktop Distribution](../distribution/desktop) -- macOS, Windows, and Linux distribution considerations

---
title: Release Management
description: Upload, version, and manage app releases in Fenfa. Each release is a specific build uploaded to a platform variant.
---

# Release Management

A release represents a specific uploaded build under a variant. Each release has a version string, build number, changelog, and the binary file itself. Releases are displayed on the product download page in reverse chronological order.

## Release Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Auto-generated ID (e.g., `rel_b1cqa`) |
| `variant_id` | string | Parent variant ID |
| `version` | string | Version string (e.g., "1.2.0") |
| `build` | integer | Build number (e.g., 120) |
| `changelog` | text | Release notes (shown on download page) |
| `min_os` | string | Minimum OS version |
| `channel` | string | Distribution channel (e.g., "internal", "beta", "production") |
| `size_bytes` | integer | File size in bytes |
| `sha256` | string | SHA-256 hash of the uploaded file |
| `download_count` | integer | Number of times this release has been downloaded |
| `file_name` | string | Original filename |
| `file_ext` | string | File extension (e.g., "ipa", "apk") |
| `created_at` | datetime | Upload timestamp |

## Uploading a Release

### Standard Upload

Upload a build file to a specific variant:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "changelog=Bug fixes and performance improvements"
```

Response:

```json
{
  "ok": true,
  "data": {
    "app": {
      "id": "app_xxx",
      "name": "MyApp",
      "platform": "ios",
      "bundle_id": "com.example.myapp"
    },
    "release": {
      "id": "rel_b1cqa",
      "version": "1.2.0",
      "build": 120
    },
    "urls": {
      "page": "https://dist.example.com/products/myapp",
      "download": "https://dist.example.com/d/rel_b1cqa",
      "ios_manifest": "https://dist.example.com/ios/rel_b1cqa/manifest.plist",
      "ios_install": "itms-services://..."
    }
  }
}
```

### Smart Upload

The smart upload endpoint auto-detects metadata from the uploaded package:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

::: tip Auto-Detection
Smart upload extracts the following from IPA and APK files:
- **Bundle ID / Package Name**
- **Version string** (CFBundleShortVersionString / versionName)
- **Build number** (CFBundleVersion / versionCode)
- **App icon** (extracted and stored as the product icon)
- **Minimum OS version**

You can still override any auto-detected field by providing it explicitly in the upload request.
:::

### Upload Fields

| Field | Required | Description |
|-------|----------|-------------|
| `variant_id` | Yes | Target variant ID |
| `app_file` | Yes | The binary file (IPA, APK, DMG, etc.) |
| `version` | No | Version string (auto-detected for IPA/APK) |
| `build` | No | Build number (auto-detected for IPA/APK) |
| `channel` | No | Distribution channel |
| `min_os` | No | Minimum OS version |
| `changelog` | No | Release notes |

## File Storage

Uploaded files are stored at:

```
uploads/{product_id}/{variant_id}/{release_id}/filename.ext
```

Each release also has a `meta.json` snapshot (local storage only) for recovery purposes.

::: info S3 Storage
When S3-compatible storage is configured, files are uploaded to the configured bucket. The storage path structure remains the same. See [Configuration](../configuration/) for S3 setup.
:::

## Download URLs

Each release provides several URLs:

| URL | Description |
|-----|-------------|
| `/d/:releaseID` | Direct binary download (supports HTTP Range requests) |
| `/ios/:releaseID/manifest.plist` | iOS OTA manifest (for `itms-services://` links) |
| `/products/:slug` | Product download page |
| `/products/:slug?r=:releaseID` | Product page with specific release highlighted |

## Deleting a Release

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
Deleting a release permanently removes the uploaded binary file and all associated metadata.
:::

## Exporting Release Data

Export all releases as CSV for reporting:

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## CI/CD Integration

Fenfa is designed to be called from CI/CD pipelines. A typical GitHub Actions step:

```yaml
- name: Upload to Fenfa
  run: |
    curl -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_VARIANT_ID }}" \
      -F "app_file=@build/output/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}"
```

## Next Steps

- [Upload API Reference](../api/upload) -- Full upload endpoint documentation
- [iOS Distribution](../distribution/ios) -- iOS OTA manifest and installation
- [Distribution Overview](../distribution/) -- How releases reach end users

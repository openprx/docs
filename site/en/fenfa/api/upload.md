---
title: Upload API
description: Upload app builds to Fenfa via the REST API. Standard upload and smart upload with automatic metadata extraction.
---

# Upload API

Fenfa provides two upload endpoints: a standard upload for explicit metadata, and a smart upload that auto-detects metadata from the uploaded package.

## Standard Upload

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token or admin_token>
```

### Request Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `variant_id` | Yes | string | Target variant ID (e.g., `var_def456`) |
| `app_file` | Yes | file | Binary file (IPA, APK, DMG, EXE, etc.) |
| `version` | No | string | Version string (e.g., "1.2.0") |
| `build` | No | integer | Build number (e.g., 120) |
| `channel` | No | string | Distribution channel (e.g., "internal", "beta") |
| `min_os` | No | string | Minimum OS version (e.g., "15.0") |
| `changelog` | No | string | Release notes text |

### Example

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "min_os=15.0" \
  -F "changelog=Bug fixes and performance improvements"
```

### Response (201 Created)

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
      "ios_install": "itms-services://?action=download-manifest&url=https://dist.example.com/ios/rel_b1cqa/manifest.plist"
    }
  }
}
```

The `urls` object provides ready-to-use links:
- `page` -- Product download page URL
- `download` -- Direct binary download URL
- `ios_manifest` -- iOS manifest plist URL (iOS variants only)
- `ios_install` -- Full `itms-services://` install URL (iOS variants only)

## Smart Upload

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

Smart upload accepts the same fields as standard upload but auto-detects metadata from the uploaded package.

::: tip What Gets Auto-Detected
For **IPA files**: bundle ID, version (CFBundleShortVersionString), build number (CFBundleVersion), app icon, minimum iOS version.

For **APK files**: package name, version name, version code, app icon, minimum SDK version.

Desktop formats (DMG, EXE, DEB, etc.) do not support auto-detection. Provide version and build explicitly.
:::

### Example

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

Explicitly provided fields override auto-detected values:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=Release candidate 1"
```

## Error Responses

### Missing Variant ID (400)

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Invalid Token (401)

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### Variant Not Found (404)

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## CI/CD Examples

### GitHub Actions

```yaml
- name: Upload iOS build to Fenfa
  run: |
    RESPONSE=$(curl -s -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_IOS_VARIANT }}" \
      -F "app_file=@build/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}")
    echo "Upload response: $RESPONSE"
    echo "Download URL: $(echo $RESPONSE | jq -r '.data.urls.page')"
```

### GitLab CI

```yaml
upload:
  stage: deploy
  script:
    - |
      curl -X POST ${FENFA_URL}/upload \
        -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN}" \
        -F "variant_id=${FENFA_VARIANT_ID}" \
        -F "app_file=@build/output/app-release.apk" \
        -F "version=${CI_COMMIT_TAG}" \
        -F "build=${CI_PIPELINE_IID}" \
        -F "channel=beta"
  only:
    - tags
```

### Shell Script

```bash
#!/bin/bash
# upload.sh - Upload a build to Fenfa
FENFA_URL="https://dist.example.com"
TOKEN="your-upload-token"
VARIANT="var_def456"
FILE="$1"
VERSION="$2"

if [ -z "$FILE" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./upload.sh <file> <version>"
  exit 1
fi

curl -X POST "${FENFA_URL}/upload" \
  -H "X-Auth-Token: ${TOKEN}" \
  -F "variant_id=${VARIANT}" \
  -F "app_file=@${FILE}" \
  -F "version=${VERSION}" \
  -F "build=$(date +%s)"
```

## Next Steps

- [Admin API](./admin) -- Full admin endpoint reference
- [Release Management](../products/releases) -- Manage uploaded releases
- [Distribution Overview](../distribution/) -- How uploads reach end users

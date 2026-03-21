---
title: Desktop Distribution
description: Distribute macOS, Windows, and Linux desktop applications through Fenfa with direct downloads.
---

# Desktop Distribution

Fenfa distributes desktop applications (macOS, Windows, Linux) through direct file downloads. Desktop users visit the product page, click the download button, and receive the installer file for their platform.

## Supported Formats

| Platform | Common Formats | Notes |
|----------|---------------|-------|
| macOS | `.dmg`, `.pkg`, `.zip` | DMG for disk images, PKG for installers, ZIP for app bundles |
| Windows | `.exe`, `.msi`, `.zip` | EXE for installers, MSI for Windows Installer, ZIP for portable |
| Linux | `.deb`, `.rpm`, `.appimage`, `.tar.gz` | DEB for Debian/Ubuntu, RPM for Fedora/RHEL, AppImage for universal |

## Setting Up Desktop Variants

Create variants for each platform and architecture combination you support:

### macOS

```bash
# Apple Silicon
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Apple Silicon)",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'

# Intel
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Intel)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'
```

::: tip Universal Binary
If you build a universal macOS binary, create a single variant with `arch: "universal"` instead of separate arm64 and x86_64 variants.
:::

### Windows

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "windows",
    "display_name": "Windows",
    "identifier": "com.example.myapp",
    "arch": "x64",
    "installer_type": "exe",
    "min_os": "10"
  }'
```

### Linux

```bash
# DEB for Debian/Ubuntu
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (DEB)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "deb"
  }'

# AppImage (universal)
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (AppImage)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "appimage"
  }'
```

## Platform Detection

Fenfa's product page detects the visitor's operating system via User-Agent and highlights the matching download button. Desktop users see their platform's variant at the top, with other platforms available below.

## Uploading Desktop Builds

Upload works the same as for mobile platforms:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Native Apple Silicon support"
```

::: info No Auto-Detection for Desktop
Unlike iOS IPA and Android APK files, desktop binaries (DMG, EXE, DEB, etc.) do not contain standardized metadata that Fenfa can auto-extract. Always provide `version` and `build` explicitly when uploading desktop builds.
:::

## CI/CD Integration Example

A GitHub Actions workflow that uploads builds for all desktop platforms:

```yaml
jobs:
  upload:
    strategy:
      matrix:
        include:
          - platform: macos
            variant_id: var_macos_arm64
            file: dist/MyApp-arm64.dmg
          - platform: windows
            variant_id: var_windows_x64
            file: dist/MyApp-Setup.exe
          - platform: linux
            variant_id: var_linux_x64
            file: dist/MyApp.AppImage
    steps:
      - name: Upload to Fenfa
        run: |
          curl -X POST ${{ secrets.FENFA_URL }}/upload \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "variant_id=${{ matrix.variant_id }}" \
            -F "app_file=@${{ matrix.file }}" \
            -F "version=${{ github.ref_name }}" \
            -F "build=${{ github.run_number }}"
```

## Next Steps

- [iOS Distribution](./ios) -- iOS OTA installation and UDID binding
- [Android Distribution](./android) -- Android APK distribution
- [Upload API](../api/upload) -- Full upload endpoint reference

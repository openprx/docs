---
title: Desktop-Distribution
description: "macOS-, Windows- und Linux-Desktop-Anwendungen über Fenfa mit direkten Downloads verteilen."
---

# Desktop-Distribution

Fenfa verteilt Desktop-Anwendungen (macOS, Windows, Linux) über direkte Datei-Downloads. Desktop-Benutzer besuchen die Produktseite, klicken auf den Download-Button und erhalten die Installer-Datei für ihre Plattform.

## Unterstützte Formate

| Plattform | Häufige Formate | Hinweise |
|-----------|----------------|---------|
| macOS | `.dmg`, `.pkg`, `.zip` | DMG für Disk-Images, PKG für Installer, ZIP für App-Bundles |
| Windows | `.exe`, `.msi`, `.zip` | EXE für Installer, MSI für Windows Installer, ZIP für portabel |
| Linux | `.deb`, `.rpm`, `.appimage`, `.tar.gz` | DEB für Debian/Ubuntu, RPM für Fedora/RHEL, AppImage für universal |

## Desktop-Varianten einrichten

Varianten für jede Plattform- und Architektur-Kombination erstellen:

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

::: tip Universelles Binary
Bei einem universellen macOS-Binary eine einzelne Variante mit `arch: "universal"` anstatt separater arm64- und x86_64-Varianten erstellen.
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
# DEB für Debian/Ubuntu
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

## Plattformerkennung

Die Produktseite von Fenfa erkennt das Betriebssystem des Besuchers über User-Agent und hebt den passenden Download-Button hervor. Desktop-Benutzer sehen die Variante ihrer Plattform oben, mit anderen Plattformen darunter.

## Desktop-Builds hochladen

Upload funktioniert wie für mobile Plattformen:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Native Apple Silicon support"
```

::: info Keine automatische Erkennung für Desktop
Im Gegensatz zu iOS IPA- und Android APK-Dateien enthalten Desktop-Binärdateien (DMG, EXE, DEB, etc.) keine standardisierten Metadaten, die Fenfa automatisch extrahieren kann. Bei Desktop-Builds immer `version` und `build` explizit angeben.
:::

## CI/CD-Integrationsbeispiel

Ein GitHub-Actions-Workflow, der Builds für alle Desktop-Plattformen hochlädt:

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

## Nächste Schritte

- [iOS-Distribution](./ios) -- iOS OTA-Installation und UDID-Bindung
- [Android-Distribution](./android) -- Android APK-Distribution
- [Upload-API](../api/upload) -- Vollständige Upload-Endpunkt-Referenz

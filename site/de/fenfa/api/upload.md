---
title: Upload-API
description: "App-Builds über die REST-API zu Fenfa hochladen. Standard-Upload und intelligenter Upload mit automatischer Metadatenerkennung."
---

# Upload-API

Fenfa bietet zwei Upload-Endpunkte: einen Standard-Upload für explizite Metadaten und einen intelligenten Upload, der Metadaten automatisch aus dem hochgeladenen Paket erkennt.

## Standard-Upload

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token oder admin_token>
```

### Anfrage-Felder

| Feld | Erforderlich | Typ | Beschreibung |
|------|-------------|-----|-------------|
| `variant_id` | Ja | string | Ziel-Varianten-ID (z.B. `var_def456`) |
| `app_file` | Ja | Datei | Binärdatei (IPA, APK, DMG, EXE, etc.) |
| `version` | Nein | string | Versions-String (z.B. "1.2.0") |
| `build` | Nein | integer | Build-Nummer (z.B. 120) |
| `channel` | Nein | string | Distributionskanal (z.B. "internal", "beta") |
| `min_os` | Nein | string | Mindest-OS-Version (z.B. "15.0") |
| `changelog` | Nein | string | Release-Notizen-Text |

### Beispiel

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

### Antwort (201 Created)

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

Das `urls`-Objekt stellt sofort verwendbare Links bereit:
- `page` -- Produkt-Download-Seiten-URL
- `download` -- Direkter Binär-Download-URL
- `ios_manifest` -- iOS-Manifest-Plist-URL (nur iOS-Varianten)
- `ios_install` -- Vollständiger `itms-services://`-Installations-URL (nur iOS-Varianten)

## Intelligenter Upload

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

Der intelligente Upload akzeptiert dieselben Felder wie der Standard-Upload, erkennt Metadaten aber automatisch aus dem hochgeladenen Paket.

::: tip Was automatisch erkannt wird
Für **IPA-Dateien**: Bundle-ID, Version (CFBundleShortVersionString), Build-Nummer (CFBundleVersion), App-Icon, Mindest-iOS-Version.

Für **APK-Dateien**: Paketname, Versionsname, Versionscode, App-Icon, Mindest-SDK-Version.

Desktop-Formate (DMG, EXE, DEB, etc.) unterstützen keine automatische Erkennung. Version und Build-Nummer explizit angeben.
:::

### Beispiel

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

Explizit angegebene Felder überschreiben automatisch erkannte Werte:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=Release candidate 1"
```

## Fehlerantworten

### Fehlende Varianten-ID (400)

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Ungültiger Token (401)

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### Variante nicht gefunden (404)

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## CI/CD-Beispiele

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

### Shell-Skript

```bash
#!/bin/bash
# upload.sh - Build zu Fenfa hochladen
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

## Nächste Schritte

- [Admin-API](./admin) -- Vollständige Admin-Endpunkt-Referenz
- [Release-Verwaltung](../products/releases) -- Hochgeladene Releases verwalten
- [Distributions-Übersicht](../distribution/) -- Wie Uploads Endbenutzer erreichen

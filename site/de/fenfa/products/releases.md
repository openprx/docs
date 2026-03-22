---
title: Release-Verwaltung
description: "App-Releases in Fenfa hochladen, versionieren und verwalten. Jeder Release ist ein bestimmter Build, der zu einer Plattform-Variante hochgeladen wird."
---

# Release-Verwaltung

Ein Release repräsentiert einen bestimmten hochgeladenen Build unter einer Variante. Jeder Release hat eine Versions-String, Build-Nummer, Changelog und die Binärdatei selbst. Releases werden auf der Produkt-Download-Seite in umgekehrter chronologischer Reihenfolge angezeigt.

## Release-Felder

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | string | Automatisch generierte ID (z.B. `rel_b1cqa`) |
| `variant_id` | string | ID der übergeordneten Variante |
| `version` | string | Versions-String (z.B. "1.2.0") |
| `build` | integer | Build-Nummer (z.B. 120) |
| `changelog` | text | Release-Notizen (auf Download-Seite angezeigt) |
| `min_os` | string | Mindest-OS-Version |
| `channel` | string | Distributionskanal (z.B. "internal", "beta", "production") |
| `size_bytes` | integer | Dateigröße in Bytes |
| `sha256` | string | SHA-256-Hash der hochgeladenen Datei |
| `download_count` | integer | Anzahl der Downloads dieses Releases |
| `file_name` | string | Originaler Dateiname |
| `file_ext` | string | Dateiendung (z.B. "ipa", "apk") |
| `created_at` | datetime | Upload-Zeitstempel |

## Release hochladen

### Standard-Upload

Eine Build-Datei zu einer bestimmten Variante hochladen:

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

Antwort:

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

### Intelligenter Upload

Der Smart-Upload-Endpunkt erkennt Metadaten automatisch aus dem hochgeladenen Paket:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

::: tip Automatische Erkennung
Der intelligente Upload extrahiert folgende Informationen aus IPA- und APK-Dateien:
- **Bundle-ID / Paketname**
- **Versions-String** (CFBundleShortVersionString / versionName)
- **Build-Nummer** (CFBundleVersion / versionCode)
- **App-Icon** (extrahiert und als Produkt-Icon gespeichert)
- **Mindest-OS-Version**

Automatisch erkannte Felder können durch explizite Angabe in der Upload-Anfrage überschrieben werden.
:::

### Upload-Felder

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| `variant_id` | Ja | Ziel-Varianten-ID |
| `app_file` | Ja | Binärdatei (IPA, APK, DMG, etc.) |
| `version` | Nein | Versions-String (automatisch erkannt für IPA/APK) |
| `build` | Nein | Build-Nummer (automatisch erkannt für IPA/APK) |
| `channel` | Nein | Distributionskanal |
| `min_os` | Nein | Mindest-OS-Version |
| `changelog` | Nein | Release-Notizen |

## Dateispeicher

Hochgeladene Dateien werden gespeichert unter:

```
uploads/{product_id}/{variant_id}/{release_id}/filename.ext
```

Jeder Release hat auch einen `meta.json`-Snapshot (nur lokaler Speicher) für Wiederherstellungszwecke.

::: info S3-Speicher
Bei konfiguriertem S3-kompatiblen Speicher werden Dateien in den konfigurierten Bucket hochgeladen. Die Speicherpfadstruktur bleibt dieselbe. Für S3-Setup siehe [Konfiguration](../configuration/).
:::

## Download-URLs

Jeder Release stellt mehrere URLs bereit:

| URL | Beschreibung |
|-----|-------------|
| `/d/:releaseID` | Direkter Binär-Download (unterstützt HTTP-Range-Anfragen) |
| `/ios/:releaseID/manifest.plist` | iOS OTA-Manifest (für `itms-services://`-Links) |
| `/products/:slug` | Produkt-Download-Seite |
| `/products/:slug?r=:releaseID` | Produktseite mit hervorgehobenem bestimmten Release |

## Release löschen

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
Das Löschen eines Releases entfernt dauerhaft die hochgeladene Binärdatei und alle zugehörigen Metadaten.
:::

## Release-Daten exportieren

Alle Releases als CSV für Berichte exportieren:

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## CI/CD-Integration

Fenfa ist für den Aufruf aus CI/CD-Pipelines konzipiert. Ein typischer GitHub-Actions-Schritt:

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

## Nächste Schritte

- [Upload-API-Referenz](../api/upload) -- Vollständige Upload-Endpunkt-Dokumentation
- [iOS-Distribution](../distribution/ios) -- iOS OTA-Manifest und Installation
- [Distributions-Übersicht](../distribution/) -- Wie Releases Endbenutzer erreichen

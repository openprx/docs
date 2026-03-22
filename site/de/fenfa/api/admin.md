---
title: Admin-API
description: "Vollständige Fenfa Admin-API-Referenz für die Verwaltung von Produkten, Varianten, Releases, Geräten, Einstellungen und Exporten."
---

# Admin-API

Alle Admin-Endpunkte erfordern den `X-Auth-Token`-Header mit einem admin-scope-Token. Admin-Token haben vollständigen Zugriff auf alle API-Operationen einschließlich Upload.

## Produkte

### Produkte auflisten

```
GET /admin/api/products
```

Gibt alle Produkte mit grundlegenden Informationen zurück.

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### Produkt erstellen

```
POST /admin/api/products
Content-Type: application/json
```

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| `name` | Ja | Produkt-Anzeigename |
| `slug` | Ja | URL-Bezeichner (eindeutig) |
| `description` | Nein | Produktbeschreibung |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "Cross-platform app"}'
```

### Produkt abrufen

```
GET /admin/api/products/:productID
```

Gibt das Produkt mit allen Varianten zurück.

### Produkt aktualisieren

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### Produkt löschen

```
DELETE /admin/api/products/:productID
```

::: danger Kaskadierendes Löschen
Das Löschen eines Produkts entfernt dauerhaft alle Varianten, Releases und hochgeladenen Dateien.
:::

## Varianten

### Variante erstellen

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| `platform` | Ja | `ios`, `android`, `macos`, `windows`, `linux` |
| `display_name` | Ja | Lesbarer Name |
| `identifier` | Ja | Bundle-ID oder Paketname |
| `arch` | Nein | CPU-Architektur |
| `installer_type` | Nein | Dateityp (`ipa`, `apk`, `dmg`, etc.) |
| `min_os` | Nein | Mindest-OS-Version |
| `sort_order` | Nein | Anzeigereihenfolge (niedriger = zuerst) |

### Variante aktualisieren

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### Variante löschen

```
DELETE /admin/api/variants/:variantID
```

::: danger Kaskadierendes Löschen
Das Löschen einer Variante entfernt dauerhaft alle Releases und hochgeladenen Dateien.
:::

### Varianten-Statistiken

```
GET /admin/api/variants/:variantID/stats
```

Gibt Download-Zähler und andere Statistiken für die Variante zurück.

## Releases

### Release löschen

```
DELETE /admin/api/releases/:releaseID
```

Entfernt den Release und die hochgeladene Binärdatei.

## Veröffentlichung

Steuern, ob ein Produkt/App auf der öffentlichen Download-Seite sichtbar ist.

### Veröffentlichen

```
PUT /admin/api/apps/:appID/publish
```

### Unveröffentlichen

```
PUT /admin/api/apps/:appID/unpublish
```

## Events

### Events abfragen

```
GET /admin/api/events
```

Gibt Besuchs-, Klick- und Download-Events zurück. Unterstützt Abfrageparameter für Filterung.

| Parameter | Beschreibung |
|-----------|-------------|
| `type` | Event-Typ (`visit`, `click`, `download`) |
| `variant_id` | Nach Variante filtern |
| `release_id` | Nach Release filtern |

## iOS-Geräte

### Geräte auflisten

```
GET /admin/api/ios_devices
```

Gibt alle iOS-Geräte zurück, die die UDID-Bindung abgeschlossen haben.

### Gerät bei Apple registrieren

```
POST /admin/api/devices/:deviceID/register-apple
```

Registriert ein einzelnes Gerät beim Apple Developer-Konto.

### Geräte stapelweise registrieren

```
POST /admin/api/devices/register-apple
```

Registriert alle nicht registrierten Geräte bei Apple in einem einzigen Stapelvorgang.

## Apple Developer API

### Status prüfen

```
GET /admin/api/apple/status
```

Gibt zurück, ob Apple Developer API-Zugangsdaten konfiguriert und gültig sind.

### Apple-Geräte auflisten

```
GET /admin/api/apple/devices
```

Gibt Geräte zurück, die im Apple Developer-Konto registriert sind.

## Einstellungen

### Einstellungen abrufen

```
GET /admin/api/settings
```

Gibt aktuelle Systemeinstellungen zurück (Domains, Organisation, Speicher-Typ).

### Einstellungen aktualisieren

```
PUT /admin/api/settings
Content-Type: application/json
```

Aktualisierbare Felder umfassen:
- `primary_domain` -- Öffentliche URL für Manifeste und Callbacks
- `secondary_domains` -- CDN oder alternative Domains
- `organization` -- Organisationsname in iOS-Profilen
- `storage_type` -- `local` oder `s3`
- S3-Konfiguration (Endpunkt, Bucket, Schlüssel, öffentliche URL)
- Apple Developer API-Zugangsdaten

### Upload-Konfiguration abrufen

```
GET /admin/api/upload-config
```

Gibt die aktuelle Upload-Konfiguration einschließlich Speicher-Typ und Limits zurück.

## Exporte

Daten als CSV-Dateien für externe Analyse exportieren:

| Endpunkt | Daten |
|----------|-------|
| `GET /admin/exports/releases.csv` | Alle Releases mit Metadaten |
| `GET /admin/exports/events.csv` | Alle Events |
| `GET /admin/exports/ios_devices.csv` | Alle iOS-Geräte |

```bash
# Beispiel: Alle Releases exportieren
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Nächste Schritte

- [Upload-API](./upload) -- Upload-Endpunkt-Referenz
- [Konfiguration](../configuration/) -- Server-Konfigurationsoptionen
- [Produktions-Deployment](../deployment/production) -- Admin-API absichern

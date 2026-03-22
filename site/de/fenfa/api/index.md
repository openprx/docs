---
title: API-Übersicht
description: "Fenfa REST-API-Referenz. Token-basierte Authentifizierung, JSON-Antworten und Endpunkte für das Hochladen von Builds, die Verwaltung von Produkten und das Abfragen von Analysen."
---

# API-Übersicht

Fenfa stellt eine REST-API für das Hochladen von Builds, die Verwaltung von Produkten und das Abfragen von Analysen bereit. Alle programmatischen Interaktionen -- von CI/CD-Uploads bis zu Admin-Panel-Operationen -- laufen über diese API.

## Basis-URL

Alle API-Endpunkte sind relativ zur Fenfa-Server-URL:

```
https://ihre-domain.com
```

## Authentifizierung

Geschützte Endpunkte erfordern einen `X-Auth-Token`-Header. Fenfa verwendet zwei Token-Scopes:

| Scope | Kann | Header |
|-------|------|--------|
| `upload` | Builds hochladen | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | Vollständiger Admin-Zugriff (inkl. Upload) | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

Token werden in `config.json` oder über Umgebungsvariablen konfiguriert. Siehe [Konfiguration](../configuration/).

::: warning
Anfragen an geschützte Endpunkte ohne gültigen Token erhalten eine `401 Unauthorized`-Antwort.
:::

## Antwortformat

Alle JSON-Antworten folgen einer einheitlichen Struktur:

**Erfolg:**

```json
{
  "ok": true,
  "data": { ... }
}
```

**Fehler:**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Fehlercodes

| Code | HTTP-Status | Beschreibung |
|------|------------|-------------|
| `BAD_REQUEST` | 400 | Ungültige Anfrageparameter |
| `UNAUTHORIZED` | 401 | Fehlender oder ungültiger Auth-Token |
| `FORBIDDEN` | 403 | Token hat nicht den erforderlichen Scope |
| `NOT_FOUND` | 404 | Ressource nicht gefunden |
| `INTERNAL_ERROR` | 500 | Server-Fehler |

## Endpunkt-Übersicht

### Öffentliche Endpunkte (Keine Auth)

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | `/products/:slug` | Produkt-Download-Seite (HTML) |
| GET | `/d/:releaseID` | Direkter Datei-Download |
| GET | `/ios/:releaseID/manifest.plist` | iOS OTA-Manifest |
| GET | `/udid/profile.mobileconfig?variant=:id` | UDID-Bindungsprofil |
| POST | `/udid/callback` | UDID-Callback (von iOS) |
| GET | `/udid/status?variant=:id` | UDID-Bindungsstatus |
| GET | `/healthz` | Integritätsprüfung |

### Upload-Endpunkte (Upload-Token)

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | `/upload` | Build-Datei hochladen |

### Admin-Endpunkte (Admin-Token)

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| POST | `/admin/api/smart-upload` | Intelligenter Upload mit automatischer Erkennung |
| GET | `/admin/api/products` | Produkte auflisten |
| POST | `/admin/api/products` | Produkt erstellen |
| GET | `/admin/api/products/:id` | Produkt mit Varianten abrufen |
| PUT | `/admin/api/products/:id` | Produkt aktualisieren |
| DELETE | `/admin/api/products/:id` | Produkt löschen |
| POST | `/admin/api/products/:id/variants` | Variante erstellen |
| PUT | `/admin/api/variants/:id` | Variante aktualisieren |
| DELETE | `/admin/api/variants/:id` | Variante löschen |
| GET | `/admin/api/variants/:id/stats` | Varianten-Statistiken |
| DELETE | `/admin/api/releases/:id` | Release löschen |
| PUT | `/admin/api/apps/:id/publish` | App veröffentlichen |
| PUT | `/admin/api/apps/:id/unpublish` | App unveröffentlichen |
| GET | `/admin/api/events` | Events abfragen |
| GET | `/admin/api/ios_devices` | iOS-Geräte auflisten |
| POST | `/admin/api/devices/:id/register-apple` | Gerät bei Apple registrieren |
| POST | `/admin/api/devices/register-apple` | Geräte stapelweise registrieren |
| GET | `/admin/api/settings` | Einstellungen abrufen |
| PUT | `/admin/api/settings` | Einstellungen aktualisieren |
| GET | `/admin/api/upload-config` | Upload-Konfiguration abrufen |
| GET | `/admin/api/apple/status` | Apple API-Status |
| GET | `/admin/api/apple/devices` | Apple-registrierte Geräte |

### Export-Endpunkte (Admin-Token)

| Methode | Pfad | Beschreibung |
|---------|------|-------------|
| GET | `/admin/exports/releases.csv` | Releases exportieren |
| GET | `/admin/exports/events.csv` | Events exportieren |
| GET | `/admin/exports/ios_devices.csv` | iOS-Geräte exportieren |

## ID-Format

Alle Ressourcen-IDs verwenden ein Präfix + zufälliger String-Format:

| Präfix | Ressource |
|--------|----------|
| `prd_` | Produkt |
| `var_` | Variante |
| `rel_` | Release |
| `app_` | App (Legacy) |

## Detaillierte Referenzen

- [Upload-API](./upload) -- Upload-Endpunkt mit Feldreferenz und Beispielen
- [Admin-API](./admin) -- Vollständige Admin-Endpunkt-Dokumentation

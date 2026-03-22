---
title: Konfigurationsreferenz
description: "Vollständige Konfigurationsreferenz für Fenfa. Konfigurationsdatei-Optionen, Umgebungsvariablen, Speichereinstellungen und Apple Developer API-Zugangsdaten."
---

# Konfigurationsreferenz

Fenfa kann über eine `config.json`-Datei, Umgebungsvariablen oder das Admin-Panel (für Laufzeiteinstellungen wie Speicher und Apple API) konfiguriert werden.

## Konfigurationsvorrang

1. **Umgebungsvariablen** -- Höchste Priorität, überschreiben alles
2. **config.json-Datei** -- Beim Start geladen
3. **Standardwerte** -- Verwendet, wenn nichts angegeben ist

## Konfigurationsdatei

Eine `config.json` im Arbeitsverzeichnis erstellen (oder in Docker einbinden):

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "Your Company Name",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## Server-Einstellungen

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `server.port` | string | `"8000"` | HTTP-Listen-Port |
| `server.primary_domain` | string | `"http://localhost:8000"` | Öffentliche URL für Manifeste, Callbacks und Download-Links |
| `server.secondary_domains` | string[] | `[]` | Zusätzliche Domains (CDN, alternativer Zugriff) |
| `server.organization` | string | `"Fenfa Distribution"` | Organisationsname in iOS Mobile-Config-Profilen angezeigt |
| `server.bundle_id_prefix` | string | `""` | Bundle-ID-Präfix für generierte Profile |
| `server.data_dir` | string | `"data"` | Verzeichnis für SQLite-Datenbank |
| `server.db_path` | string | `"data/fenfa.db"` | Expliziter Datenbankdatei-Pfad |
| `server.dev_proxy_front` | string | `""` | Vite-Dev-Server-URL für öffentliche Seite (nur Entwicklung) |
| `server.dev_proxy_admin` | string | `""` | Vite-Dev-Server-URL für Admin-Panel (nur Entwicklung) |

::: warning Primary Domain
Die Einstellung `primary_domain` ist kritisch für iOS OTA-Distribution. Es muss die HTTPS-URL sein, auf die Endbenutzer zugreifen. iOS-Manifest-Dateien verwenden diese URL für Download-Links, und UDID-Callbacks leiten auf diese Domain um.
:::

## Authentifizierung

| Schlüssel | Typ | Standard | Beschreibung |
|-----------|-----|---------|-------------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | Token für die Upload-API |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | Token für die Admin-API (inkl. Upload-Berechtigung) |

::: danger Standard-Token ändern
Die Standard-Token (`dev-upload-token` und `dev-admin-token`) sind nur für die Entwicklung. Vor dem Produktions-Deployment immer ändern.
:::

Für jeden Scope werden mehrere Token unterstützt, sodass verschiedene Token an verschiedene CI/CD-Pipelines oder Teammitglieder ausgegeben und einzeln widerrufen werden können.

## Umgebungsvariablen

Konfigurationswerte mit Umgebungsvariablen überschreiben:

| Variable | Konfig-Äquivalent | Beschreibung |
|----------|------------------|-------------|
| `FENFA_PORT` | `server.port` | HTTP-Listen-Port |
| `FENFA_DATA_DIR` | `server.data_dir` | Datenbankverzeichnis |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | Öffentliche Domain-URL |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | Admin-Token (ersetzt den ersten Token) |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | Upload-Token (ersetzt den ersten Token) |

Beispiel:

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## Speicher-Konfiguration

### Lokaler Speicher (Standard)

Dateien werden unter `uploads/{product_id}/{variant_id}/{release_id}/filename.ext` relativ zum Arbeitsverzeichnis gespeichert. Keine zusätzliche Konfiguration erforderlich.

### S3-kompatibler Speicher

S3-Speicher im Admin-Panel unter **Einstellungen > Speicher** oder über die API konfigurieren:

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

Unterstützte Provider:
- **Cloudflare R2** -- Keine Egress-Gebühren, S3-kompatibel
- **AWS S3** -- Standard-S3
- **MinIO** -- Selbst gehosteter S3-kompatibler Speicher
- Jeder S3-kompatible Provider

::: tip Upload-Domain
Wenn die primäre Domain CDN-Limits für Dateigrößen hat, eine separate `upload_domain` konfigurieren, die CDN-Beschränkungen für große Datei-Uploads umgeht.
:::

## Apple Developer API

Apple Developer API-Zugangsdaten für automatische Geräteregistrierung konfigurieren. Im Admin-Panel unter **Einstellungen > Apple Developer API** oder über die API setzen:

| Feld | Beschreibung |
|------|-------------|
| `apple_key_id` | API-Schlüssel-ID aus App Store Connect |
| `apple_issuer_id` | Aussteller-ID (UUID-Format) |
| `apple_private_key` | PEM-Format privater Schlüsselinhalt |
| `apple_team_id` | Apple Developer Team-ID |

Setup-Anweisungen finden sich in der [iOS-Distribution](../distribution/ios).

## Datenbank

Fenfa verwendet SQLite via GORM. Die Datenbankdatei wird automatisch am konfigurierten `db_path` erstellt. Migrationen werden automatisch beim Start ausgeführt.

::: info Backup
Für ein Fenfa-Backup die SQLite-Datenbankdatei und das `uploads/`-Verzeichnis kopieren. Bei S3-Speicher muss nur die Datenbankdatei lokal gesichert werden.
:::

## Entwicklungseinstellungen

Für lokale Entwicklung mit Hot-Reload:

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

Wenn `dev_proxy_front` oder `dev_proxy_admin` gesetzt ist, leitet Fenfa Anfragen an den Vite-Entwicklungsserver weiter, anstatt das eingebettete Frontend bereitzustellen. Dies ermöglicht Hot-Module-Replacement während der Entwicklung.

## Nächste Schritte

- [Docker-Deployment](../deployment/docker) -- Docker-Konfiguration und Volumes
- [Produktions-Deployment](../deployment/production) -- Reverse Proxy und Sicherheitshärtung
- [API-Übersicht](../api/) -- API-Authentifizierungsdetails

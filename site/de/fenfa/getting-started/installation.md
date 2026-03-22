---
title: Installation
description: "Fenfa mit Docker, Docker Compose installieren oder aus dem Quellcode mit Go und Node.js bauen."
---

# Installation

Fenfa unterstützt zwei Installationsmethoden: Docker (empfohlen) und Bauen aus dem Quellcode.

::: tip Empfohlen
**Docker** ist der schnellste Einstieg. Ein einziger Befehl liefert eine vollständig funktionierende Fenfa-Instanz ohne Build-Tools.
:::

## Voraussetzungen

| Anforderung | Minimum | Hinweise |
|-------------|---------|---------|
| Docker | 20.10+ | Oder Podman 3.0+ |
| Go (nur Quellcode-Build) | 1.25+ | Für Docker nicht benötigt |
| Node.js (nur Quellcode-Build) | 20+ | Zum Bauen des Frontends |
| Speicherplatz | 100 MB | Zuzüglich Speicher für hochgeladene Builds |

## Methode 1: Docker (Empfohlen)

Das offizielle Image pullen und ausführen:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  fenfa/fenfa:latest
```

`http://localhost:8000/admin` besuchen und mit dem Standard-Token `dev-admin-token` anmelden.

::: warning Sicherheit
Die Standard-Token sind nur für die Entwicklung. Sichere Token konfigurieren, bevor Fenfa dem Internet ausgesetzt wird. Siehe [Produktions-Deployment](../deployment/production).
:::

### Mit persistentem Speicher

Volumes für die Datenbank und hochgeladene Dateien einbinden:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Mit benutzerdefinierter Konfiguration

Eine `config.json`-Datei für vollständige Kontrolle über alle Einstellungen einbinden:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -v ./config.json:/app/config.json:ro \
  fenfa/fenfa:latest
```

Alle verfügbaren Optionen finden sich in der [Konfigurationsreferenz](../configuration/).

### Umgebungsvariablen

Konfigurationswerte ohne Konfigurationsdatei überschreiben:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -e FENFA_ADMIN_TOKEN=your-secret-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-secret-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://dist.example.com \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

| Variable | Beschreibung | Standard |
|----------|-------------|---------|
| `FENFA_PORT` | HTTP-Port | `8000` |
| `FENFA_DATA_DIR` | Datenbankverzeichnis | `data` |
| `FENFA_PRIMARY_DOMAIN` | Öffentliche Domain-URL | `http://localhost:8000` |
| `FENFA_ADMIN_TOKEN` | Admin-Token | `dev-admin-token` |
| `FENFA_UPLOAD_TOKEN` | Upload-Token | `dev-upload-token` |

## Methode 2: Docker Compose

Eine `docker-compose.yml` erstellen:

```yaml
version: "3.8"
services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: your-secret-admin-token
      FENFA_UPLOAD_TOKEN: your-secret-upload-token
      FENFA_PRIMARY_DOMAIN: https://dist.example.com
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
```

Dienst starten:

```bash
docker compose up -d
```

## Methode 3: Aus dem Quellcode bauen

Repository klonen:

```bash
git clone https://github.com/openprx/fenfa.git
cd fenfa
```

### Mit Make

Das Makefile automatisiert den vollständigen Build:

```bash
make build   # baut Frontend + Backend
make run     # startet den Server
```

### Manueller Build

Zuerst die Frontend-Anwendungen bauen, dann das Go-Backend:

```bash
# Öffentliche Download-Seite bauen
cd web/front && npm ci && npm run build && cd ../..

# Admin-Panel bauen
cd web/admin && npm ci && npm run build && cd ../..

# Go-Binary bauen
go build -o fenfa ./cmd/server
```

Das Frontend wird in `internal/web/dist/` kompiliert und über `go:embed` in das Go-Binary eingebettet. Das resultierende `fenfa`-Binary ist vollständig eigenständig.

### Binary ausführen

```bash
./fenfa
```

Fenfa startet standardmäßig auf Port 8000. Die SQLite-Datenbank wird automatisch im `data/`-Verzeichnis erstellt.

## Installation verifizieren

Browser auf `http://localhost:8000/admin` öffnen und mit dem Admin-Token anmelden. Das Admin-Dashboard sollte angezeigt werden.

Den Health-Endpunkt prüfen:

```bash
curl http://localhost:8000/healthz
```

Erwartete Antwort:

```json
{"ok": true}
```

## Nächste Schritte

- [Schnellstart](./quickstart) -- Ersten Build in 5 Minuten hochladen
- [Konfigurationsreferenz](../configuration/) -- Alle Konfigurationsoptionen
- [Docker-Deployment](../deployment/docker) -- Docker Compose und Multi-Architektur-Builds

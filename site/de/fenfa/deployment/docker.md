---
title: Docker-Deployment
description: "Fenfa mit Docker und Docker Compose bereitstellen. Container-Konfiguration, Volumes, Multi-Architektur-Builds und Health Checks."
---

# Docker-Deployment

Fenfa wird als einzelnes Docker-Image ausgeliefert, das das Go-Binary mit eingebettetem Frontend enthält. Es werden keine zusätzlichen Container benötigt -- einfach Volumes für persistente Daten einbinden.

## Schnellstart

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

## Docker Compose

Eine `docker-compose.yml` erstellen:

```yaml
version: "3.8"

services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN:-http://localhost:8000}
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  fenfa-data:
  fenfa-uploads:
```

Eine `.env`-Datei neben der Compose-Datei erstellen:

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

Dienst starten:

```bash
docker compose up -d
```

## Volumes

| Einhängepunkt | Zweck | Backup erforderlich |
|--------------|-------|---------------------|
| `/data` | SQLite-Datenbank | Ja |
| `/app/uploads` | Hochgeladene Binärdateien | Ja (außer bei S3) |
| `/app/config.json` | Konfigurationsdatei (optional) | Ja |

::: warning Datenpersistenz
Ohne Volume-Einbindungen gehen alle Daten verloren, wenn der Container neu erstellt wird. Für den Produktionseinsatz immer `/data` und `/app/uploads` einbinden.
:::

## Konfigurationsdatei verwenden

Konfigurationsdatei für vollständige Kontrolle einbinden:

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## Health Check

Fenfa stellt einen Health-Endpunkt unter `/healthz` bereit:

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

Das obige Docker-Compose-Beispiel enthält eine Health-Check-Konfiguration. Für Orchestratoren wie Kubernetes oder Nomad diesen Endpunkt für Liveness- und Readiness-Probes verwenden.

## Multi-Architektur

Das Docker-Image von Fenfa unterstützt sowohl `linux/amd64` als auch `linux/arm64`. Docker pullt automatisch die richtige Architektur für den Host.

Um Multi-Architektur-Images selbst zu bauen:

```bash
./scripts/docker-build.sh
```

Dabei wird Docker Buildx verwendet, um Images für beide Architekturen zu erstellen.

## Ressourcenanforderungen

Fenfa ist leichtgewichtig:

| Ressource | Minimum | Empfohlen |
|-----------|---------|-----------|
| CPU | 1 Kern | 2 Kerne |
| RAM | 64 MB | 256 MB |
| Speicher | 100 MB (App) | Abhängig von hochgeladenen Dateien |

Die SQLite-Datenbank und das Go-Binary haben minimalen Overhead. Die Ressourcennutzung skaliert hauptsächlich mit Upload-Speicher und gleichzeitigen Verbindungen.

## Protokolle

Container-Protokolle anzeigen:

```bash
docker logs -f fenfa
```

Fenfa protokolliert im strukturierten Format nach stdout, kompatibel mit Log-Aggregations-Tools.

## Aktualisieren

```bash
docker compose pull
docker compose up -d
```

::: tip Zero-Downtime-Updates
Fenfa startet schnell (< 1 Sekunde). Für nahezu unterbrechungsfreie Updates einen Reverse-Proxy-Health-Check verwenden, der Traffic automatisch zum neuen Container leitet, sobald er den Health-Check besteht.
:::

## Nächste Schritte

- [Produktions-Deployment](./production) -- Reverse Proxy, TLS und Sicherheit
- [Konfigurationsreferenz](../configuration/) -- Alle Konfigurationsoptionen
- [Fehlerbehebung](../troubleshooting/) -- Häufige Docker-Probleme

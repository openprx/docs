---
title: prx gateway
description: Startet den eigenständigen HTTP/WebSocket-Gateway-Server ohne Kanäle oder Cron.
---

# prx gateway

Startet den HTTP/WebSocket-Gateway-Server als eigenständigen Prozess. Anders als [`prx daemon`](./daemon) startet dieser Befehl nur das Gateway -- keine Kanäle, keinen Cron-Scheduler und keine Entwicklungs-Engine.

Dies ist nützlich für Bereitstellungen, bei denen Sie die PRX-API verfügbar machen möchten, ohne den vollständigen Daemon, oder wenn Sie Kanäle und Scheduling als separate Prozesse ausführen.

## Verwendung

```bash
prx gateway [OPTIONS]
```

## Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Pfad zur Konfigurationsdatei |
| `--port` | `-p` | `3120` | Lauschport |
| `--host` | `-H` | `127.0.0.1` | Bindungsadresse |
| `--log-level` | `-l` | `info` | Log-Ausführlichkeit: `trace`, `debug`, `info`, `warn`, `error` |
| `--cors-origin` | | `*` | Erlaubte CORS-Ursprünge (kommagetrennt) |
| `--tls-cert` | | | Pfad zur TLS-Zertifikatsdatei |
| `--tls-key` | | | Pfad zur TLS-Privatschlüsseldatei |

## Endpunkte

Das Gateway stellt folgende Endpunktgruppen bereit:

| Pfad | Methode | Beschreibung |
|------|---------|-------------|
| `/health` | GET | Gesundheitscheck (gibt `200 OK` zurück) |
| `/api/v1/chat` | POST | Chat-Nachricht senden |
| `/api/v1/chat/stream` | POST | Chat-Nachricht senden (Streaming SSE) |
| `/api/v1/sessions` | GET, POST | Sitzungsverwaltung |
| `/api/v1/sessions/:id` | GET, DELETE | Einzelne Sitzungsoperationen |
| `/api/v1/tools` | GET | Verfügbare Werkzeuge auflisten |
| `/api/v1/memory` | GET, POST | Gedächtnisoperationen |
| `/ws` | WS | WebSocket-Endpunkt für Echtzeitkommunikation |
| `/webhooks/:channel` | POST | Eingehender Webhook-Empfänger für Kanäle |

Siehe [Gateway HTTP-API](/de/prx/gateway/http-api) und [Gateway WebSocket](/de/prx/gateway/websocket) für die vollständige API-Dokumentation.

## Beispiele

```bash
# Auf Standardport starten
prx gateway

# An alle Schnittstellen auf Port 8080 binden
prx gateway --host 0.0.0.0 --port 8080

# Mit TLS
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# CORS einschränken
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# Debug-Logging
prx gateway --log-level debug
```

## Hinter einem Reverse-Proxy

In der Produktion platzieren Sie das Gateway hinter einem Reverse-Proxy (Nginx, Caddy usw.) für TLS-Terminierung und Lastverteilung:

```
# Caddy-Beispiel
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# Nginx-Beispiel
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Signale

| Signal | Verhalten |
|--------|-----------|
| `SIGHUP` | Konfiguration neu laden |
| `SIGTERM` | Ordnungsgemäßes Herunterfahren (beendet laufende Anfragen) |

## Verwandte Themen

- [prx daemon](./daemon) -- vollständige Laufzeit (Gateway + Kanäle + Cron + Evolution)
- [Gateway-Übersicht](/de/prx/gateway/) -- Gateway-Architektur
- [Gateway HTTP-API](/de/prx/gateway/http-api) -- REST-API-Referenz
- [Gateway WebSocket](/de/prx/gateway/websocket) -- WebSocket-Protokoll

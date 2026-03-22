---
title: Installation
description: "OpenPR mit Docker Compose, Podman oder durch Erstellen aus dem Quellcode mit Rust und Node.js installieren."
---

# Installation

OpenPR unterstützt drei Installationsmethoden. Docker Compose ist der schnellste Weg zu einer vollständig funktionsfähigen Instanz.

::: tip Empfohlen
**Docker Compose** startet alle Dienste (API, Frontend, Worker, MCP-Server, PostgreSQL) mit einem einzigen Befehl. Keine Rust-Toolchain oder Node.js erforderlich.
:::

## Voraussetzungen

| Anforderung | Minimum | Hinweise |
|-------------|---------|---------|
| Docker | 20.10+ | Oder Podman 3.0+ mit podman-compose |
| Docker Compose | 2.0+ | In Docker Desktop enthalten |
| Rust (Quellcode-Build) | 1.75.0 | Nicht für Docker-Installation benötigt |
| Node.js (Quellcode-Build) | 20+ | Für das Erstellen des SvelteKit-Frontends |
| PostgreSQL (Quellcode-Build) | 15+ | Docker-Methode enthält PostgreSQL |
| Festplattenspeicher | 500 MB | Images + Datenbank |
| RAM | 1 GB | 2 GB+ empfohlen für Produktion |

## Methode 1: Docker Compose (Empfohlen)

Repository klonen und alle Dienste starten:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

Dies startet fünf Dienste:

| Dienst | Container | Port | Beschreibung |
|--------|-----------|------|-------------|
| PostgreSQL | `openpr-postgres` | 5432 | Datenbank mit automatischer Migration |
| API | `openpr-api` | 8081 (mapped zu 8080) | REST-API-Server |
| Worker | `openpr-worker` | -- | Hintergrundaufgaben-Prozessor |
| MCP-Server | `openpr-mcp-server` | 8090 | MCP-Tool-Server |
| Frontend | `openpr-frontend` | 3000 | SvelteKit Web-UI |

Verifizieren, dass alle Dienste laufen:

```bash
docker-compose ps
```

::: warning Erster Benutzer
Der erste registrierte Benutzer wird automatisch zum **Admin**. Das Admin-Konto registrieren, bevor die URL mit anderen geteilt wird.
:::

### Umgebungsvariablen

`.env` bearbeiten, um die Bereitstellung anzupassen:

```bash
# Datenbank
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (in Produktion ändern!)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# MCP-Server
MCP_SERVER_PORT=8090
```

::: danger Sicherheit
`JWT_SECRET` und Datenbankpasswörter immer vor der Bereitstellung in der Produktion ändern. Starke, zufällige Werte verwenden.
:::

## Methode 2: Podman

OpenPR funktioniert mit Podman als Docker-Alternative. Der wesentliche Unterschied besteht darin, dass Podman `--network=host` für Builds aufgrund der DNS-Auflösung benötigt:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# Images mit Netzwerkzugang erstellen
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# Dienste starten
sudo podman-compose up -d
```

::: tip Podman DNS
Der Frontend-Nginx-Container verwendet `10.89.0.1` als DNS-Resolver (Podmans Standard-Netzwerk-DNS), nicht `127.0.0.11` (Dockers Standard). Dies ist bereits in der enthaltenen Nginx-Konfiguration eingestellt.
:::

## Methode 3: Aus dem Quellcode erstellen

### Backend

```bash
# Voraussetzungen: Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# Konfigurieren
cp .env.example .env
# .env mit der PostgreSQL-Verbindungszeichenfolge bearbeiten

# Alle Binärdateien erstellen
cargo build --release -p api -p worker -p mcp-server
```

Die Binärdateien befinden sich unter:
- `target/release/api` -- REST-API-Server
- `target/release/worker` -- Hintergrundworker
- `target/release/mcp-server` -- MCP-Tool-Server

### Frontend

```bash
cd frontend
npm install    # oder: bun install
npm run build  # oder: bun run build
```

Die Build-Ausgabe befindet sich in `frontend/build/`. Mit Nginx oder einem beliebigen statischen Dateiserver bereitstellen.

### Datenbank einrichten

Datenbank erstellen und Migrationen ausführen:

```bash
# Datenbank erstellen
createdb -U postgres openpr

# Migrationen laufen automatisch beim ersten API-Start
# Oder manuell anwenden:
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... verbleibende Migrationen der Reihe nach anwenden
```

### Dienste starten

```bash
# Terminal 1: API-Server
./target/release/api

# Terminal 2: Worker
./target/release/worker

# Terminal 3: MCP-Server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## Installation verifizieren

Sobald alle Dienste laufen, jeden Endpunkt verifizieren:

```bash
# API-Health-Check
curl http://localhost:8080/health

# MCP-Server-Health
curl http://localhost:8090/health

# Frontend
curl -s http://localhost:3000 | head -5
```

http://localhost:3000 im Browser öffnen, um auf die Web-UI zuzugreifen.

## Deinstallation

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v entfernt Volumes (Datenbankdaten)
docker rmi $(docker images 'openpr*' -q)
```

### Quellcode-Build

```bash
# Laufende Dienste stoppen (Strg+C in jedem Terminal)
# Binärdateien entfernen
rm -f target/release/api target/release/worker target/release/mcp-server

# Datenbank löschen (optional)
dropdb -U postgres openpr
```

## Nächste Schritte

- [Schnellstart](./quickstart) -- Ersten Arbeitsbereich und Projekt in 5 Minuten erstellen
- [Docker-Bereitstellung](../deployment/docker) -- Produktions-Docker-Konfiguration
- [Produktionsbereitstellung](../deployment/production) -- Caddy, PostgreSQL und Sicherheitshärtung

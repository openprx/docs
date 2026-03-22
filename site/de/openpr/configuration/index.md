---
title: Konfigurationsreferenz
description: "Vollständige Referenz für alle OpenPR-Umgebungsvariablen und Konfigurationsoptionen für API, Worker, MCP-Server, Frontend und Datenbank."
---

# Konfigurationsreferenz

OpenPR wird über Umgebungsvariablen konfiguriert. Alle Dienste lesen aus derselben `.env`-Datei bei Verwendung von Docker Compose oder aus einzelnen Umgebungsvariablen bei direktem Betrieb.

## API-Server

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `APP_NAME` | `api` | Anwendungsbezeichner für Protokollierung |
| `BIND_ADDR` | `0.0.0.0:8080` | Adresse und Port, auf dem die API lauscht |
| `DATABASE_URL` | -- | PostgreSQL-Verbindungszeichenfolge |
| `JWT_SECRET` | `change-me-in-production` | Geheimschlüssel zum Signieren von JWT-Tokens |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 Tage) | Zugriffstoken-Lebensdauer in Sekunden |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 Tage) | Aktualisierungstoken-Lebensdauer in Sekunden |
| `RUST_LOG` | `info` | Protokollstufe (trace, debug, info, warn, error) |
| `UPLOAD_DIR` | `/app/uploads` | Verzeichnis für Datei-Uploads |

::: danger Sicherheit
`JWT_SECRET` immer auf einen starken, zufälligen Wert in der Produktion ändern. Mindestens 32 Zeichen zufälliger Daten verwenden:
```bash
openssl rand -hex 32
```
:::

## Datenbank

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `DATABASE_URL` | -- | Vollständige PostgreSQL-Verbindungszeichenfolge |
| `POSTGRES_DB` | `openpr` | Datenbankname |
| `POSTGRES_USER` | `openpr` | Datenbankbenutzer |
| `POSTGRES_PASSWORD` | `openpr` | Datenbankpasswort |

Format der Verbindungszeichenfolge:

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
Bei Verwendung von Docker Compose heißt der Datenbankdienst `postgres`, also lautet die Verbindungszeichenfolge:
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## Worker

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `APP_NAME` | `worker` | Anwendungsbezeichner |
| `DATABASE_URL` | -- | PostgreSQL-Verbindungszeichenfolge |
| `JWT_SECRET` | -- | Muss mit dem API-Server-Wert übereinstimmen |
| `RUST_LOG` | `info` | Protokollstufe |

Der Worker verarbeitet Hintergrundaufgaben aus den Tabellen `job_queue` und `scheduled_jobs`.

## MCP-Server

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `APP_NAME` | `mcp-server` | Anwendungsbezeichner |
| `OPENPR_API_URL` | -- | API-Server-URL (einschließlich Proxy, falls zutreffend) |
| `OPENPR_BOT_TOKEN` | -- | Bot-Token mit `opr_`-Präfix |
| `OPENPR_WORKSPACE_ID` | -- | Standard-Arbeitsbereichs-UUID |
| `DATABASE_URL` | -- | PostgreSQL-Verbindungszeichenfolge |
| `JWT_SECRET` | -- | Muss mit dem API-Server-Wert übereinstimmen |
| `DEFAULT_AUTHOR_ID` | -- | Fallback-Autor-UUID für MCP-Operationen |
| `RUST_LOG` | `info` | Protokollstufe |

### MCP-Transport-Optionen

Das MCP-Server-Binary akzeptiert Befehlszeilenargumente:

```bash
# HTTP-Modus (Standard)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# stdio-Modus (für Claude Desktop, Codex)
mcp-server --transport stdio

# Unterbefehlsform
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## Frontend

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | API-Server-URL, mit der sich das Frontend verbindet |

::: tip Reverse-Proxy
In der Produktion mit einem Reverse-Proxy (Caddy/Nginx) sollte `VITE_API_URL` auf die Proxy-URL zeigen, die zum API-Server weiterleitet.
:::

## Docker-Compose-Ports

| Dienst | Interner Port | Externer Port | Zweck |
|--------|---------------|---------------|-------|
| PostgreSQL | 5432 | 5432 | Datenbank |
| API | 8080 | 8081 | REST-API |
| Worker | -- | -- | Hintergrundaufgaben (kein Port) |
| MCP-Server | 8090 | 8090 | MCP-Tools |
| Frontend | 80 | 3000 | Web-UI |

## Beispiel-.env-Datei

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# API Server
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

## Protokollstufen

OpenPR verwendet das `tracing`-Crate für strukturierte Protokollierung. `RUST_LOG` setzen, um die Ausführlichkeit zu steuern:

| Stufe | Beschreibung |
|-------|-------------|
| `error` | Nur Fehler |
| `warn` | Fehler und Warnungen |
| `info` | Normale Betriebsmeldungen (Standard) |
| `debug` | Detaillierte Debugging-Informationen |
| `trace` | Sehr ausführlich, enthält alle internen Operationen |

Modulspezifische Filterung wird unterstützt:

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## Nächste Schritte

- [Docker-Bereitstellung](../deployment/docker) -- Docker-Compose-Konfiguration
- [Produktionsbereitstellung](../deployment/production) -- Caddy, Sicherheit und Skalierung
- [Installation](../getting-started/installation) -- Erste Schritte

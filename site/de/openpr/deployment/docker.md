---
title: Docker-Bereitstellung
description: "OpenPR mit Docker Compose oder Podman bereitstellen. Enthält Dienstkonfiguration, Netzwerk, Volumes und Integritätsprüfungen."
---

# Docker-Bereitstellung

OpenPR bietet eine `docker-compose.yml`, die alle erforderlichen Dienste mit einem einzigen Befehl startet.

## Schnellstart

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# .env mit Produktionswerten bearbeiten
docker-compose up -d
```

## Dienst-Architektur

```mermaid
graph LR
    subgraph Docker["Docker-Netzwerk (openpr-network)"]
        PG["PostgreSQL<br/>:5432"]
        API["API-Server<br/>:8080"]
        WORKER["Worker"]
        MCP["MCP-Server<br/>:8090"]
        FE["Frontend<br/>:80"]
    end

    PG --> API
    PG --> WORKER
    API --> MCP
    API --> FE

    USER["Benutzer<br/>Browser"] -->|":3000"| FE
    AIBOT["KI-Assistenten"] -->|":8090"| MCP
```

## Dienste

### PostgreSQL

```yaml
postgres:
  image: postgres:16
  container_name: openpr-postgres
  environment:
    POSTGRES_DB: openpr
    POSTGRES_USER: openpr
    POSTGRES_PASSWORD: openpr
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./migrations:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U openpr -d openpr"]
    interval: 5s
    timeout: 3s
    retries: 20
```

Migrationen im Verzeichnis `migrations/` werden beim ersten Start automatisch über den PostgreSQL-Mechanismus `docker-entrypoint-initdb.d` ausgeführt.

### API-Server

```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: api
  container_name: openpr-api
  environment:
    BIND_ADDR: 0.0.0.0:8080
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
    JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    UPLOAD_DIR: /app/uploads
  ports:
    - "8081:8080"
  volumes:
    - ./uploads:/app/uploads
  depends_on:
    postgres:
      condition: service_healthy
```

### Worker

```yaml
worker:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: worker
  container_name: openpr-worker
  environment:
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
  depends_on:
    postgres:
      condition: service_healthy
```

Der Worker hat keine exponierten Ports -- er verbindet sich direkt mit PostgreSQL, um Hintergrundjobs zu verarbeiten.

### MCP-Server

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  container_name: openpr-mcp-server
  environment:
    OPENPR_API_URL: http://api:8080
    OPENPR_BOT_TOKEN: opr_your_token
    OPENPR_WORKSPACE_ID: your-workspace-uuid
  command: ["./mcp-server", "serve", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
  ports:
    - "8090:8090"
  depends_on:
    api:
      condition: service_healthy
```

### Frontend

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: openpr-frontend
  ports:
    - "3000:80"
  depends_on:
    api:
      condition: service_healthy
```

## Volumes

| Volume | Zweck |
|--------|-------|
| `pgdata` | PostgreSQL-Datenpersistenz |
| `./uploads` | Datei-Upload-Speicher |
| `./migrations` | Datenbankmigrierungsskripte |

## Integritätsprüfungen

Alle Dienste enthalten Integritätsprüfungen:

| Dienst | Prüfung | Intervall |
|--------|---------|-----------|
| PostgreSQL | `pg_isready` | 5s |
| API | `curl /health` | 10s |
| MCP-Server | `curl /health` | 10s |
| Frontend | `wget /health` | 30s |

## Allgemeine Operationen

```bash
# Protokolle anzeigen
docker-compose logs -f api
docker-compose logs -f mcp-server

# Einen Dienst neu starten
docker-compose restart api

# Neu erstellen und neu starten
docker-compose up -d --build api

# Alle Dienste stoppen
docker-compose down

# Stoppen und Volumes entfernen (WARNUNG: löscht Datenbank)
docker-compose down -v

# Mit der Datenbank verbinden
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

Für Podman-Benutzer sind die wichtigsten Unterschiede:

1. Mit `--network=host` für DNS-Zugriff erstellen:
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. Frontend-Nginx verwendet `10.89.0.1` als DNS-Resolver (Podman-Standard) anstelle von `127.0.0.11` (Docker-Standard).

3. `sudo podman-compose` anstelle von `docker-compose` verwenden.

## Nächste Schritte

- [Produktionsbereitstellung](./production) -- Caddy-Reverse-Proxy, HTTPS und Sicherheit
- [Konfiguration](../configuration/) -- Umgebungsvariablen-Referenz
- [Fehlerbehebung](../troubleshooting/) -- Häufige Docker-Probleme

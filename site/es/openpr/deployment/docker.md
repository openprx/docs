---
title: Despliegue con Docker
description: "Despliega OpenPR con Docker Compose o Podman. Incluye configuración de servicios, redes, volúmenes y verificaciones de estado."
---

# Despliegue con Docker

OpenPR proporciona un `docker-compose.yml` que levanta todos los servicios requeridos con un único comando.

## Inicio Rápido

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

## Arquitectura de Servicios

```mermaid
graph LR
    subgraph Docker["Red Docker (openpr-network)"]
        PG["PostgreSQL<br/>:5432"]
        API["Servidor API<br/>:8080"]
        WORKER["Worker"]
        MCP["Servidor MCP<br/>:8090"]
        FE["Frontend<br/>:80"]
    end

    PG --> API
    PG --> WORKER
    API --> MCP
    API --> FE

    USER["Usuarios<br/>Navegador"] -->|":3000"| FE
    AIBOT["Asistentes IA"] -->|":8090"| MCP
```

## Servicios

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

Las migraciones en el directorio `migrations/` se ejecutan automáticamente en el primer inicio a través del mecanismo `docker-entrypoint-initdb.d` de PostgreSQL.

### Servidor API

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

El worker no tiene puertos expuestos -- se conecta directamente a PostgreSQL para procesar trabajos en segundo plano.

### Servidor MCP

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

## Volúmenes

| Volumen | Propósito |
|---------|---------|
| `pgdata` | Persistencia de datos de PostgreSQL |
| `./uploads` | Almacenamiento de archivos subidos |
| `./migrations` | Scripts de migración de base de datos |

## Verificaciones de Estado

Todos los servicios incluyen verificaciones de estado:

| Servicio | Verificación | Intervalo |
|---------|-------|----------|
| PostgreSQL | `pg_isready` | 5s |
| API | `curl /health` | 10s |
| Servidor MCP | `curl /health` | 10s |
| Frontend | `wget /health` | 30s |

## Operaciones Comunes

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f mcp-server

# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build api

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Connect to database
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

Para usuarios de Podman, las diferencias clave son:

1. Compila con `--network=host` para acceso DNS:
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. El Nginx del frontend usa `10.89.0.1` como resolver DNS (predeterminado de Podman) en lugar de `127.0.0.11` (predeterminado de Docker).

3. Usa `sudo podman-compose` en lugar de `docker-compose`.

## Próximos Pasos

- [Despliegue en Producción](./production) -- Proxy inverso Caddy, HTTPS y seguridad
- [Configuración](../configuration/) -- Referencia de variables de entorno
- [Resolución de Problemas](../troubleshooting/) -- Problemas comunes con Docker

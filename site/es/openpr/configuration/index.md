---
title: Referencia de Configuración
description: "Referencia completa de todas las variables de entorno y opciones de configuración de OpenPR para API, worker, servidor MCP, frontend y base de datos."
---

# Referencia de Configuración

OpenPR se configura a través de variables de entorno. Todos los servicios leen del mismo archivo `.env` cuando se usa Docker Compose, o variables de entorno individuales cuando se ejecutan directamente.

## Servidor API

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `APP_NAME` | `api` | Identificador de la aplicación para registro |
| `BIND_ADDR` | `0.0.0.0:8080` | Dirección y puerto en que escucha la API |
| `DATABASE_URL` | -- | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | `change-me-in-production` | Clave secreta para firmar tokens JWT |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 días) | Tiempo de vida del token de acceso en segundos |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 días) | Tiempo de vida del token de actualización en segundos |
| `RUST_LOG` | `info` | Nivel de registro (trace, debug, info, warn, error) |
| `UPLOAD_DIR` | `/app/uploads` | Directorio para subidas de archivos |

::: danger Seguridad
Siempre cambia `JWT_SECRET` a un valor fuerte y aleatorio en producción. Usa al menos 32 caracteres de datos aleatorios:
```bash
openssl rand -hex 32
```
:::

## Base de Datos

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `DATABASE_URL` | -- | Cadena de conexión PostgreSQL completa |
| `POSTGRES_DB` | `openpr` | Nombre de la base de datos |
| `POSTGRES_USER` | `openpr` | Usuario de la base de datos |
| `POSTGRES_PASSWORD` | `openpr` | Contraseña de la base de datos |

Formato de la cadena de conexión:

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
Cuando se usa Docker Compose, el servicio de base de datos se llama `postgres`, por lo que la cadena de conexión es:
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## Worker

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `APP_NAME` | `worker` | Identificador de la aplicación |
| `DATABASE_URL` | -- | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | -- | Debe coincidir con el valor del servidor API |
| `RUST_LOG` | `info` | Nivel de registro |

El worker procesa tareas en segundo plano de las tablas `job_queue` y `scheduled_jobs`.

## Servidor MCP

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `APP_NAME` | `mcp-server` | Identificador de la aplicación |
| `OPENPR_API_URL` | -- | URL del servidor API (incluyendo proxy si aplica) |
| `OPENPR_BOT_TOKEN` | -- | Token de bot con prefijo `opr_` |
| `OPENPR_WORKSPACE_ID` | -- | UUID del espacio de trabajo predeterminado |
| `DATABASE_URL` | -- | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | -- | Debe coincidir con el valor del servidor API |
| `DEFAULT_AUTHOR_ID` | -- | UUID del autor de reserva para operaciones MCP |
| `RUST_LOG` | `info` | Nivel de registro |

### Opciones de Transporte MCP

El binario del servidor MCP acepta argumentos de línea de comandos:

```bash
# HTTP mode (default)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# stdio mode (for Claude Desktop, Codex)
mcp-server --transport stdio

# Subcommand form
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## Frontend

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | URL del servidor API para que el frontend se conecte |

::: tip Proxy Inverso
En producción con un proxy inverso (Caddy/Nginx), `VITE_API_URL` debe apuntar a la URL del proxy que enruta al servidor API.
:::

## Puertos de Docker Compose

| Servicio | Puerto Interno | Puerto Externo | Propósito |
|---------|---------------|----------------|---------|
| PostgreSQL | 5432 | 5432 | Base de datos |
| API | 8080 | 8081 | API REST |
| Worker | -- | -- | Tareas en segundo plano (sin puerto) |
| Servidor MCP | 8090 | 8090 | Herramientas MCP |
| Frontend | 80 | 3000 | Interfaz web |

## Ejemplo de Archivo .env

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

## Niveles de Registro

OpenPR usa el crate `tracing` para registro estructurado. Establece `RUST_LOG` para controlar la verbosidad:

| Nivel | Descripción |
|-------|-------------|
| `error` | Solo errores |
| `warn` | Errores y advertencias |
| `info` | Mensajes operacionales normales (predeterminado) |
| `debug` | Información detallada de depuración |
| `trace` | Muy detallado, incluye todas las operaciones internas |

Se soporta el filtrado por módulo:

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## Próximos Pasos

- [Despliegue Docker](../deployment/docker) -- Configuración de Docker Compose
- [Despliegue en Producción](../deployment/production) -- Caddy, seguridad y escalado
- [Instalación](../getting-started/installation) -- Comenzar

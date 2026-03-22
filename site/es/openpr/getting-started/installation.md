---
title: Instalación
description: Instala OpenPR usando Docker Compose, Podman o compilando desde fuente con Rust y Node.js.
---

# Instalación

OpenPR soporta tres métodos de instalación. Docker Compose es la forma más rápida de obtener una instancia completamente funcional.

::: tip Recomendado
**Docker Compose** levanta todos los servicios (API, frontend, worker, servidor MCP, PostgreSQL) con un único comando. No se requiere toolchain de Rust ni Node.js.
:::

## Requisitos Previos

| Requisito | Mínimo | Notas |
|-----------|--------|-------|
| Docker | 20.10+ | O Podman 3.0+ con podman-compose |
| Docker Compose | 2.0+ | Incluido con Docker Desktop |
| Rust (compilación desde fuente) | 1.75.0 | No necesario para instalación Docker |
| Node.js (compilación desde fuente) | 20+ | Para compilar el frontend SvelteKit |
| PostgreSQL (compilación desde fuente) | 15+ | El método Docker incluye PostgreSQL |
| Espacio en Disco | 500 MB | Imágenes + base de datos |
| RAM | 1 GB | 2 GB+ recomendado para producción |

## Método 1: Docker Compose (Recomendado)

Clona el repositorio e inicia todos los servicios:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

Esto inicia cinco servicios:

| Servicio | Contenedor | Puerto | Descripción |
|---------|-----------|------|-------------|
| PostgreSQL | `openpr-postgres` | 5432 | Base de datos con auto-migración |
| API | `openpr-api` | 8081 (mapea a 8080) | Servidor de API REST |
| Worker | `openpr-worker` | -- | Procesador de tareas en segundo plano |
| Servidor MCP | `openpr-mcp-server` | 8090 | Servidor de herramientas MCP |
| Frontend | `openpr-frontend` | 3000 | Interfaz web SvelteKit |

Verifica que todos los servicios estén en ejecución:

```bash
docker-compose ps
```

::: warning Primer Usuario
El primer usuario en registrarse se convierte automáticamente en **administrador**. Asegúrate de registrar tu cuenta de administrador antes de compartir la URL con otros.
:::

### Variables de Entorno

Edita `.env` para personalizar tu despliegue:

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (change in production!)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

::: danger Seguridad
Siempre cambia `JWT_SECRET` y las contraseñas de la base de datos antes de desplegar en producción. Usa valores fuertes y aleatorios.
:::

## Método 2: Podman

OpenPR funciona con Podman como alternativa a Docker. La diferencia clave es que Podman requiere `--network=host` para las compilaciones debido a la resolución DNS:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# Build images with network access
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# Start services
sudo podman-compose up -d
```

::: tip DNS de Podman
El contenedor Nginx del frontend usa `10.89.0.1` como resolver DNS (el DNS de red predeterminado de Podman), no `127.0.0.11` (el predeterminado de Docker). Esto ya está configurado en la configuración de Nginx incluida.
:::

## Método 3: Compilación desde Fuente

### Backend

```bash
# Prerequisites: Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# Configure
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Build all binaries
cargo build --release -p api -p worker -p mcp-server
```

Los binarios se encuentran en:
- `target/release/api` -- Servidor de API REST
- `target/release/worker` -- Worker en segundo plano
- `target/release/mcp-server` -- Servidor de herramientas MCP

### Frontend

```bash
cd frontend
npm install    # or: bun install
npm run build  # or: bun run build
```

La salida de la compilación está en `frontend/build/`. Sírvela con Nginx o cualquier servidor de archivos estáticos.

### Configuración de la Base de Datos

Crea la base de datos y ejecuta las migraciones:

```bash
# Create database
createdb -U postgres openpr

# Migrations run automatically on first API start
# Or apply manually:
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... apply remaining migrations in order
```

### Iniciar Servicios

```bash
# Terminal 1: API server
./target/release/api

# Terminal 2: Worker
./target/release/worker

# Terminal 3: MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## Verificar la Instalación

Una vez que todos los servicios estén en ejecución, verifica cada endpoint:

```bash
# API health check
curl http://localhost:8080/health

# MCP server health
curl http://localhost:8090/health

# Frontend
curl -s http://localhost:3000 | head -5
```

Abre http://localhost:3000 en tu navegador para acceder a la interfaz web.

## Desinstalación

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v removes volumes (database data)
docker rmi $(docker images 'openpr*' -q)
```

### Compilación desde Fuente

```bash
# Stop running services (Ctrl+C in each terminal)
# Remove binaries
rm -f target/release/api target/release/worker target/release/mcp-server

# Drop database (optional)
dropdb -U postgres openpr
```

## Próximos Pasos

- [Inicio Rápido](./quickstart) -- Crea tu primer espacio de trabajo y proyecto en 5 minutos
- [Despliegue Docker](../deployment/docker) -- Configuración Docker para producción
- [Despliegue en Producción](../deployment/production) -- Caddy, PostgreSQL y refuerzo de seguridad

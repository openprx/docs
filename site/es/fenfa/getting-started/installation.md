---
title: Instalación
description: Instala Fenfa usando Docker, Docker Compose, o compila desde el código fuente con Go y Node.js.
---

# Instalación

Fenfa soporta dos métodos de instalación: Docker (recomendado) y compilación desde el código fuente.

::: tip Recomendado
**Docker** es la forma más rápida de comenzar. Un solo comando te da una instancia de Fenfa completamente funcional sin herramientas de compilación.
:::

## Prerrequisitos

| Requisito | Mínimo | Notas |
|-----------|--------|-------|
| Docker | 20.10+ | O Podman 3.0+ |
| Go (solo compilación desde fuente) | 1.25+ | No necesario para Docker |
| Node.js (solo compilación desde fuente) | 20+ | Para compilar el frontend |
| Espacio en Disco | 100 MB | Más almacenamiento para builds subidos |

## Método 1: Docker (Recomendado)

Descarga y ejecuta la imagen oficial:

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  fenfa/fenfa:latest
```

Visita `http://localhost:8000/admin` e inicia sesión con el token predeterminado `dev-admin-token`.

::: warning Seguridad
Los tokens predeterminados son solo para desarrollo. Consulta [Despliegue en Producción](../deployment/production) para configurar tokens seguros antes de exponer Fenfa a internet.
:::

### Con Almacenamiento Persistente

Monta volúmenes para la base de datos y los archivos subidos:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Con Configuración Personalizada

Monta un archivo `config.json` para control total sobre todos los ajustes:

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

Consulta la [Referencia de Configuración](../configuration/) para todas las opciones disponibles.

### Variables de Entorno

Sobreescribe valores de configuración sin un archivo de configuración:

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

| Variable | Descripción | Predeterminado |
|----------|-------------|----------------|
| `FENFA_PORT` | Puerto HTTP | `8000` |
| `FENFA_DATA_DIR` | Directorio de la base de datos | `data` |
| `FENFA_PRIMARY_DOMAIN` | URL de dominio público | `http://localhost:8000` |
| `FENFA_ADMIN_TOKEN` | Token de administrador | `dev-admin-token` |
| `FENFA_UPLOAD_TOKEN` | Token de subida | `dev-upload-token` |

## Método 2: Docker Compose

Crea un `docker-compose.yml`:

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

Inicia el servicio:

```bash
docker compose up -d
```

## Método 3: Compilar desde el Código Fuente

Clona el repositorio:

```bash
git clone https://github.com/openprx/fenfa.git
cd fenfa
```

### Usando Make

El Makefile automatiza la compilación completa:

```bash
make build   # builds frontend + backend
make run     # starts the server
```

### Compilación Manual

Compila primero las aplicaciones frontend y luego el backend Go:

```bash
# Build the public download page
cd web/front && npm ci && npm run build && cd ../..

# Build the admin panel
cd web/admin && npm ci && npm run build && cd ../..

# Build the Go binary
go build -o fenfa ./cmd/server
```

El frontend se compila en `internal/web/dist/` y se embebe en el binario Go mediante `go:embed`. El binario `fenfa` resultante es completamente autocontenido.

### Ejecutar el Binario

```bash
./fenfa
```

Fenfa inicia en el puerto 8000 por defecto. La base de datos SQLite se crea automáticamente en el directorio `data/`.

## Verificar la Instalación

Abre tu navegador en `http://localhost:8000/admin` e inicia sesión con el token de administrador. Deberías ver el panel de administración.

Comprueba el endpoint de salud:

```bash
curl http://localhost:8000/healthz
```

Respuesta esperada:

```json
{"ok": true}
```

## Siguientes Pasos

- [Inicio Rápido](./quickstart) -- Sube tu primer build en 5 minutos
- [Referencia de Configuración](../configuration/) -- Todas las opciones de configuración
- [Despliegue con Docker](../deployment/docker) -- Docker Compose y compilaciones multi-arquitectura

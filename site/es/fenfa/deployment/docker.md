---
title: Despliegue con Docker
description: "Despliega Fenfa con Docker y Docker Compose. Configuración de contenedor, volúmenes, compilaciones multi-arquitectura y comprobaciones de salud."
---

# Despliegue con Docker

Fenfa viene como una única imagen Docker que incluye el binario Go con frontend embebido. No se necesitan contenedores adicionales -- simplemente monta volúmenes para datos persistentes.

## Inicio Rápido

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

Crea un `docker-compose.yml`:

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

Crea un archivo `.env` junto al archivo compose:

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

Inicia el servicio:

```bash
docker compose up -d
```

## Volúmenes

| Punto de Montaje | Propósito | Copia de Seguridad Requerida |
|------------------|-----------|------------------------------|
| `/data` | Base de datos SQLite | Sí |
| `/app/uploads` | Archivos binarios subidos | Sí (salvo que uses S3) |
| `/app/config.json` | Archivo de configuración (opcional) | Sí |

::: warning Persistencia de Datos
Sin montajes de volúmenes, todos los datos se pierden cuando el contenedor se recrea. Siempre monta `/data` y `/app/uploads` para uso en producción.
:::

## Usar un Archivo de Configuración

Monta un archivo de configuración para control total:

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## Comprobación de Salud

Fenfa expone un endpoint de salud en `/healthz`:

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

El ejemplo de Docker Compose anterior incluye una configuración de comprobación de salud. Para orquestadores como Kubernetes o Nomad, usa este endpoint para sondeos de liveness y readiness.

## Multi-Arquitectura

La imagen Docker de Fenfa soporta tanto `linux/amd64` como `linux/arm64`. Docker descarga automáticamente la arquitectura correcta para tu host.

Para compilar imágenes multi-arquitectura tú mismo:

```bash
./scripts/docker-build.sh
```

Esto usa Docker Buildx para crear imágenes para ambas arquitecturas.

## Requisitos de Recursos

Fenfa es ligero:

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 núcleo | 2 núcleos |
| RAM | 64 MB | 256 MB |
| Disco | 100 MB (app) | Depende de los archivos subidos |

La base de datos SQLite y el binario Go tienen una sobrecarga mínima. El uso de recursos escala principalmente con el almacenamiento de subidas y las conexiones concurrentes.

## Logs

Ve los logs del contenedor:

```bash
docker logs -f fenfa
```

Fenfa escribe logs en stdout en formato estructurado, compatible con herramientas de agregación de logs.

## Actualizar

```bash
docker compose pull
docker compose up -d
```

::: tip Actualizaciones con Tiempo de Inactividad Cero
Fenfa inicia rápidamente (< 1 segundo). Para actualizaciones con tiempo de inactividad casi cero, usa una comprobación de salud de proxy inverso que enrute automáticamente el tráfico al nuevo contenedor una vez que pase la comprobación de salud.
:::

## Siguientes Pasos

- [Despliegue en Producción](./production) -- Proxy inverso, TLS y seguridad
- [Referencia de Configuración](../configuration/) -- Todas las opciones de configuración
- [Resolución de Problemas](../troubleshooting/) -- Problemas comunes de Docker

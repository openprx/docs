---
title: Despliegue en Producción
description: "Despliega OpenPR en producción con proxy inverso Caddy, HTTPS automático, refuerzo de PostgreSQL y mejores prácticas de seguridad."
---

# Despliegue en Producción

Esta guía cubre el despliegue de OpenPR en un entorno de producción con HTTPS, un proxy inverso, refuerzo de la base de datos y mejores prácticas de seguridad.

## Arquitectura

```mermaid
graph LR
    INTERNET["Internet<br/>:443"] --> CADDY["Caddy<br/>HTTPS Automático"]
    CADDY --> FE["Frontend<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## Requisitos Previos

- Un servidor con al menos 2 núcleos de CPU y 2 GB de RAM
- Un nombre de dominio apuntando a la dirección IP de tu servidor
- Docker y Docker Compose (o Podman)

## Paso 1: Configurar el Entorno

Crea un archivo `.env` de producción:

```bash
# Database (use strong passwords)
DATABASE_URL=postgres://openpr:STRONG_PASSWORD_HERE@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# JWT (generate a random secret)
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# Logging
RUST_LOG=info
```

::: danger Secretos
Nunca hagas commit de archivos `.env` en el control de versiones. Usa `chmod 600 .env` para restringir los permisos del archivo.
:::

## Paso 2: Configurar Caddy

Instala Caddy en el sistema host:

```bash
sudo apt install -y caddy
```

Configura el Caddyfile:

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

Caddy obtiene y renueva automáticamente los certificados TLS de Let's Encrypt.

Inicia Caddy:

```bash
sudo systemctl enable --now caddy
```

::: tip Alternativa: Nginx
Si prefieres Nginx, configúralo con un proxy pass al puerto 3000 y usa certbot para los certificados TLS.
:::

## Paso 3: Desplegar con Docker Compose

```bash
cd /opt/openpr
docker-compose up -d
```

Verifica que todos los servicios estén saludables:

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## Paso 4: Crear la Cuenta de Administrador

Abre `https://your-domain.example.com` en tu navegador y registra la cuenta de administrador.

::: warning Primer Usuario
El primer usuario registrado se convierte en administrador. Registra tu cuenta de administrador antes de compartir la URL.
:::

## Lista de Verificación de Seguridad

### Autenticación

- [ ] Cambia `JWT_SECRET` a un valor de 32+ caracteres aleatorio
- [ ] Establece valores de TTL de tokens apropiados (más corto para acceso, más largo para actualización)
- [ ] Crea la cuenta de administrador inmediatamente después del despliegue

### Base de Datos

- [ ] Usa una contraseña fuerte para PostgreSQL
- [ ] No expongas el puerto de PostgreSQL (5432) a internet
- [ ] Habilita SSL de PostgreSQL para conexiones (si la base de datos es remota)
- [ ] Configura copias de seguridad regulares de la base de datos

### Red

- [ ] Usa Caddy o Nginx con HTTPS (TLS 1.3)
- [ ] Solo expone los puertos 443 (HTTPS) y opcionalmente 8090 (MCP) a internet
- [ ] Usa un firewall (ufw, iptables) para restringir el acceso
- [ ] Considera restringir el acceso al servidor MCP a rangos de IP conocidos

### Aplicación

- [ ] Establece `RUST_LOG=info` (no debug ni trace en producción)
- [ ] Monitoriza el uso de disco del directorio de subidas
- [ ] Configura la rotación de registros para los registros de contenedores

## Copias de Seguridad de la Base de Datos

Configura copias de seguridad automatizadas de PostgreSQL:

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

Añade a cron:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/openpr/backup.sh
```

## Monitorización

### Verificaciones de Estado

Monitoriza los endpoints de estado de los servicios:

```bash
# API
curl -f http://localhost:8080/health

# MCP Server
curl -f http://localhost:8090/health
```

### Monitorización de Registros

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f api --tail=100
```

## Consideraciones de Escalado

- **Servidor API**: Puede ejecutar múltiples réplicas detrás de un balanceador de carga. Todas las instancias se conectan a la misma base de datos PostgreSQL.
- **Worker**: Ejecuta una única instancia para evitar el procesamiento duplicado de trabajos.
- **Servidor MCP**: Puede ejecutar múltiples réplicas. Cada instancia es sin estado.
- **PostgreSQL**: Para alta disponibilidad, considera la replicación de PostgreSQL o un servicio de base de datos gestionado.

## Actualización

Para actualizar OpenPR:

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

Las migraciones de la base de datos se aplican automáticamente en el inicio del servidor API.

## Próximos Pasos

- [Despliegue Docker](./docker) -- Referencia de Docker Compose
- [Configuración](../configuration/) -- Referencia de variables de entorno
- [Resolución de Problemas](../troubleshooting/) -- Problemas comunes de producción

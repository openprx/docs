---
title: Descripción General de la Configuración
description: "Cómo funciona la configuración de PRX-WAF. Estructura del archivo de configuración TOML, anulaciones de variables de entorno y la relación entre la configuración basada en archivos y la almacenada en la base de datos."
---

# Configuración

PRX-WAF se configura a través de un archivo TOML pasado vía el indicador `-c` / `--config`. La ruta predeterminada es `configs/default.toml`.

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## Fuentes de Configuración

PRX-WAF usa dos capas de configuración:

| Fuente | Ámbito | Descripción |
|--------|--------|-------------|
| Archivo TOML | Inicio del servidor | Puertos del proxy, URL de la base de datos, caché, HTTP/3, seguridad, clúster |
| Base de datos | Tiempo de ejecución | Hosts, reglas, certificados, plugins, túneles, notificaciones |

El archivo TOML contiene los ajustes necesarios en el momento del inicio (puertos, conexión a la base de datos, configuración del clúster). Los ajustes de tiempo de ejecución como hosts y reglas se almacenan en PostgreSQL y se gestionan vía la interfaz de administración o la API REST.

## Estructura del Archivo de Configuración

El archivo de configuración TOML tiene las siguientes secciones:

```toml
[proxy]          # Reverse proxy listener addresses
[api]            # Admin API listener address
[storage]        # PostgreSQL connection
[cache]          # Response cache settings
[http3]          # HTTP/3 QUIC settings
[security]       # Admin API security (IP allowlist, rate limit, CORS)
[rules]          # Rule engine settings (directory, hot-reload, sources)
[crowdsec]       # CrowdSec integration
[cluster]        # Cluster mode (optional)
```

### Configuración Mínima

Una configuración mínima para desarrollo:

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### Configuración de Producción

Una configuración de producción con todas las características de seguridad:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Configuración de Hosts

Los hosts pueden definirse en el archivo TOML para implementaciones estáticas:

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
Para entornos dinámicos, gestiona los hosts vía la interfaz de administración o la API REST en lugar del archivo TOML. Los hosts almacenados en la base de datos tienen precedencia sobre los hosts definidos en el TOML.
:::

## Migraciones de la Base de Datos

PRX-WAF incluye 8 archivos de migración que crean el esquema de base de datos requerido:

```bash
# Run migrations
prx-waf -c configs/default.toml migrate

# Create default admin user
prx-waf -c configs/default.toml seed-admin
```

Las migraciones son idempotentes y seguras para ejecutar múltiples veces.

## Entorno Docker

En implementaciones Docker, los valores de configuración se establecen típicamente en `docker-compose.yml`:

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## Próximos Pasos

- [Referencia de Configuración](./reference) -- Cada clave TOML documentada con tipos y valores predeterminados
- [Instalación](../getting-started/installation) -- Configuración inicial y migraciones de la base de datos
- [Modo Clúster](../cluster/) -- Configuración específica del clúster

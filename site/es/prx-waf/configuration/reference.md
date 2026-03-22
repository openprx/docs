---
title: Referencia de Configuración
description: "Referencia completa de cada clave de configuración TOML de PRX-WAF, incluyendo tipos, valores predeterminados y descripciones detalladas."
---

# Referencia de Configuración

Esta página documenta cada clave de configuración en el archivo de configuración TOML de PRX-WAF. El archivo de configuración predeterminado es `configs/default.toml`.

## Ajustes del Proxy (`[proxy]`)

Ajustes que controlan el listener del proxy inverso.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `listen_addr` | `string` | `"0.0.0.0:80"` | Dirección del listener HTTP |
| `listen_addr_tls` | `string` | `"0.0.0.0:443"` | Dirección del listener HTTPS |
| `worker_threads` | `integer \| null` | `null` (recuento de CPUs) | Número de hilos de trabajo del proxy. Cuando es null, usa el número de núcleos de CPU lógicos. |

## Ajustes de la API (`[api]`)

Ajustes para la API de gestión y la interfaz de administración.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `listen_addr` | `string` | `"127.0.0.1:9527"` | Dirección del listener de la API de administración + interfaz. Vincula a `127.0.0.1` en producción para restringir el acceso al localhost. |

## Ajustes de Almacenamiento (`[storage]`)

Conexión a la base de datos PostgreSQL.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `database_url` | `string` | `"postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"` | URL de conexión PostgreSQL |
| `max_connections` | `integer` | `20` | Número máximo de conexiones de base de datos en el pool |

## Ajustes de Caché (`[cache]`)

Configuración de caché de respuestas usando una caché LRU en memoria moka.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `enabled` | `boolean` | `true` | Habilitar caché de respuestas |
| `max_size_mb` | `integer` | `256` | Tamaño máximo de la caché en megabytes |
| `default_ttl_secs` | `integer` | `60` | Tiempo de vida predeterminado para las respuestas en caché (segundos) |
| `max_ttl_secs` | `integer` | `3600` | Límite máximo de TTL (segundos). Las respuestas no pueden almacenarse en caché más de esto independientemente de los encabezados del ascendente. |

## Ajustes HTTP/3 (`[http3]`)

HTTP/3 vía QUIC (biblioteca Quinn).

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `enabled` | `boolean` | `false` | Habilitar soporte HTTP/3 |
| `listen_addr` | `string` | `"0.0.0.0:443"` | Dirección del listener QUIC (UDP) |
| `cert_pem` | `string` | -- | Ruta al certificado TLS (formato PEM) |
| `key_pem` | `string` | -- | Ruta a la clave privada TLS (formato PEM) |

::: warning
HTTP/3 requiere certificados TLS válidos. Tanto `cert_pem` como `key_pem` deben establecerse cuando `enabled = true`.
:::

## Ajustes de Seguridad (`[security]`)

Configuración de seguridad de la API de administración y el proxy.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `admin_ip_allowlist` | `string[]` | `[]` | Lista de IPs/CIDRs permitidos para acceder a la API de administración. Vacío significa permitir todo. |
| `max_request_body_bytes` | `integer` | `10485760` (10 MB) | Tamaño máximo del cuerpo de la solicitud en bytes. Las solicitudes que superen esto son rechazadas con 413. |
| `api_rate_limit_rps` | `integer` | `0` | Límite de velocidad por IP para la API de administración (solicitudes por segundo). `0` significa deshabilitado. |
| `cors_origins` | `string[]` | `[]` | Orígenes CORS permitidos para la API de administración. Vacío significa permitir todos los orígenes. |

## Ajustes de Reglas (`[rules]`)

Configuración del motor de reglas.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `dir` | `string` | `"rules/"` | Directorio que contiene los archivos de reglas |
| `hot_reload` | `boolean` | `true` | Habilitar la observación del sistema de archivos para la recarga automática de reglas |
| `reload_debounce_ms` | `integer` | `500` | Ventana de debounce para eventos de cambio de archivo (milisegundos) |
| `enable_builtin_owasp` | `boolean` | `true` | Habilitar las reglas OWASP CRS integradas |
| `enable_builtin_bot` | `boolean` | `true` | Habilitar las reglas de detección de bots integradas |
| `enable_builtin_scanner` | `boolean` | `true` | Habilitar las reglas de detección de escáneres integradas |

### Fuentes de Reglas (`[[rules.sources]]`)

Configura múltiples fuentes de reglas (directorios locales o URLs remotas):

| Clave | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | `string` | Sí | Nombre de la fuente (p. ej., `"custom"`, `"owasp-crs"`) |
| `path` | `string` | No | Ruta al directorio local |
| `url` | `string` | No | URL remota para la obtención de reglas |
| `format` | `string` | Sí | Formato de reglas: `"yaml"`, `"json"`, o `"modsec"` |
| `update_interval` | `integer` | No | Intervalo de actualización automática en segundos (solo fuentes remotas) |

```toml
[[rules.sources]]
name   = "custom"
path   = "rules/custom/"
format = "yaml"

[[rules.sources]]
name            = "owasp-crs"
url             = "https://example.com/rules/owasp.yaml"
format          = "yaml"
update_interval = 86400
```

## Ajustes de CrowdSec (`[crowdsec]`)

Integración de inteligencia de amenazas con CrowdSec.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `enabled` | `boolean` | `false` | Habilitar la integración con CrowdSec |
| `mode` | `string` | `"bouncer"` | Modo de integración: `"bouncer"`, `"appsec"`, o `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | URL del LAPI de CrowdSec |
| `api_key` | `string` | `""` | Clave de API del bouncer |
| `update_frequency_secs` | `integer` | `10` | Intervalo de actualización de la caché de decisiones (segundos) |
| `fallback_action` | `string` | `"allow"` | Acción cuando LAPI no es accesible: `"allow"`, `"block"`, o `"log"` |
| `appsec_endpoint` | `string` | -- | URL del endpoint de inspección HTTP AppSec (opcional) |
| `appsec_key` | `string` | -- | Clave de API AppSec (opcional) |

## Configuración de Hosts (`[[hosts]]`)

Entradas de host estáticas (también pueden gestionarse vía la interfaz de administración/API):

| Clave | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `host` | `string` | Sí | Nombre de dominio a coincidir |
| `port` | `integer` | Sí | Puerto de escucha (generalmente 80 o 443) |
| `remote_host` | `string` | Sí | IP o nombre de host del backend ascendente |
| `remote_port` | `integer` | Sí | Puerto del backend ascendente |
| `ssl` | `boolean` | No | Usar HTTPS hacia el ascendente (predeterminado: false) |
| `guard_status` | `boolean` | No | Habilitar protección WAF (predeterminado: true) |

## Ajustes del Clúster (`[cluster]`)

Configuración del clúster multi-nodo. Consulta [Modo Clúster](../cluster/) para más detalles.

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `enabled` | `boolean` | `false` | Habilitar el modo clúster |
| `node_id` | `string` | `""` (auto) | Identificador único del nodo. Se genera automáticamente si está vacío. |
| `role` | `string` | `"auto"` | Rol del nodo: `"auto"`, `"main"`, o `"worker"` |
| `listen_addr` | `string` | `"0.0.0.0:16851"` | Dirección de escucha QUIC para comunicación entre nodos |
| `seeds` | `string[]` | `[]` | Direcciones de nodos semilla para unirse al clúster |

### Criptografía del Clúster (`[cluster.crypto]`)

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `ca_cert` | `string` | -- | Ruta al certificado CA (PEM) |
| `ca_key` | `string` | -- | Ruta a la clave privada CA (solo nodo principal) |
| `node_cert` | `string` | -- | Ruta al certificado del nodo (PEM) |
| `node_key` | `string` | -- | Ruta a la clave privada del nodo (PEM) |
| `auto_generate` | `boolean` | `true` | Generar automáticamente certificados en el primer inicio |
| `ca_validity_days` | `integer` | `3650` | Validez del certificado CA (días) |
| `node_validity_days` | `integer` | `365` | Validez del certificado del nodo (días) |
| `renewal_before_days` | `integer` | `7` | Renovar automáticamente este número de días antes de la expiración |

### Sincronización del Clúster (`[cluster.sync]`)

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `rules_interval_secs` | `integer` | `10` | Intervalo de verificación de versiones de reglas |
| `config_interval_secs` | `integer` | `30` | Intervalo de sincronización de configuración |
| `events_batch_size` | `integer` | `100` | Vaciar el lote de eventos al alcanzar este número |
| `events_flush_interval_secs` | `integer` | `5` | Vaciar eventos incluso si el lote no está lleno |
| `stats_interval_secs` | `integer` | `10` | Intervalo de reporte de estadísticas |
| `events_queue_size` | `integer` | `10000` | Tamaño de la cola de eventos (elimina los más antiguos si está llena) |

### Elección del Clúster (`[cluster.election]`)

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `timeout_min_ms` | `integer` | `150` | Tiempo de espera mínimo de elección (ms) |
| `timeout_max_ms` | `integer` | `300` | Tiempo de espera máximo de elección (ms) |
| `heartbeat_interval_ms` | `integer` | `50` | Intervalo de latido del principal a los trabajadores (ms) |
| `phi_suspect` | `float` | `8.0` | Umbral de sospecha del phi accrual |
| `phi_dead` | `float` | `12.0` | Umbral de muerte del phi accrual |

### Salud del Clúster (`[cluster.health]`)

| Clave | Tipo | Predeterminado | Descripción |
|-------|------|----------------|-------------|
| `check_interval_secs` | `integer` | `5` | Frecuencia de verificación de salud |
| `max_missed_heartbeats` | `integer` | `3` | Marcar al par como no saludable después de N latidos perdidos |

## Configuración Predeterminada Completa

Para referencia, consulta el archivo [default.toml](https://github.com/openprx/prx-waf/blob/main/configs/default.toml) en el repositorio.

## Próximos Pasos

- [Descripción General de la Configuración](./index) -- Cómo funcionan juntas las capas de configuración
- [Implementación del Clúster](../cluster/deployment) -- Configuración específica del clúster
- [Motor de Reglas](../rules/) -- Ajustes del motor de reglas en detalle

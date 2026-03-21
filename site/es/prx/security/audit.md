---
title: Registro de auditoria
description: Sistema de registro de auditoria de seguridad para rastrear todas las operaciones relevantes de seguridad en PRX.
---

# Registro de auditoria

PRX incluye un sistema de registro de auditoria integrado que registra todas las operaciones relevantes de seguridad. El `AuditLogger` rastrea quien hizo que, cuando y si tuvo exito -- proporcionando un registro a prueba de manipulaciones para cumplimiento, respuesta a incidentes y analisis forense.

## Vision general

El sistema de auditoria captura eventos estructurados para cada accion sensible a la seguridad:

- Intentos de autenticacion (exito y fallo)
- Decisiones de autorizacion (permitir y denegar)
- Cambios de configuracion
- Ejecuciones de herramientas y eventos de sandbox
- Acceso y modificacion de memoria
- Conexiones y desconexiones de canales
- Propuestas y aplicaciones de evolucion
- Eventos del ciclo de vida de plugins

Cada evento de auditoria incluye una marca de tiempo, identidad del actor, descripcion de la accion, recurso objetivo y resultado.

## Estructura de eventos de auditoria

Cada evento de auditoria es un registro estructurado con los siguientes campos:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `timestamp` | `DateTime<Utc>` | Cuando ocurrio el evento (UTC, precision de nanosegundos) |
| `event_id` | `String` | Identificador unico del evento (UUIDv7, ordenado por tiempo) |
| `actor` | `Actor` | Quien realizo la accion (usuario, agente, sistema o plugin) |
| `action` | `String` | Que se hizo (ej., `auth.login`, `tool.execute`, `config.update`) |
| `target` | `String` | El recurso sobre el que se actuo (ej., ID de sesion, clave de config, ruta de archivo) |
| `outcome` | `Outcome` | Resultado: `success`, `failure` o `denied` |
| `metadata` | `Map<String, Value>` | Contexto adicional (direccion IP, motivo de denegacion, etc.) |
| `session_id` | `Option<String>` | Sesion del agente asociada, si existe |
| `severity` | `Severity` | Severidad del evento: `info`, `warning`, `critical` |

### Tipos de actor

| Tipo de actor | Descripcion | Ejemplo |
|--------------|-------------|---------|
| `user` | Un usuario humano identificado por canal o autenticacion API | `user:telegram:123456789` |
| `agent` | El agente PRX en si | `agent:default` |
| `system` | Procesos internos del sistema (cron, evolucion) | `system:evolution` |
| `plugin` | Un plugin WASM | `plugin:my-plugin:v1.2.0` |

### Categorias de acciones

Las acciones siguen una convencion de espacios de nombres separados por punto:

| Categoria | Acciones | Severidad |
|-----------|---------|----------|
| `auth.*` | `auth.login`, `auth.logout`, `auth.token_refresh`, `auth.pairing` | info / warning |
| `authz.*` | `authz.allow`, `authz.deny`, `authz.policy_check` | info / warning |
| `config.*` | `config.update`, `config.reload`, `config.hot_reload` | warning |
| `tool.*` | `tool.execute`, `tool.sandbox_escape_attempt`, `tool.timeout` | info / critical |
| `memory.*` | `memory.store`, `memory.recall`, `memory.delete`, `memory.compact` | info |
| `channel.*` | `channel.connect`, `channel.disconnect`, `channel.error` | info / warning |
| `evolution.*` | `evolution.propose`, `evolution.apply`, `evolution.rollback` | warning / critical |
| `plugin.*` | `plugin.load`, `plugin.unload`, `plugin.error`, `plugin.permission_denied` | info / warning |
| `session.*` | `session.create`, `session.terminate`, `session.timeout` | info |

## Configuracion

```toml
[security.audit]
enabled = true
min_severity = "info"           # severidad minima a registrar: "info", "warning", "critical"

[security.audit.file]
enabled = true
path = "~/.local/share/openprx/audit.log"
format = "jsonl"                # "jsonl" o "csv"
max_size_mb = 100               # rotar cuando el archivo exceda este tamano
max_files = 10                  # mantener hasta 10 archivos rotados
compress_rotated = true         # comprimir archivos rotados con gzip

[security.audit.database]
enabled = false
backend = "sqlite"              # "sqlite" o "postgres"
path = "~/.local/share/openprx/audit.db"
retention_days = 90             # auto-eliminar eventos mas antiguos de 90 dias
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar o deshabilitar el registro de auditoria globalmente |
| `min_severity` | `String` | `"info"` | Nivel de severidad minimo a registrar |
| `file.enabled` | `bool` | `true` | Escribir eventos de auditoria en un archivo de log |
| `file.path` | `String` | `"~/.local/share/openprx/audit.log"` | Ruta al archivo de log de auditoria |
| `file.format` | `String` | `"jsonl"` | Formato de log: `"jsonl"` (un objeto JSON por linea) o `"csv"` |
| `file.max_size_mb` | `u64` | `100` | Tamano maximo del archivo antes de rotar (MB) |
| `file.max_files` | `u32` | `10` | Numero de archivos rotados a conservar |
| `file.compress_rotated` | `bool` | `true` | Comprimir archivos de log rotados con gzip |
| `database.enabled` | `bool` | `false` | Escribir eventos de auditoria en base de datos |
| `database.backend` | `String` | `"sqlite"` | Backend de base de datos: `"sqlite"` o `"postgres"` |
| `database.path` | `String` | `""` | Ruta de base de datos (SQLite) o URL de conexion (PostgreSQL) |
| `database.retention_days` | `u64` | `90` | Auto-eliminar eventos mas antiguos de N dias. 0 = conservar siempre |

## Backends de almacenamiento

### Archivo (JSONL)

El backend por defecto escribe un objeto JSON por linea en un archivo de log. Este formato es compatible con herramientas estandar de analisis de logs (jq, grep, Elasticsearch ingest).

Ejemplo de entrada de log:

```json
{
  "timestamp": "2026-03-21T10:15:30.123456789Z",
  "event_id": "019520a8-1234-7000-8000-000000000001",
  "actor": {"type": "user", "id": "user:telegram:123456789"},
  "action": "tool.execute",
  "target": "shell:ls -la /tmp",
  "outcome": "success",
  "metadata": {"sandbox": "bubblewrap", "duration_ms": 45},
  "session_id": "sess_abc123",
  "severity": "info"
}
```

### Base de datos (SQLite / PostgreSQL)

El backend de base de datos almacena eventos en una tabla estructurada con indices en `timestamp`, `actor`, `action` y `severity` para consultas eficientes.

## Consultar registros de auditoria

### Consultas CLI

```bash
# Ver eventos de auditoria recientes
prx audit log --tail 50

# Filtrar por categoria de accion
prx audit log --action "auth.*" --last 24h

# Filtrar por severidad
prx audit log --severity critical --last 7d

# Filtrar por actor
prx audit log --actor "user:telegram:123456789"

# Exportar a JSON
prx audit log --last 30d --format json > audit_export.json
```

### Consultas a base de datos

Cuando se usa el backend de base de datos, puedes consultar directamente con SQL:

```sql
-- Intentos de autenticacion fallidos en las ultimas 24 horas
SELECT * FROM audit_events
WHERE action LIKE 'auth.%'
  AND outcome = 'failure'
  AND timestamp > datetime('now', '-24 hours')
ORDER BY timestamp DESC;

-- Ejecucion de herramientas por un usuario especifico
SELECT action, target, outcome, timestamp
FROM audit_events
WHERE actor_id = 'user:telegram:123456789'
  AND action LIKE 'tool.%'
ORDER BY timestamp DESC
LIMIT 100;

-- Resumen de eventos criticos
SELECT action, COUNT(*) as count
FROM audit_events
WHERE severity = 'critical'
  AND timestamp > datetime('now', '-7 days')
GROUP BY action
ORDER BY count DESC;
```

## Cumplimiento

El sistema de registro de auditoria esta disenado para soportar requisitos de cumplimiento:

- **Inmutabilidad** -- los archivos de log son de solo adicion; los archivos rotados pueden verificarse con sumas de comprobacion
- **Completitud** -- todas las operaciones relevantes de seguridad se registran por defecto al nivel `info`
- **Retencion** -- periodos de retencion configurables con rotacion y eliminacion automatica
- **No repudio** -- cada evento incluye identidad del actor y marca de tiempo
- **Disponibilidad** -- salida dual (archivo + base de datos) asegura que los eventos no se pierdan si un backend falla

### Configuracion recomendada para cumplimiento

```toml
[security.audit]
enabled = true
min_severity = "info"

[security.audit.file]
enabled = true
format = "jsonl"
max_size_mb = 500
max_files = 50
compress_rotated = true

[security.audit.database]
enabled = true
backend = "postgres"
path = "postgresql://audit_user:password@localhost/prx_audit"
retention_days = 365
```

## Rendimiento

El registrador de auditoria esta disenado para una sobrecarga minima:

- Los eventos se escriben asincronamente via un canal acotado (capacidad por defecto: 10,000 eventos)
- Las escrituras a archivo son con buffer y se vacian periodicamente (cada 1 segundo o cada 100 eventos)
- Las escrituras a base de datos se agrupan en lotes (tamano de lote por defecto: 50 eventos)
- Si el canal de eventos esta lleno, los eventos se descartan con un contador de advertencias (nunca bloquea el bucle principal del agente)

## Limitaciones

- El backend de archivo no proporciona deteccion de manipulaciones integrada (considera monitoreo externo de integridad para despliegues de alta seguridad)
- Los eventos de auditoria del codigo de plugins son registrados por el host; los plugins no pueden eludir el sistema de auditoria
- El formato CSV no soporta campos de metadatos anidados (usa JSONL para fidelidad completa)
- La limpieza de retencion de base de datos se ejecuta una vez por hora; los eventos pueden persistir ligeramente mas alla del periodo de retencion configurado

## Paginas relacionadas

- [Vision general de seguridad](./)
- [Motor de politicas](./policy-engine) -- decisiones de autorizacion que generan eventos de auditoria
- [Sandbox](./sandbox) -- aislamiento de ejecucion de herramientas
- [Modelo de amenazas](./threat-model) -- arquitectura de seguridad y limites de confianza

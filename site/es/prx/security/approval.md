---
title: Flujo de aprobacion
description: Como PRX gestiona llamadas a herramientas supervisadas que requieren aprobacion humana antes de la ejecucion.
---

# Flujo de aprobacion

Cuando la politica de seguridad de una herramienta esta configurada como `"supervised"`, PRX pausa la ejecucion y espera aprobacion humana antes de ejecutar la llamada a la herramienta. Esto proporciona una capa de seguridad critica para operaciones de alto riesgo -- comandos de shell, escritura de archivos, solicitudes de red, o cualquier accion que pueda tener consecuencias irreversibles.

## Vision general

El flujo de aprobacion se situa entre el bucle del agente y la ejecucion de herramientas:

```
Agent Loop
    |
    |-- LLM emite llamada a herramienta: shell("rm -rf /tmp/data")
    |
    v
+-----------------------------------+
|        Motor de politicas         |
|                                   |
|  Herramienta: "shell"             |
|  Politica: "supervised"           |
|  Accion: REQUIERE APROBACION      |
+---------------+-------------------+
                |
                v
+-----------------------------------+
|      Solicitud de aprobacion      |
|                                   |
|  Pendiente...                     |
|  |-- Notificar supervisor         |
|  |-- Esperar respuesta            |
|  +-- Timeout despues de N segs    |
+---------------+-------------------+
                |
         +------+------+
         |             |
    +----v----+   +----v----+
    | Aprobado|   | Denegado|
    |         |   |         |
    | Ejecutar|   | Retornar|
    | herram. |   | error   |
    +---------+   +---------+
```

## Configuracion

### Configurar politicas de herramientas

Configura que herramientas requieren aprobacion en `config.toml`:

```toml
[security.tool_policy]
# Politica por defecto para todas las herramientas.
# "allow" -- ejecutar inmediatamente
# "deny" -- bloquear ejecucion completamente
# "supervised" -- requiere aprobacion antes de la ejecucion
default = "allow"

# Sobreescrituras de politica por herramienta.
[security.tool_policy.tools]
shell = "supervised"
file_write = "supervised"
http_request = "supervised"
git_operations = "allow"
memory_store = "allow"
browser = "deny"

# Politicas a nivel de grupo.
[security.tool_policy.groups]
sessions = "allow"
automation = "supervised"
```

### Configuracion de aprobacion

```toml
[security.approval]
# Cuanto tiempo esperar una respuesta antes del timeout (segundos).
timeout_secs = 300

# Accion cuando la aprobacion expira: "deny" o "allow".
# "deny" es el valor seguro por defecto -- solicitudes sin respuesta son rechazadas.
on_timeout = "deny"

# Canal de notificacion para solicitudes de aprobacion.
# El supervisor es notificado a traves de este canal.
notify_channel = "telegram"

# ID de usuario o identificador del supervisor.
# Solo este usuario puede aprobar o denegar solicitudes.
supervisor_id = "admin"

# Patrones de auto-aprobacion: llamadas a herramientas que coincidan con estos patrones
# se aprueban automaticamente sin intervencion humana.
# Usar con precaucion.
[[security.approval.auto_approve]]
tool = "shell"
command_pattern = "^(ls|cat|head|tail|wc|grep|find|echo) "

[[security.approval.auto_approve]]
tool = "file_write"
path_pattern = "^/tmp/"
```

## Flujo de aprobacion

### Paso 1: Verificacion de politica

Cuando el agente emite una llamada a herramienta, el motor de politicas la evalua:

1. Verificar politica por herramienta (`security.tool_policy.tools.<nombre>`)
2. Si no hay politica por herramienta, verificar politica de grupo (`security.tool_policy.groups.<grupo>`)
3. Si no hay politica de grupo, usar la politica por defecto (`security.tool_policy.default`)

Si la politica resuelta es `"supervised"`, se activa el flujo de aprobacion.

### Paso 2: Verificacion de auto-aprobacion

Antes de notificar al supervisor, PRX verifica si la solicitud coincide con algun patron `auto_approve`. Las reglas de auto-aprobacion usan patrones regex para coincidir con argumentos de herramientas:

| Campo | Descripcion |
|-------|-------------|
| `tool` | Nombre de la herramienta a la que aplica la regla |
| `command_pattern` | Patron regex comparado contra el comando de shell (para la herramienta `shell`) |
| `path_pattern` | Patron regex comparado contra rutas de archivo (para `file_write`, `file_read`) |
| `url_pattern` | Patron regex comparado contra URLs (para `http_request`) |
| `args_pattern` | Patron regex comparado contra los argumentos JSON completos |

Si se encuentra una coincidencia, la solicitud se auto-aprueba y la ejecucion procede inmediatamente. Esto es util para comandos seguros de solo lectura que crearian fatiga excesiva de aprobacion.

### Paso 3: Notificacion

Si ninguna regla de auto-aprobacion coincide, PRX crea una solicitud de aprobacion y notifica al supervisor:

```
[APROBACION REQUERIDA]

Herramienta: shell
Argumentos: {"command": "rm -rf /tmp/data"}
Sesion: abc-123
Agente: default
Hora: 2026-03-21 14:30:22 UTC

Responder con:
  /approve -- ejecutar la llamada a herramienta
  /deny -- rechazar la llamada a herramienta
  /deny reason: <explicacion> -- rechazar con motivo
```

La notificacion se envia a traves del `notify_channel` configurado. Canales soportados:

| Canal | Metodo de notificacion |
|-------|----------------------|
| Telegram | Mensaje al chat del supervisor |
| Discord | DM al supervisor |
| Slack | DM al supervisor |
| CLI | Prompt en terminal (stdin) |
| Email | Email a la direccion configurada |
| Webhook | HTTP POST a la URL configurada |

### Paso 4: Espera

El bucle del agente se pausa mientras espera la respuesta del supervisor. Durante este tiempo:

- El agente no puede ejecutar ninguna herramienta (la llamada actual bloquea)
- Otras sesiones continuan operando independientemente
- La solicitud de aprobacion tiene un ID unico para seguimiento

### Paso 5: Resolucion

El supervisor responde con una de:

| Respuesta | Efecto |
|-----------|--------|
| **Aprobar** | La llamada a herramienta se ejecuta normalmente y el resultado se devuelve al agente |
| **Denegar** | La llamada a herramienta es rechazada y un mensaje de error se devuelve al agente |
| **Denegar con motivo** | Igual que denegar, pero el motivo se incluye en el mensaje de error para que el agente pueda adaptarse |
| **Timeout** | Se aplica la accion `on_timeout` (por defecto: denegar) |

## Ciclo de vida de la solicitud

Cada solicitud de aprobacion transiciona a traves de estos estados:

```
PENDING → APPROVED → EXECUTED
       → DENIED
       → TIMED_OUT
       → CANCELLED (si la sesion termina antes de la resolucion)
```

| Estado | Descripcion |
|--------|-------------|
| `PENDING` | Esperando respuesta del supervisor |
| `APPROVED` | Supervisor aprobo, herramienta ejecutandose |
| `EXECUTED` | Ejecucion de herramienta completada tras aprobacion |
| `DENIED` | Supervisor denego explicitamente la solicitud |
| `TIMED_OUT` | Sin respuesta dentro de `timeout_secs` |
| `CANCELLED` | Sesion terminada antes de la resolucion |

## Interfaces de aprobacion

En modo CLI, las solicitudes de aprobacion aparecen como prompts interactivos en terminal con nombre de herramienta, argumentos y nivel de riesgo. Para acceso programatico, PRX expone una API REST:

```bash
# Listar solicitudes pendientes / aprobar / denegar
curl http://localhost:8080/api/approvals?status=pending
curl -X POST http://localhost:8080/api/approvals/{id}/approve
curl -X POST http://localhost:8080/api/approvals/{id}/deny \
  -d '{"reason": "Not permitted"}'
```

## Registro de auditoria

Todas las decisiones de aprobacion se registran en el registro de actividad con los campos: `request_id`, `tool`, `arguments`, `session_id`, `decision`, `decided_by`, `decided_at`, `reason` y `execution_result`. Accede via `prx audit approvals --last 50` o exporta con `--format json`.

## Notas de seguridad

- **Denegar por defecto en timeout** -- siempre configura `on_timeout = "deny"` en produccion. Permitir que solicitudes sin respuesta procedan anula el proposito de la supervision.
- **Auto-aprobar con cuidado** -- patrones de auto-aprobacion excesivamente amplios pueden eludir el flujo de aprobacion. Usa patrones regex especificos y revisalos regularmente.
- **Autenticacion del supervisor** -- asegurate de que el `notify_channel` autentica al supervisor. Un canal de notificacion comprometido podria permitir aprobaciones no autorizadas.
- **Limitacion de tasa** -- si un agente activa repetidamente solicitudes de aprobacion para la misma operacion, considera actualizar la politica a `"deny"` para esa herramienta o agregar una regla de auto-aprobacion mas especifica.
- **Multi-supervisor** -- en despliegues de equipo, considera configurar multiples supervisores. Cualquiera de ellos puede aprobar o denegar.

## Paginas relacionadas

- [Vision general de seguridad](/es/prx/security/)
- [Motor de politicas](/es/prx/security/policy-engine)
- [Sandbox](/es/prx/security/sandbox)
- [Registro de auditoria](/es/prx/security/audit)
- [Vision general de herramientas](/es/prx/tools/)

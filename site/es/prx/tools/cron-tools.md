---
title: Herramientas cron
description: Nueve herramientas para crear, gestionar y ejecutar tareas programadas con expresiones cron y el motor de tareas autonomas Xin.
---

# Herramientas cron

PRX proporciona nueve herramientas para automatizacion de tareas basada en tiempo, abarcando gestion tradicional de trabajos cron y el motor avanzado de programacion Xin. Estas herramientas permiten al agente crear tareas programadas, inspeccionar el historial de trabajos, disparar ejecuciones manuales y orquestar operaciones en segundo plano con horarios recurrentes.

Las herramientas cron se dividen en dos sistemas: el **subsistema cron** para trabajos programados estandar usando expresiones cron, y el **motor Xin** para programacion avanzada de tareas con cadenas de dependencia, ejecucion condicional e integracion con el pipeline de auto-evolucion.

Todas las herramientas cron y de programacion se registran en el registro `all_tools()` y estan disponibles siempre que el daemon este en ejecucion.

## Configuracion

### Sistema cron

```toml
[cron]
enabled = true
timezone = "UTC"           # Zona horaria para expresiones cron

# Definir tareas programadas integradas
[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"     # Cada dia a las 09:00 UTC
action = "agent"
prompt = "Generate a daily summary report and send it to the user."

[[cron.tasks]]
name = "memory-cleanup"
schedule = "0 3 * * *"     # Cada dia a las 03:00 UTC
action = "agent"
prompt = "Run memory hygiene: archive old daily entries and compact core memories."

[[cron.tasks]]
name = "repo-check"
schedule = "*/30 * * * *"  # Cada 30 minutos
action = "shell"
command = "cd /home/user/project && git fetch --all"
```

### Motor Xin

```toml
[xin]
enabled = true
interval_minutes = 5            # Intervalo de tick en minutos (minimo 1)
max_concurrent = 4              # Maximo de ejecuciones concurrentes de tareas por tick
max_tasks = 128                 # Maximo total de tareas en el almacen
stale_timeout_minutes = 60      # Minutos antes de marcar una tarea en ejecucion como obsoleta
builtin_tasks = true            # Auto-registrar tareas integradas del sistema
evolution_integration = false   # Dejar que Xin gestione la programacion de evolucion/aptitud
```

## Referencia de herramientas

### cron_add

Agrega un nuevo trabajo cron con una expresion cron, comando o prompt, y descripcion opcional.

```json
{
  "name": "cron_add",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 2 * * *",
    "action": "shell",
    "command": "tar czf /tmp/workspace-$(date +%Y%m%d).tar.gz /home/user/workspace",
    "description": "Daily workspace backup at 2 AM"
  }
}
```

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `name` | `string` | Si | -- | Nombre unico para el trabajo cron |
| `schedule` | `string` | Si | -- | Expresion cron (5 campos: minuto hora dia mes dia_semana) |
| `action` | `string` | Si | -- | Tipo de accion: `"shell"` (ejecutar comando) o `"agent"` (ejecutar prompt de agente) |
| `command` | `string` | Condicional | -- | Comando de shell (requerido cuando `action = "shell"`) |
| `prompt` | `string` | Condicional | -- | Prompt de agente (requerido cuando `action = "agent"`) |
| `description` | `string` | No | -- | Descripcion legible |

### cron_list

Lista todos los trabajos cron registrados con sus horarios, estado y proxima ejecucion.

### cron_remove

Elimina un trabajo cron por su nombre o ID.

### cron_update

Actualiza el horario, comando o configuracion de un trabajo cron existente.

### cron_run

Dispara manualmente un trabajo cron inmediatamente, fuera de su horario normal.

### cron_runs

Ve el historial de ejecucion y registros de ejecuciones de trabajos cron.

### schedule

Programa una tarea unica o recurrente con expresiones de tiempo en lenguaje natural.

```json
{
  "name": "schedule",
  "arguments": {
    "when": "in 30 minutes",
    "action": "agent",
    "prompt": "Check if the deployment completed and report the status."
  }
}
```

### cron (Heredado)

Punto de entrada cron heredado para compatibilidad retroactiva. Enruta a la herramienta cron apropiada basandose en el argumento de accion.

### xin

El motor de programacion Xin para automatizacion avanzada de tareas con cadenas de dependencia y ejecucion condicional.

## Formato de expresiones cron

PRX usa expresiones cron estandar de 5 campos:

```
+------------- minuto (0-59)
| +----------- hora (0-23)
| | +--------- dia del mes (1-31)
| | | +------- mes (1-12)
| | | | +----- dia de la semana (0-7, 0 y 7 = Domingo)
| | | | |
* * * * *
```

**Ejemplos:**

| Expresion | Descripcion |
|-----------|-------------|
| `0 9 * * *` | Cada dia a las 9:00 AM |
| `*/15 * * * *` | Cada 15 minutos |
| `0 9 * * 1-5` | Dias laborables a las 9:00 AM |
| `0 0 1 * *` | Primer dia de cada mes a medianoche |
| `30 8,12,18 * * *` | A las 8:30, 12:30 y 18:30 diariamente |

## Motor Xin

El motor Xin es un programador avanzado de tareas que va mas alla del simple temporizador cron:

- **Cadenas de dependencia**: Las tareas pueden depender de la finalizacion exitosa de otras tareas
- **Ejecucion condicional**: Las tareas se ejecutan solo cuando se cumplen las condiciones especificadas
- **Tareas integradas**: Las tareas de mantenimiento del sistema (heartbeat, higiene de memoria, rotacion de logs) se auto-registran cuando `builtin_tasks = true`
- **Integracion de evolucion**: Cuando `evolution_integration = true`, Xin gestiona la programacion de auto-evolucion y verificacion de aptitud
- **Deteccion de obsolescencia**: Las tareas que se ejecutan mas tiempo que `stale_timeout_minutes` se marcan como obsoletas y pueden limpiarse
- **Ejecucion concurrente**: Multiples tareas pueden ejecutarse en paralelo, limitadas por `max_concurrent`

## Seguridad

### Sandboxing de comandos shell

Los trabajos cron con `action = "shell"` se ejecutan a traves del mismo sandbox que la herramienta `shell`. El backend de sandbox configurado (Landlock, Firejail, Bubblewrap, Docker) se aplica a los comandos programados.

### Seguridad de prompts de agente

Los trabajos cron con `action = "agent"` generan una nueva sesion de agente con el prompt configurado. La sesion del agente hereda las politicas de seguridad del daemon, restricciones de herramientas y limites de recursos.

### Motor de politicas

Las herramientas cron son gobernadas por el motor de politicas de seguridad:

```toml
[security.tool_policy.groups]
automation = "allow"

[security.tool_policy.tools]
cron_add = "supervised"    # Requiere aprobacion para agregar nuevos trabajos
cron_remove = "supervised" # Requiere aprobacion para eliminar trabajos
cron_run = "allow"         # Permitir disparos manuales
```

## Relacionado

- [Sistema cron](/es/prx/cron/) -- arquitectura y tareas integradas
- [Heartbeat cron](/es/prx/cron/heartbeat) -- monitoreo de salud
- [Tareas cron](/es/prx/cron/tasks) -- tareas de mantenimiento integradas
- [Auto-evolucion](/es/prx/self-evolution/) -- integracion de evolucion de Xin
- [Ejecucion shell](/es/prx/tools/shell) -- sandbox para trabajos cron basados en shell
- [Referencia de configuracion](/es/prx/config/reference) -- configuraciones `[cron]` y `[xin]`
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro

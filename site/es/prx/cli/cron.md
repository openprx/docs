---
title: prx cron
description: Gestionar tareas cron programadas que se ejecutan en el demonio PRX.
---

# prx cron

Gestiona las tareas programadas que se ejecutan en el programador cron de PRX. Las tareas cron pueden ejecutar prompts de LLM, comandos de shell o invocaciones de herramientas en un horario definido.

## Uso

```bash
prx cron <SUBCOMANDO> [OPTIONS]
```

## Subcomandos

### `prx cron list`

Lista todas las tareas cron configuradas y su estado.

```bash
prx cron list [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--json` | `-j` | `false` | Salida en formato JSON |
| `--verbose` | `-v` | `false` | Mostrar detalles completos de la tarea incluyendo la expresion del horario |

**Ejemplo de salida:**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

Agrega una nueva tarea cron.

```bash
prx cron add [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--name` | `-n` | requerido | Nombre de la tarea |
| `--schedule` | `-s` | requerido | Expresion cron (5 o 6 campos) |
| `--prompt` | `-p` | | Prompt de LLM a ejecutar |
| `--command` | `-c` | | Comando de shell a ejecutar |
| `--channel` | | | Canal donde enviar la salida |
| `--provider` | `-P` | por defecto de config | Proveedor de LLM para tareas de prompt |
| `--model` | `-m` | por defecto del proveedor | Modelo para tareas de prompt |
| `--enabled` | | `true` | Habilitar la tarea inmediatamente |

Se debe proporcionar `--prompt` o `--command`.

```bash
# Programar un resumen diario
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# Programar un comando de respaldo
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# Informe semanal cada lunes a las 10am
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

Elimina una tarea cron por ID o nombre.

```bash
prx cron remove <ID|NOMBRE> [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--force` | `-f` | `false` | Omitir confirmacion |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

Pausa una tarea cron. La tarea permanece configurada pero no se ejecutara hasta que se reanude.

```bash
prx cron pause <ID|NOMBRE>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

Reanuda una tarea cron pausada.

```bash
prx cron resume <ID|NOMBRE>
```

```bash
prx cron resume weekly-report
```

## Formato de expresion cron

PRX usa expresiones cron estandar de 5 campos:

```
 ┌───────── minuto (0-59)
 │ ┌───────── hora (0-23)
 │ │ ┌───────── dia del mes (1-31)
 │ │ │ ┌───────── mes (1-12)
 │ │ │ │ ┌───────── dia de la semana (0-7, 0 y 7 = domingo)
 │ │ │ │ │
 * * * * *
```

Ejemplos comunes:

| Expresion | Descripcion |
|-----------|-------------|
| `0 9 * * *` | Todos los dias a las 9:00 AM |
| `*/15 * * * *` | Cada 15 minutos |
| `0 */6 * * *` | Cada 6 horas |
| `0 10 * * 1` | Cada lunes a las 10:00 AM |
| `0 0 1 * *` | Primer dia de cada mes a medianoche |

## Relacionado

- [Vision general de programacion](/es/prx/cron/) -- arquitectura cron y heartbeat
- [Tareas cron](/es/prx/cron/tasks) -- tipos de tareas y detalles de ejecucion
- [prx daemon](./daemon) -- el demonio que ejecuta el programador cron

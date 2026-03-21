---
title: Tareas integradas
description: Referencia de tareas programadas integradas en el sistema cron de PRX.
---

# Tareas integradas

PRX incluye varias tareas cron integradas que manejan el mantenimiento rutinario. Estas tareas se ejecutan automaticamente cuando el sistema cron esta habilitado.

## Referencia de tareas

| Tarea | Programacion por defecto | Descripcion |
|-------|-------------------------|-------------|
| `heartbeat` | Cada 30s | Verificacion de salud del sistema |
| `memory-hygiene` | Diariamente a las 3:00 | Compactar y podar entradas de memoria |
| `log-rotation` | Diariamente a las 0:00 | Rotar y comprimir archivos de log antiguos |
| `cache-cleanup` | Cada hora | Eliminar entradas de cache expiradas |
| `metrics-export` | Cada 5m | Exportar metricas a los backends configurados |
| `signature-update` | Cada 6h | Actualizar firmas de amenazas (si la integracion PRX-SD esta habilitada) |

## Configuracion

Cada tarea integrada puede habilitarse/deshabilitarse individualmente y reprogramarse:

```toml
[cron.builtin.memory_hygiene]
enabled = true
schedule = "0 3 * * *"

[cron.builtin.log_rotation]
enabled = true
schedule = "0 0 * * *"
max_log_age_days = 30

[cron.builtin.cache_cleanup]
enabled = true
schedule = "0 * * * *"
```

## Tareas personalizadas

Ademas de las tareas integradas, puedes definir tareas de agente personalizadas que ejecutan un prompt segun un horario:

```toml
[[cron.tasks]]
name = "weekly-cleanup"
schedule = "0 2 * * 0"  # Sundays at 2:00 AM
action = "agent"
prompt = "Review and archive old conversation logs"
timeout_secs = 300
```

## Paginas relacionadas

- [Vision general del sistema cron](./)
- [Heartbeat](./heartbeat)
- [Higiene de memoria](/es/prx/memory/hygiene)

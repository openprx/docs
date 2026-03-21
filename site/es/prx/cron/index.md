---
title: Sistema cron
description: Vision general del sistema cron de PRX para ejecucion de tareas programadas y monitoreo de heartbeat.
---

# Sistema cron

El sistema cron de PRX proporciona ejecucion de tareas programadas para el daemon. Maneja tareas de mantenimiento recurrentes, monitoreo de heartbeat y tareas programadas definidas por el usuario.

## Vision general

El sistema cron se ejecuta como parte del daemon de PRX y gestiona:

- **Heartbeat** -- verificaciones periodicas de salud e informes de estado
- **Tareas de mantenimiento** -- higiene de memoria, rotacion de logs, limpieza de cache
- **Tareas de usuario** -- acciones programadas personalizadas del agente

## Arquitectura

```
┌─────────────────────────┐
│     Cron Scheduler       │
│                          │
│  ┌────────────────────┐  │
│  │  Heartbeat (30s)   │  │
│  ├────────────────────┤  │
│  │  Memory Hygiene    │  │
│  ├────────────────────┤  │
│  │  Log Rotation      │  │
│  ├────────────────────┤  │
│  │  User Tasks        │  │
│  └────────────────────┘  │
└─────────────────────────┘
```

## Configuracion

```toml
[cron]
enabled = true
timezone = "UTC"

[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"  # cron expression
action = "agent"
prompt = "Generate a daily summary report"
```

## Paginas relacionadas

- [Heartbeat](./heartbeat)
- [Tareas integradas](./tasks)

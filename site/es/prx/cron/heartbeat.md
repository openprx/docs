---
title: Heartbeat
description: Verificaciones periodicas de salud e informes de estado en el sistema cron de PRX.
---

# Heartbeat

El heartbeat es una verificacion periodica de salud que monitorea el estado operativo del daemon de PRX. Se ejecuta a un intervalo configurable (por defecto: 30 segundos) e informa sobre la salud del sistema.

## Que verifica

- **Proceso daemon** -- si el daemon esta respondiendo
- **Conectividad de proveedores** -- si los proveedores LLM configurados son alcanzables
- **Uso de memoria** -- si el consumo de memoria esta dentro de los limites
- **Espacio en disco** -- si hay suficiente espacio en disco disponible para almacenamiento de datos
- **Sesiones activas** -- cantidad y estado de las sesiones de agente en ejecucion

## Estado de salud

El heartbeat publica el estado a traves de:

- Entradas de log a nivel debug
- El endpoint de API `/health`
- Metricas de Prometheus (cuando estan habilitadas)
- URL opcional de verificacion de salud externa

## Configuracion

```toml
[cron.heartbeat]
interval_secs = 30
check_providers = true
check_disk_space = true
disk_space_threshold_mb = 100
external_health_url = ""  # optional: POST status to external URL
```

## Paginas relacionadas

- [Vision general del sistema cron](./)
- [Observabilidad](/es/prx/observability/)
- [Metricas de Prometheus](/es/prx/observability/prometheus)

---
title: Observabilidad
description: Vision general de las caracteristicas de observabilidad de PRX incluyendo metricas, trazado y registro.
---

# Observabilidad

PRX proporciona observabilidad completa a traves de metricas, trazado distribuido y registro estructurado. Estas caracteristicas permiten monitoreo, depuracion y optimizacion del rendimiento de las operaciones del agente.

## Vision general

| Caracteristica | Backend | Proposito |
|---------------|---------|-----------|
| [Metricas de Prometheus](./prometheus) | Prometheus | Monitoreo cuantitativo (tasas de solicitudes, latencias, errores) |
| [OpenTelemetry](./opentelemetry) | Compatible con OTLP | Trazado distribuido y analisis a nivel de span |
| Registro estructurado | stdout/archivo | Logs operativos detallados |

## Inicio rapido

Habilita la observabilidad en `config.toml`:

```toml
[observability]
log_level = "info"
log_format = "json"  # "json" | "pretty"

[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"

[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"
```

## Metricas clave

PRX expone metricas para:

- **Rendimiento del agente** -- duracion de sesion, turnos por sesion, llamadas a herramientas
- **Proveedor LLM** -- latencia de solicitudes, uso de tokens, tasas de error, costo
- **Memoria** -- latencia de recuperacion, tamano del almacen, frecuencia de compactacion
- **Sistema** -- uso de CPU, consumo de memoria, conexiones activas

## Paginas relacionadas

- [Metricas de Prometheus](./prometheus)
- [Trazado OpenTelemetry](./opentelemetry)
- [Heartbeat](/es/prx/cron/heartbeat)

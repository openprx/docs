---
title: Metricas de Prometheus
description: Endpoint de metricas de Prometheus y metricas disponibles en PRX.
---

# Metricas de Prometheus

PRX expone un endpoint de metricas compatible con Prometheus para integracion con sistemas de monitoreo como Grafana, Datadog y AlertManager.

## Endpoint

Cuando esta habilitado, las metricas estan disponibles en:

```
http://127.0.0.1:9090/metrics
```

## Metricas disponibles

### Metricas del agente

| Metrica | Tipo | Descripcion |
|---------|------|-------------|
| `prx_sessions_total` | Counter | Total de sesiones creadas |
| `prx_sessions_active` | Gauge | Sesiones activas actualmente |
| `prx_session_duration_seconds` | Histogram | Duracion de sesion |
| `prx_turns_total` | Counter | Total de turnos de conversacion |
| `prx_tool_calls_total` | Counter | Total de llamadas a herramientas (por nombre de herramienta) |

### Metricas del proveedor LLM

| Metrica | Tipo | Descripcion |
|---------|------|-------------|
| `prx_llm_requests_total` | Counter | Total de solicitudes LLM (por proveedor, modelo) |
| `prx_llm_request_duration_seconds` | Histogram | Latencia de solicitudes LLM |
| `prx_llm_tokens_total` | Counter | Total de tokens (entrada/salida, por modelo) |
| `prx_llm_errors_total` | Counter | Errores LLM (por tipo) |
| `prx_llm_cost_dollars` | Counter | Costo estimado en USD |

### Metricas del sistema

| Metrica | Tipo | Descripcion |
|---------|------|-------------|
| `prx_memory_usage_bytes` | Gauge | Uso de memoria del proceso |
| `prx_cpu_usage_ratio` | Gauge | Uso de CPU del proceso |

## Configuracion

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## Paginas relacionadas

- [Vision general de observabilidad](./)
- [Trazado OpenTelemetry](./opentelemetry)

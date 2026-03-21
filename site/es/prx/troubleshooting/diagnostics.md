---
title: Diagnosticos
description: Procedimientos y herramientas de diagnostico detallados para depurar problemas de PRX.
---

# Diagnosticos

Esta pagina cubre procedimientos de diagnostico avanzados para investigar problemas de PRX que no se resuelven con los pasos basicos de solucion de problemas.

## Comandos de diagnostico

### prx doctor

La verificacion de salud completa:

```bash
prx doctor
```

La salida incluye:
- Resultados de validacion de configuracion
- Pruebas de conectividad de proveedores
- Verificaciones de dependencias del sistema
- Resumen de uso de recursos

### prx debug

Habilita el registro a nivel debug para trazas detalladas de operacion:

```bash
PRX_LOG=debug prx daemon
```

O configuralo en el archivo de configuracion:

```toml
[observability]
log_level = "debug"
```

### prx info

Muestra informacion del sistema:

```bash
prx info
```

Muestra:
- Version de PRX e informacion de compilacion
- SO y arquitectura
- Proveedores configurados y su estado
- Tipo y tamano del backend de memoria
- Conteo y estado de plugins

## Analisis de logs

Los logs de PRX son JSON estructurado (cuando `log_format = "json"`). Campos clave a buscar:

| Campo | Descripcion |
|-------|-------------|
| `level` | Nivel de log (debug, info, warn, error) |
| `target` | Ruta del modulo Rust |
| `session_id` | ID de sesion asociado |
| `provider` | Proveedor LLM involucrado |
| `duration_ms` | Duracion de la operacion |
| `error` | Detalles del error (si aplica) |

## Diagnosticos de red

Prueba la conectividad de proveedores:

```bash
# Probar API de Anthropic
prx provider test anthropic

# Probar todos los proveedores configurados
prx provider test --all

# Verificar red desde el sandbox
prx sandbox test-network
```

## Perfilado de rendimiento

Habilita el endpoint de metricas y usa Prometheus/Grafana para analisis de rendimiento:

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
```

Metricas clave a monitorear:
- `prx_llm_request_duration_seconds` -- latencia LLM
- `prx_sessions_active` -- sesiones concurrentes
- `prx_memory_usage_bytes` -- consumo de memoria

## Paginas relacionadas

- [Vision general de solucion de problemas](./)
- [Observabilidad](/es/prx/observability/)
- [Metricas Prometheus](/es/prx/observability/prometheus)

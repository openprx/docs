---
title: OpenTelemetry
description: Trazado distribuido con OpenTelemetry en PRX para analisis a nivel de span.
---

# OpenTelemetry

PRX soporta OpenTelemetry (OTLP) para trazado distribuido. Las trazas proporcionan visibilidad a nivel de span en las operaciones del agente, incluyendo llamadas LLM, ejecuciones de herramientas y operaciones de memoria.

## Vision general

Cada operacion del agente crea una traza con spans anidados:

```
Session
  └── Turn
       ├── Memory Recall (span)
       ├── LLM Request (span)
       │    ├── Token Streaming
       │    └── Response Parsing
       └── Tool Execution (span)
            ├── Policy Check
            └── Sandbox Run
```

## Configuracion

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP gRPC endpoint
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # 0.0 to 1.0
```

## Backends soportados

PRX puede exportar trazas a cualquier backend compatible con OTLP:

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray (via colector OTLP)

## Atributos de span

Atributos comunes adjuntos a los spans:

| Atributo | Descripcion |
|----------|-------------|
| `prx.session_id` | Identificador de sesion del agente |
| `prx.provider` | Nombre del proveedor LLM |
| `prx.model` | Identificador del modelo |
| `prx.tool` | Nombre de la herramienta (para spans de herramientas) |
| `prx.tokens.input` | Conteo de tokens de entrada |
| `prx.tokens.output` | Conteo de tokens de salida |

## Paginas relacionadas

- [Vision general de observabilidad](./)
- [Metricas de Prometheus](./prometheus)

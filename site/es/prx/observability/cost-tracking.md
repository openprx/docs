---
title: Seguimiento de costos
description: Rastrear uso de tokens, costos de API y alertas de presupuesto en todos los proveedores LLM en PRX.
---

# Seguimiento de costos

PRX incluye un sistema de seguimiento de costos integrado que monitorea el consumo de tokens y el gasto en API a traves de todos los proveedores LLM. El `CostTracker` acumula el uso por solicitud, por sesion y por proveedor -- dandote visibilidad completa de como tus agentes consumen recursos de API.

## Vision general

Cada solicitud LLM en PRX genera un registro `TokenUsage` que contiene tokens de entrada, tokens de salida y el costo asociado. Estos registros son agregados por el `CostTracker` y pueden consultarse para informes, aplicacion de presupuestos y deteccion de anomalias.

```
LLM Request
    │
    ├── Provider returns usage metadata
    │   (input_tokens, output_tokens, cache hits)
    │
    ▼
TokenUsage record created
    │
    ├── Accumulated into CostTracker
    │   ├── Per-request breakdown
    │   ├── Per-session totals
    │   ├── Per-provider totals
    │   └── Per-model totals
    │
    ├── Budget check (if limits configured)
    │   ├── Under budget → continue
    │   └── Over budget → warning / hard stop
    │
    └── Written to observability pipeline
        (metrics, logs, tracing spans)
```

## Configuracion

Habilita y configura el seguimiento de costos en `config.toml`:

```toml
[cost]
enabled = true

# Currency for display purposes (does not affect calculations).
currency = "USD"

# How often to flush accumulated costs to persistent storage.
flush_interval_secs = 60

# Persist cost data across restarts.
persist = true
persist_path = "~/.local/share/openprx/cost.db"
```

### Limites de presupuesto

Establece limites de gasto para prevenir costos desbocados:

```toml
[cost.budget]
# Daily spending limit across all providers.
daily_limit = 10.00

# Monthly spending limit.
monthly_limit = 200.00

# Per-session limit (resets when a new session starts).
session_limit = 2.00

# Action when a limit is reached: "warn" or "stop".
# "warn" logs a warning but allows requests to continue.
# "stop" blocks further LLM requests until the period resets.
on_limit = "warn"
```

### Limites por proveedor

Sobreescribe los limites de presupuesto para proveedores especificos:

```toml
[cost.budget.providers.openai]
daily_limit = 5.00
monthly_limit = 100.00

[cost.budget.providers.anthropic]
daily_limit = 8.00
monthly_limit = 150.00
```

## Estructura TokenUsage

Cada solicitud LLM produce un registro `TokenUsage`:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `input_tokens` | u64 | Numero de tokens en el prompt (sistema + usuario + contexto) |
| `output_tokens` | u64 | Numero de tokens en la respuesta del modelo |
| `cache_read_tokens` | u64 | Tokens servidos desde cache del proveedor (cache de prompts de Anthropic) |
| `cache_write_tokens` | u64 | Tokens escritos en cache del proveedor |
| `total_tokens` | u64 | `input_tokens + output_tokens` |
| `cost` | f64 | Costo estimado en la moneda configurada |
| `provider` | string | Nombre del proveedor (ej., "openai", "anthropic") |
| `model` | string | Identificador del modelo (ej., "gpt-4o", "claude-sonnet-4-20250514") |
| `timestamp` | datetime | Cuando se realizo la solicitud |
| `session_id` | string | Sesion del agente que genero la solicitud |

## CostTracker

El `CostTracker` es el punto central de agregacion para todo el uso de tokens. Mantiene totales acumulados por proveedor, por modelo, por sesion, diarios (se reinicia a medianoche UTC) y mensuales (se reinicia el dia 1). El rastreador es thread-safe y se actualiza despues de cada respuesta LLM.

## Datos de precios

PRX mantiene una tabla de precios integrada para proveedores y modelos comunes. Los precios se definen por millon de tokens:

| Proveedor | Modelo | Entrada (por 1M) | Salida (por 1M) |
|-----------|--------|-------------------|------------------|
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| OpenAI | o3 | $10.00 | $40.00 |
| Anthropic | claude-sonnet-4-20250514 | $3.00 | $15.00 |
| Anthropic | claude-haiku-35-20241022 | $0.80 | $4.00 |
| Anthropic | claude-opus-4-20250514 | $15.00 | $75.00 |
| Google | gemini-2.0-flash | $0.075 | $0.30 |
| DeepSeek | deepseek-chat | $0.14 | $0.28 |

### Precios personalizados

Sobreescribe o agrega precios para modelos que no estan en la tabla integrada:

```toml
[cost.pricing."openai/gpt-4o"]
input_per_million = 2.50
output_per_million = 10.00

[cost.pricing."custom/my-model"]
input_per_million = 1.00
output_per_million = 3.00
```

Para modelos auto-alojados (Ollama, vLLM) donde las llamadas API son gratuitas, establece el precio en cero:

```toml
[cost.pricing."ollama/llama3"]
input_per_million = 0.0
output_per_million = 0.0
```

## Informes de uso

### Comandos CLI

```bash
# View current session cost summary
prx cost

# View daily breakdown
prx cost --period daily

# View monthly breakdown by provider
prx cost --period monthly --group-by provider

# View costs for a specific date range
prx cost --from 2026-03-01 --to 2026-03-15

# Export to CSV
prx cost --period monthly --format csv > costs.csv

# Export to JSON (for programmatic consumption)
prx cost --period daily --format json
```

### Ejemplo de salida

```
PRX Cost Report (2026-03-21)
════════════════════════════════════════════════════
Provider     Model                   Tokens (in/out)    Cost
─────────────────────────────────────────────────────────────
anthropic    claude-sonnet-4-20250514      45.2K / 12.8K    $0.33
openai       gpt-4o                  22.1K / 8.4K     $0.14
openai       gpt-4o-mini              8.3K / 3.1K     $0.00
─────────────────────────────────────────────────────────────
Total                                75.6K / 24.3K    $0.47

Budget Status:
  Session: $0.47 / $2.00 (23.5%)
  Daily:   $3.82 / $10.00 (38.2%)
  Monthly: $42.15 / $200.00 (21.1%)
```

## Alertas de presupuesto

Cuando el costo se acerca a un limite de presupuesto, PRX toma accion segun la configuracion `on_limit`:

| Umbral | `on_limit = "warn"` | `on_limit = "stop"` |
|--------|--------------------|--------------------|
| 80% del limite | Registrar advertencia | Registrar advertencia |
| 100% del limite | Registrar error, continuar | Bloquear solicitudes LLM, notificar al usuario |
| Reinicio del limite (nuevo dia/mes) | Contadores reiniciados | Contadores reiniciados, solicitudes desbloqueadas |

Las alertas de presupuesto tambien se emiten como eventos de observabilidad. Cuando las metricas de Prometheus estan habilitadas, se exportan los siguientes gauges:

```
prx_cost_daily_total{currency="USD"} 3.82
prx_cost_monthly_total{currency="USD"} 42.15
prx_cost_session_total{currency="USD"} 0.47
prx_cost_budget_daily_remaining{currency="USD"} 6.18
prx_cost_budget_monthly_remaining{currency="USD"} 157.85
```

## Integracion con observabilidad

Los datos de costo se integran con la pila de observabilidad de PRX:

- **Prometheus** -- conteos de tokens y gauges de costo por proveedor/modelo
- **OpenTelemetry** -- atributos de span `prx.tokens.input`, `prx.tokens.output`, `prx.cost`
- **Logs** -- costo por solicitud registrado a nivel DEBUG, advertencias de presupuesto a nivel WARN

## Notas de seguridad

- Los datos de costo pueden revelar patrones de uso. Restringe el acceso a los informes de costo en despliegues multi-usuario.
- La base de datos persistente de costos (`cost.db`) contiene historial de uso. Incluyela en tu estrategia de respaldo.
- Los limites de presupuesto se aplican localmente. No interactuan con los limites de gasto del lado del proveedor. Configura ambos para defensa en profundidad.

## Paginas relacionadas

- [Vision general de observabilidad](/es/prx/observability/)
- [Metricas de Prometheus](/es/prx/observability/prometheus)
- [OpenTelemetry](/es/prx/observability/opentelemetry)
- [Configuracion de proveedores](/es/prx/providers/)

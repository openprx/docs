---
title: Referencia de configuracion CTE
description: Referencia completa de configuracion del Motor de Arbol Causal de PRX.
---

# Referencia de configuracion CTE

El Motor de Arbol Causal se configura a traves de la seccion `[causal_tree]` en su archivo de configuracion PRX.

> **El CTE esta desactivado por defecto.** Todos los parametros a continuacion solo tienen efecto cuando `causal_tree.enabled = true`.

## Ejemplo completo

```toml
[causal_tree]
enabled = true

w_confidence = 0.50
w_cost = 0.25
w_latency = 0.25

write_decision_log = true
write_metrics = true

[causal_tree.policy]
max_branches = 3
commit_threshold = 0.62
extra_token_ratio_limit = 0.35
extra_latency_budget_ms = 300
rehearsal_timeout_ms = 5000
default_side_effect_mode = "read_only"
circuit_breaker_threshold = 5
circuit_breaker_cooldown_secs = 60
```

## Referencia de parametros

### Parametros de nivel superior

| Parametro | Tipo | Predeterminado | Descripcion |
|-----------|------|---------------|------------|
| `enabled` | bool | `false` | Interruptor principal. Si es `false`, el CTE se omite completamente. |
| `w_confidence` | f32 | `0.50` | Peso de puntuacion para la dimension de confianza. |
| `w_cost` | f32 | `0.25` | Peso de puntuacion para la penalizacion de costo. |
| `w_latency` | f32 | `0.25` | Peso de puntuacion para la penalizacion de latencia. |
| `write_decision_log` | bool | `true` | Cuando esta habilitado, emite un registro estructurado para cada decision CTE. |
| `write_metrics` | bool | `true` | Cuando esta habilitado, recopila metricas de rendimiento CTE. |

### Parametros de politica (`[causal_tree.policy]`)

| Parametro | Tipo | Predeterminado | Descripcion |
|-----------|------|---------------|------------|
| `max_branches` | usize | `3` | Numero maximo de ramas candidatas por solicitud. |
| `commit_threshold` | f32 | `0.62` | Puntuacion compuesta minima para confirmar una rama. |
| `extra_token_ratio_limit` | f32 | `0.35` | Ratio maximo de tokens extra de CTE respecto a la solicitud base. |
| `extra_latency_budget_ms` | u64 | `300` | Latencia adicional maxima del pipeline CTE (milisegundos). |
| `rehearsal_timeout_ms` | u64 | `5000` | Tiempo de espera por ensayo individual (milisegundos). |
| `default_side_effect_mode` | string | `"read_only"` | Modo de efectos secundarios. `"read_only"` / `"dry_run"` / `"live"`. |
| `circuit_breaker_threshold` | u32 | `5` | Fallos consecutivos para disparar el disyuntor. |
| `circuit_breaker_cooldown_secs` | u64 | `60` | Periodo de enfriamiento del disyuntor (segundos). |

## Configuracion minima

```toml
[causal_tree]
enabled = true
```

## Paginas relacionadas

- [Vision general del Motor de Arbol Causal](./)
- [Referencia completa de configuracion](/es/prx/config/reference)

---
title: Skillforge
description: Pipeline automatizado de descubrimiento, evaluacion e integracion de habilidades para extender las capacidades del agente PRX.
---

# Skillforge

Skillforge es el pipeline automatizado de PRX para descubrir, evaluar e integrar nuevas habilidades (herramientas) de fuentes externas. En lugar de configurar manualmente cada herramienta, Skillforge puede explorar repositorios de GitHub y el registro Clawhub, evaluar si una habilidad descubierta se ajusta a las necesidades de tu agente y generar el manifiesto de integracion -- todo sin intervencion humana.

## Vision general

El pipeline de Skillforge consta de tres etapas:

| Etapa | Trait | Responsabilidad |
|-------|-------|----------------|
| **Explorar** | `Scout` | Descubrir habilidades candidatas de fuentes configuradas |
| **Evaluar** | `Evaluator` | Puntuar cada candidata por aptitud, seguridad y compatibilidad |
| **Integrar** | `Integrator` | Generar manifiestos y registrar habilidades en el registro de herramientas |

## Configuracion

```toml
[skillforge]
enabled = true
auto_discover = false
discover_interval_hours = 24
min_fitness_score = 0.7
require_approval = true
max_candidates = 20
```

## Notas de seguridad

- **Puertas de aprobacion** -- siempre configura `require_approval = true` en produccion
- **Aplicacion de sandbox** -- las habilidades integradas se ejecutan dentro de las mismas restricciones de sandbox que las herramientas integradas
- **Confianza de fuentes** -- solo habilita fuentes de exploracion en las que confies
- **Revision de manifiestos** -- revisa los manifiestos generados antes de la aprobacion

## Paginas relacionadas

- [Vision general de herramientas](/es/prx/tools/)
- [Pipeline de auto-evolucion](/es/prx/self-evolution/pipeline)
- [Motor de politicas de seguridad](/es/prx/security/policy-engine)
- [Backends de runtime](/es/prx/agent/runtime-backends)
- [Integracion MCP](/es/prx/tools/mcp)

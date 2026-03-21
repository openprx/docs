---
title: "L3: Evolucion de estrategia"
description: Capa 3 de auto-evolucion en PRX que cubre politicas de herramientas, optimizacion de enrutamiento y ajuste de gobernanza.
---

# L3: Evolucion de estrategia

La capa 3 es la capa de evolucion de mayor impacto y menor frecuencia. Modifica el comportamiento estrategico del agente -- politicas de acceso a herramientas, reglas de enrutamiento de LLM y parametros de gobernanza. Debido a su amplio impacto, los cambios L3 siempre requieren aprobacion explicita.

## Vision general

La evolucion L3 aborda:

- **Ajuste de politicas de herramientas** -- ajustar que herramientas estan disponibles y sus niveles de permisos
- **Optimizacion de enrutamiento** -- refinar heuristicas de seleccion de modelos basandose en datos de rendimiento
- **Parametros de gobernanza** -- ajustar umbrales de seguridad, limites de tasa y flujos de aprobacion
- **Optimizacion de costos** -- equilibrar calidad contra uso de recursos

## Como funciona

1. L3 recolecta datos de rendimiento agregados durante semanas/meses
2. Identifica patrones (ej., un modelo mas economico maneja adecuadamente el 80% de las consultas)
3. Propone cambios estrategicos con analisis de impacto esperado
4. Los cambios se ponen en cola para aprobacion humana
5. Los cambios aprobados se aplican con capacidad de rollback automatico

## Configuracion

```toml
[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
rollback_window_hours = 168  # 7 dias
max_policy_changes_per_cycle = 3
```

## Paginas relacionadas

- [Vision general de auto-evolucion](./)
- [L2: Optimizacion de prompt](./l2-prompt)
- [Pipeline de evolucion](./pipeline)
- [Seguridad y rollback](./safety)

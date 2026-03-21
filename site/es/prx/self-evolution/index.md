---
title: Sistema de auto-evolucion
description: Vision general del sistema de auto-evolucion de 3 capas de PRX para mejora autonoma de agentes.
---

# Sistema de auto-evolucion

PRX incluye un sistema de auto-evolucion de 3 capas que permite a los agentes mejorar su comportamiento de forma autonoma con el tiempo. El sistema analiza continuamente el rendimiento del agente y aplica mejoras graduales -- desde optimizacion de memoria hasta ajuste de prompts y cambios de politicas estrategicas.

## Vision general

La auto-evolucion se organiza en tres capas, cada una operando a un nivel de abstraccion diferente:

| Capa | Alcance | Frecuencia | Riesgo |
|------|---------|-----------|--------|
| [L1: Memoria](./l1-memory) | Compactacion de memoria, agrupacion por temas | Cada sesion | Bajo |
| [L2: Prompt](./l2-prompt) | Optimizacion de prompt del sistema, pruebas A/B | Diaria/semanal | Medio |
| [L3: Estrategia](./l3-strategy) | Politicas de herramientas, reglas de enrutamiento, gobernanza | Semanal/mensual | Alto |

## Arquitectura

```
+---------------------------------------+
|       Motor de auto-evolucion         |
|                                        |
|  L3: Estrategia ← Frecuencia baja     |
|    |-- Ajuste de politicas de herram.  |
|    |-- Optimizacion de enrutamiento    |
|    +-- Ajustes de gobernanza           |
|                                        |
|  L2: Prompt     ← Frecuencia media    |
|    |-- Refinamiento de prompt sistema  |
|    +-- Framework de pruebas A/B        |
|                                        |
|  L1: Memoria    ← Frecuencia alta     |
|    |-- Compactacion de memoria         |
|    +-- Agrupacion por temas            |
+---------------------------------------+
```

## Seguridad primero

Cada propuesta de evolucion pasa por un pipeline de seguridad antes de su ejecucion. Consulta [Seguridad](./safety) para detalles sobre proteccion de rollback y verificaciones de cordura.

## Configuracion

```toml
[self_evolution]
enabled = false  # solo por opt-in
auto_apply = false  # requiere aprobacion manual por defecto

[self_evolution.l1]
enabled = true
schedule = "after_session"

[self_evolution.l2]
enabled = false
schedule = "weekly"

[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
```

## Paginas relacionadas

- [L1: Compactacion de memoria](./l1-memory)
- [L2: Optimizacion de prompt](./l2-prompt)
- [L3: Ajuste de estrategia](./l3-strategy)
- [Pipeline de evolucion](./pipeline)
- [Seguridad y rollback](./safety)

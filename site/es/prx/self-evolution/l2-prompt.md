---
title: "L2: Evolucion de prompt"
description: Capa 2 de auto-evolucion en PRX que cubre optimizacion de prompt del sistema y pruebas A/B.
---

# L2: Evolucion de prompt

La capa 2 opera a frecuencia media para refinar los prompts del sistema del agente. Analiza metricas de calidad de conversacion y propone modificaciones de prompt, probandolas a traves de un framework A/B antes de su adopcion permanente.

## Vision general

La evolucion L2 aborda:

- **Refinamiento de prompt del sistema** -- mejorar la claridad de instrucciones y cobertura de tareas
- **Ajuste de persona** -- ajustar tono, verbosidad y estilo de comunicacion
- **Instrucciones de uso de herramientas** -- optimizar como se describen las herramientas al LLM
- **Pruebas A/B** -- validar estadisticamente los cambios de prompt antes del despliegue

## Framework de pruebas A/B

Cuando se propone una modificacion de prompt, L2 ejecuta tanto el prompt original como el modificado en paralelo durante un periodo de evaluacion configurable:

1. **Dividir trafico** -- alternar entre el prompt original y el candidato
2. **Recolectar metricas** -- rastrear completacion de tareas, satisfaccion del usuario, eficiencia de uso de herramientas
3. **Prueba estadistica** -- aplicar pruebas de significancia para determinar el ganador
4. **Promover o revertir** -- adoptar al ganador o mantener el original

## Configuracion

```toml
[self_evolution.l2]
enabled = false
schedule = "weekly"
min_samples = 50
confidence_level = 0.95
max_concurrent_experiments = 2
```

## Paginas relacionadas

- [Vision general de auto-evolucion](./)
- [L1: Evolucion de memoria](./l1-memory)
- [L3: Ajuste de estrategia](./l3-strategy)
- [Seguridad y rollback](./safety)

---
title: Sub-agentes
description: Como PRX genera agentes hijos para ejecucion paralela de tareas, incluyendo limites de concurrencia y control de profundidad.
---

# Sub-agentes

PRX soporta la generacion de sub-agentes (agentes hijos) desde dentro de una sesion de agente en ejecucion. Esto permite la descomposicion paralela de tareas, donde un agente padre delega trabajo a hijos especializados que se ejecutan concurrentemente.

## Vision general

Los sub-agentes son instancias de agente ligeras que:

- Comparten la configuracion de proveedor y credenciales del padre
- Tienen su propio historial de conversacion y alcance de memoria
- Se ejecutan dentro de la politica de sandbox del padre
- Reportan resultados al padre cuando completan

## Modelo de generacion

Un agente padre puede generar sub-agentes via la herramienta integrada `spawn_agent`. Cada hijo recibe:

- Una descripcion de tarea (sobreescritura del prompt del sistema)
- Un conjunto opcional de herramientas permitidas (subconjunto de las herramientas del padre)
- Un presupuesto maximo de turnos

```
Parent Agent
  ├── Sub-agent 1 (research task)
  ├── Sub-agent 2 (code generation)
  └── Sub-agent 3 (validation)
```

## Limites de concurrencia

Para prevenir el agotamiento de recursos, PRX aplica limites de concurrencia:

```toml
[agent.subagents]
max_concurrent = 4
max_depth = 3
max_total_spawns = 20
child_timeout_secs = 300
```

- **max_concurrent** -- numero maximo de agentes hijos ejecutandose simultaneamente
- **max_depth** -- profundidad maxima de anidamiento (sub-agentes generando sub-agentes)
- **max_total_spawns** -- presupuesto total de generaciones por sesion raiz
- **child_timeout_secs** -- tiempo limite para la ejecucion individual de cada hijo

## Control de profundidad

Cada sub-agente rastrea su nivel de profundidad. Cuando se alcanza la profundidad maxima, la herramienta `spawn_agent` se elimina de las herramientas disponibles del hijo, previniendo anidamiento adicional.

## Agregacion de resultados

Cuando todos los hijos completan, sus resultados se recopilan y se presentan al agente padre como resultados de llamadas a herramientas. El padre puede entonces sintetizar las salidas en una respuesta final.

## Paginas relacionadas

- [Runtime del agente](./runtime) -- Vision general de la arquitectura
- [Bucle del agente](./loop) -- Ciclo central de ejecucion
- [Session Worker](./session-worker) -- Aislamiento de procesos

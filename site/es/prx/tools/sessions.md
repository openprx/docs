---
title: Sesiones y agentes
description: Herramientas de orquestacion multi-agente para generar sub-agentes, delegar tareas y gestionar sesiones concurrentes en PRX.
---

# Sesiones y agentes

PRX proporciona ocho herramientas para orquestacion multi-agente, permitiendo a un agente padre generar agentes hijo, delegar tareas a agentes especializados y gestionar sesiones concurrentes. Esta es la base de la arquitectura de descomposicion de tareas en paralelo de PRX.

## Configuracion

```toml
[agent.subagents]
max_concurrent = 4          # Maximo de sub-agentes simultaneos
max_depth = 3               # Profundidad maxima de anidamiento
max_total_spawns = 20       # Presupuesto total de generacion por sesion raiz
child_timeout_secs = 300    # Timeout para ejecucion individual de hijos
```

### Definiciones de agentes delegados

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant. Find accurate, up-to-date information."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]

[agents.coder]
provider = "openai"
model = "gpt-4o"
system_prompt = "You are a code generation specialist. Write clean, well-tested code."
agentic = true
max_iterations = 15
allowed_tools = ["shell", "file_read", "file_write", "git_operations"]
```

## Referencia de herramientas

### sessions_spawn

Genera un sub-agente asincrono que se ejecuta en segundo plano. Retorna inmediatamente con un ID de ejecucion.

### sessions_send

Envia un mensaje a una sesion de sub-agente en ejecucion.

### sessions_list

Lista todas las sesiones activas de sub-agentes con su estado.

### sessions_history

Ve el registro de conversacion de una ejecucion de sub-agente.

### session_status

Verifica el estado de una sesion especifica.

### subagents

Gestiona el pool de sub-agentes -- listar, detener o inspeccionar sub-agentes en ejecucion.

### agents_list

Lista todos los agentes delegados configurados con sus modelos y capacidades.

### delegate

Delega una tarea a un agente con nombre con su propio proveedor, modelo y conjunto de herramientas.

## Seguridad

PRX aplica limites estrictos en la generacion de sub-agentes para prevenir agotamiento de recursos: `max_concurrent`, `max_depth`, `max_total_spawns` y `child_timeout_secs`.

Los agentes delegados tienen sus herramientas definidas explicitamente en la configuracion y no pueden acceder a herramientas fuera de su lista `allowed_tools`.

## Relacionado

- [Sub-agentes](/es/prx/agent/subagents) -- arquitectura de sub-agentes y modelo de generacion
- [Runtime del agente](/es/prx/agent/runtime) -- arquitectura de ejecucion del agente
- [Bucle del agente](/es/prx/agent/loop) -- ciclo de ejecucion principal
- [Trabajador de sesion](/es/prx/agent/session-worker) -- aislamiento de proceso para sesiones
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro

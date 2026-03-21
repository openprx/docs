---
title: Arquitectura del runtime del agente
description: Vision general del runtime del agente PRX, incluyendo el modelo de ejecucion, aislamiento de procesos y gestion del ciclo de vida.
---

# Arquitectura del runtime del agente

El runtime del agente PRX es el motor de ejecucion central que impulsa todo el comportamiento autonomo del agente. Gestiona el ciclo de vida de las sesiones del agente, coordina el despacho de herramientas, maneja las respuestas en streaming y aplica limites de recursos.

## Vision general de la arquitectura

El runtime esta construido alrededor de una arquitectura basada en eventos donde cada sesion del agente se ejecuta en un contexto de ejecucion aislado. Los componentes principales son:

- **Gestor de sesiones** -- crea y rastrea las sesiones activas del agente
- **Bucle del agente** -- el bucle de despacho central que procesa respuestas LLM y ejecuta llamadas a herramientas
- **Capa de memoria** -- proporciona recuperacion de contexto y compactacion entre turnos
- **Registro de herramientas** -- gestiona las herramientas disponibles y sus politicas de permisos

```
┌─────────────────────────────────────────┐
│              Session Manager             │
│  ┌───────────┐  ┌───────────┐           │
│  │ Session A  │  │ Session B  │  ...     │
│  │ ┌───────┐  │  │ ┌───────┐  │         │
│  │ │ Loop  │  │  │ │ Loop  │  │         │
│  │ │ Memory│  │  │ │ Memory│  │         │
│  │ │ Tools │  │  │ │ Tools │  │         │
│  │ └───────┘  │  │ └───────┘  │         │
│  └───────────┘  └───────────┘           │
└─────────────────────────────────────────┘
```

## Modelo de ejecucion

Cada sesion del agente sigue un ciclo de solicitud-respuesta:

1. **Recibir entrada del usuario** -- mensaje de texto, resultado de herramienta o evento del sistema
2. **Construir contexto** -- ensamblar prompt del sistema, memoria e historial de conversacion
3. **Inferencia LLM** -- transmitir la respuesta desde el proveedor configurado
4. **Despacho de herramientas** -- si el LLM emite llamadas a herramientas, ejecutarlas en el sandbox
5. **Continuar o retornar** -- continuar el bucle si se llamaron herramientas, o retornar la respuesta final

## Configuracion

El comportamiento del runtime se puede ajustar en `config.toml`:

```toml
[agent]
max_turns = 50
max_tool_calls_per_turn = 10
session_timeout_secs = 3600
stream_buffer_size = 64

[agent.limits]
max_concurrent_sessions = 8
max_memory_mb = 512
```

## Aislamiento de procesos

Las sesiones del agente pueden ejecutarse opcionalmente en procesos separados para aislamiento de fallos. Consulta [Session Worker](./session-worker) para detalles sobre el modelo de ejecucion con aislamiento de procesos.

## Paginas relacionadas

- [Bucle del agente](./loop) -- Despacho de herramientas, streaming, recuperacion de memoria
- [Sub-agentes](./subagents) -- Creacion de agentes hijos con control de concurrencia
- [Session Worker](./session-worker) -- Ejecucion de sesiones con aislamiento de procesos

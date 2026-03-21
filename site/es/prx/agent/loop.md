---
title: Bucle del agente
description: El bucle central del agente en PRX, cubriendo despacho de herramientas, streaming, recuperacion de memoria y compactacion de contexto.
---

# Bucle del agente

El bucle del agente es el ciclo de ejecucion central que impulsa cada sesion del agente PRX. Cada iteracion procesa una respuesta LLM, despacha llamadas a herramientas, gestiona la memoria y decide si continuar o retornar una respuesta final.

## Ciclo de vida del bucle

```
User Message
    │
    ▼
┌─────────────┐
│ Build Context│──── Memory Recall
└──────┬──────┘
       ▼
┌─────────────┐
│ LLM Inference│──── Streaming Response
└──────┬──────┘
       ▼
┌─────────────┐
│ Parse Output │──── Tool Calls / Text
└──────┬──────┘
       ▼
   Tool Calls?
   ├── Yes ──→ Execute Tools ──→ Loop Again
   └── No  ──→ Return Response
```

## Despacho de herramientas

Cuando la respuesta LLM contiene llamadas a herramientas, el bucle:

1. Valida cada llamada a herramienta contra la politica de seguridad
2. Ejecuta las llamadas aprobadas (potencialmente en paralelo)
3. Recopila los resultados y los retroalimenta al LLM
4. Continua el bucle para el siguiente paso de inferencia

## Streaming

PRX transmite las respuestas LLM token por token al cliente mientras simultaneamente almacena en buffer para la deteccion de llamadas a herramientas. El pipeline de streaming soporta:

- Reenvio de tokens en tiempo real a clientes CLI o WebSocket
- Manejo de contrapresion cuando el cliente es lento
- Cancelacion ordenada via Ctrl+C o senales de API

## Recuperacion de memoria

Antes de cada llamada LLM, el bucle recupera contexto relevante del sistema de memoria:

- Turnos de conversacion recientes (ventana deslizante)
- Resultados de busqueda semantica del almacen de embeddings
- Hechos fijados y preferencias del usuario

## Compactacion de contexto

Cuando la conversacion excede la ventana de contexto del modelo, el bucle activa la compactacion:

1. Resumir turnos mas antiguos en una representacion condensada
2. Preservar resultados de llamadas a herramientas que aun estan referenciados
3. Mantener el prompt del sistema y las memorias fijadas intactos

## Configuracion

```toml
[agent.loop]
max_iterations = 50
parallel_tool_calls = true
compaction_threshold_tokens = 80000
compaction_strategy = "summarize"  # o "truncate"
```

## Paginas relacionadas

- [Runtime del agente](./runtime) -- Vision general de la arquitectura
- [Sub-agentes](./subagents) -- Creacion de agentes hijos
- [Sistema de memoria](/es/prx/memory/) -- Backends de memoria y recuperacion

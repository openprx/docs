---
title: Agent Runtime Architecture
description: Apercu de le PRX agent runtime, including le execution model, process isolation, and lifecycle management.
---

# Agent Runtime Architecture

Le runtime d'agent PRX est le moteur d'execution central qui pilote tout le comportement autonome de l'agent. It manages the lifecycle of session d'agents, coordinates tool dispatch, handles reponses en streaming, and applique resource limits.

## Architecture Overview

Le runtime est construit autour de an event-driven architecture where each session d'agent s'execute dans an isolated execution context. The main components are:

- **Session Manager** -- creates and tracks active session d'agents
- **Agent Loop** -- the central dispatch loop qui traite LLM responses and executes appels d'outils
- **Memory Layer** -- provides context recall and compaction across tours
- **Tool Registry** -- manages available tools and their permission policies

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

## Modele d'execution

Each session d'agent follows a request-response cycle:

1. **Receive user input** -- text message, resultat d'outil, or system event
2. **Build context** -- assemble system prompt, memory, and conversation history
3. **LLM inference** -- stream la reponse depuis le configured fournisseur
4. **Tool dispatch** -- if le LLM emet appels d'outils, execute them in le sandbox
5. **Loop or retour** -- continue the loop if tools were called, or retour the final response

## Configuration

Le runtime behavior peut etre tuned in `config.toml`:

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

## Process Isolation

Agent sessions can optionally run in separate processes for fault isolation. See [Session Worker](./session-worker) for details on le processus-isolated execution model.

## Voir aussi Pages

- [Agent Loop](./loop) -- Tool dispatch, streaming, memory recall
- [Sub-agents](./subagents) -- Spawning child agents with concurrency control
- [Session Worker](./session-worker) -- Process-isolated session execution

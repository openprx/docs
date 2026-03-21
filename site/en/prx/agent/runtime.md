---
title: Agent Runtime Architecture
description: Overview of the PRX agent runtime, including the execution model, process isolation, and lifecycle management.
---

# Agent Runtime Architecture

The PRX agent runtime is the core execution engine that drives all autonomous agent behavior. It manages the lifecycle of agent sessions, coordinates tool dispatch, handles streaming responses, and enforces resource limits.

## Architecture Overview

The runtime is built around an event-driven architecture where each agent session runs in an isolated execution context. The main components are:

- **Session Manager** -- creates and tracks active agent sessions
- **Agent Loop** -- the central dispatch loop that processes LLM responses and executes tool calls
- **Memory Layer** -- provides context recall and compaction across turns
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

## Execution Model

Each agent session follows a request-response cycle:

1. **Receive user input** -- text message, tool result, or system event
2. **Build context** -- assemble system prompt, memory, and conversation history
3. **LLM inference** -- stream the response from the configured provider
4. **Tool dispatch** -- if the LLM emits tool calls, execute them in the sandbox
5. **Loop or return** -- continue the loop if tools were called, or return the final response

## Configuration

The runtime behavior can be tuned in `config.toml`:

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

Agent sessions can optionally run in separate processes for fault isolation. See [Session Worker](./session-worker) for details on the process-isolated execution model.

## Related Pages

- [Agent Loop](./loop) -- Tool dispatch, streaming, memory recall
- [Sub-agents](./subagents) -- Spawning child agents with concurrency control
- [Session Worker](./session-worker) -- Process-isolated session execution

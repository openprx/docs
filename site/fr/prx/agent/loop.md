---
title: Boucle d'agent
description: Le core agent loop in PRX, covering tool dispatch, streaming, memory recall, and context compaction.
---

# Agent Loop

L'boucle de l'agent est le central execution cycle that drives every PRX session d'agent. Each iteration processes an LLM response, dispatches appels d'outils, manages memory, et decides whether to continue ou retour a final answer.

## Loop Lifecycle

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

## Tool Dispatch

When le LLM response contains appels d'outils, the loop:

1. Validates each appel d'outil against the politique de securite
2. Executes approved calls (potentially in parallel)
3. Collects results and feeds them back to le LLM
4. Continues the loop pour le next inference step

## Streaming

PRX streams LLM responses token-by-token to le client tandis que simultaneously buffering for tool-call detection. The streaming pipeline supports:

- Real-time token forwarding to CLI or WebSocket clients
- Backpressure handling when le client is slow
- Graceful cancellation via Ctrl+C or API signals

## Memory Recall

Before each LLM call, the loop recupere relevant context depuis le systeme de memoire:

- Recent conversation tours (sliding window)
- Semantic search results depuis le embedding store
- Pinned facts and user preferences

## Context Compaction

When the conversation exceeds the model's context window, the loop triggers compaction:

1. Summarize older tours dans un condensed representation
2. Preserve appel d'outil results that are still referenced
3. Maintain le systeme prompt and pinned memories intact

## Configuration

```toml
[agent.loop]
max_iterations = 50
parallel_tool_calls = true
compaction_threshold_tokens = 80000
compaction_strategy = "summarize"  # or "truncate"
```

## Voir aussi Pages

- [Agent Runtime](./runtime) -- Architecture overview
- [Sub-agents](./subagents) -- Child agent spawning
- [Memory System](/fr/prx/memory/) -- Memory backends and recall

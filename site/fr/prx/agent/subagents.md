---
title: Sub-agents
description: How PRX spawns child agents for parallel task execution, including concurrency limits and depth control.
---

# Sub-agents

PRX prend en charge lancement de sub-agents (child agents) from within a running session d'agent. Cela permet parallel task decomposition, where a parent agent delegates work to specialized children that run concurrently.

## Apercu

Sub-agents are lightweight agent instances that:

- Share the parent's fournisseur configuration and credentials
- Have their own conversation history and memory scope
- Execute within the parent's sandbox policy
- Report results back vers le parent when complete

## Spawning Model

A parent agent can spawn sub-agents via the built-in `spawn_agent` tool. Each child receives:

- A task description (system prompt override)
- An optional set of allowed tools (subset of parent's tools)
- A maximum tour budget

```
Parent Agent
  ├── Sub-agent 1 (research task)
  ├── Sub-agent 2 (code generation)
  └── Sub-agent 3 (validation)
```

## Concurrency Limites

To prevent epuisement des ressources, PRX applique concurrency limits:

```toml
[agent.subagents]
max_concurrent = 4
max_depth = 3
max_total_spawns = 20
child_timeout_secs = 300
```

- **max_concurrent** -- maximum number of child agents running simultaneously
- **max_depth** -- maximum nesting depth (sub-agents lancement de sub-agents)
- **max_total_lance** -- total spawn budget per root session
- **child_timeout_secs** -- timeout for individual child execution

## Depth Control

Each sub-agent tracks its depth level. When the maximum depth is reached, the `spawn_agent` tool is removed depuis le child's available tools, preventing further nesting.

## Result Aggregation

When all children complete, their results are collected et presented vers le parent agent comme unppel d'outil results. The parent can then synthesize la sorties dans un final response.

## Voir aussi Pages

- [Agent Runtime](./runtime) -- Architecture overview
- [Agent Loop](./loop) -- Core execution cycle
- [Session Worker](./session-worker) -- Process isolation

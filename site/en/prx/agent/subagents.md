---
title: Sub-agents
description: How PRX spawns child agents for parallel task execution, including concurrency limits and depth control.
---

# Sub-agents

PRX supports spawning sub-agents (child agents) from within a running agent session. This enables parallel task decomposition, where a parent agent delegates work to specialized children that run concurrently.

## Overview

Sub-agents are lightweight agent instances that:

- Share the parent's provider configuration and credentials
- Have their own conversation history and memory scope
- Execute within the parent's sandbox policy
- Report results back to the parent when complete

## Spawning Model

A parent agent can spawn sub-agents via the built-in `spawn_agent` tool. Each child receives:

- A task description (system prompt override)
- An optional set of allowed tools (subset of parent's tools)
- A maximum turn budget

```
Parent Agent
  ├── Sub-agent 1 (research task)
  ├── Sub-agent 2 (code generation)
  └── Sub-agent 3 (validation)
```

## Concurrency Limits

To prevent resource exhaustion, PRX enforces concurrency limits:

```toml
[agent.subagents]
max_concurrent = 4
max_depth = 3
max_total_spawns = 20
child_timeout_secs = 300
```

- **max_concurrent** -- maximum number of child agents running simultaneously
- **max_depth** -- maximum nesting depth (sub-agents spawning sub-agents)
- **max_total_spawns** -- total spawn budget per root session
- **child_timeout_secs** -- timeout for individual child execution

## Depth Control

Each sub-agent tracks its depth level. When the maximum depth is reached, the `spawn_agent` tool is removed from the child's available tools, preventing further nesting.

## Result Aggregation

When all children complete, their results are collected and presented to the parent agent as tool call results. The parent can then synthesize the outputs into a final response.

## Related Pages

- [Agent Runtime](./runtime) -- Architecture overview
- [Agent Loop](./loop) -- Core execution cycle
- [Session Worker](./session-worker) -- Process isolation

---
title: "L2: Prompt Evolution"
description: Layer 2 self-evolution in PRX covering system prompt optimization and A/B testing.
---

# L2: Prompt Evolution

Layer 2 operates at medium frequency to refine the agent's system prompts. It analyzes conversation quality metrics and proposes prompt modifications, testing them through an A/B framework before permanent adoption.

## Overview

L2 evolution addresses:

- **System prompt refinement** -- improve instruction clarity and task coverage
- **Persona tuning** -- adjust tone, verbosity, and communication style
- **Tool usage instructions** -- optimize how tools are described to the LLM
- **A/B testing** -- statistically validate prompt changes before rollout

## A/B Testing Framework

When a prompt modification is proposed, L2 runs both the original and modified prompts in parallel for a configurable evaluation period:

1. **Split traffic** -- alternate between original and candidate prompts
2. **Collect metrics** -- track task completion, user satisfaction, tool usage efficiency
3. **Statistical test** -- apply significance testing to determine the winner
4. **Promote or rollback** -- adopt the winner or keep the original

## Configuration

```toml
[self_evolution.l2]
enabled = false
schedule = "weekly"
min_samples = 50
confidence_level = 0.95
max_concurrent_experiments = 2
```

## Related Pages

- [Self-Evolution Overview](./)
- [L1: Memory Evolution](./l1-memory)
- [L3: Strategy Tuning](./l3-strategy)
- [Safety & Rollback](./safety)

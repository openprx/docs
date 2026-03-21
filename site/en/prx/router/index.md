---
title: LLM Router
description: Overview of the PRX intelligent LLM router for model selection, cost optimization, and quality balancing.
---

# LLM Router

The PRX router is an intelligent model selection system that automatically chooses the best LLM provider and model for each request. It balances quality, cost, and latency using multiple routing strategies.

## Overview

Instead of always using a single model, the router dynamically selects from configured models based on:

- Query complexity and type
- Model capability scores and Elo ratings
- Cost constraints
- Latency requirements
- Historical performance data

## Routing Strategies

| Strategy | Description | Best For |
|----------|-------------|---------|
| [Heuristic](./heuristic) | Rule-based scoring using query features | Simple setups, predictable behavior |
| [KNN](./knn) | Semantic similarity to past successful queries | Learned routing, high accuracy |
| [Automix](./automix) | Start cheap, escalate on low confidence | Cost optimization |

## Configuration

```toml
[router]
enabled = true
strategy = "heuristic"  # "heuristic" | "knn" | "automix"
default_model = "anthropic/claude-sonnet-4-6"

[router.models]
cheap = "anthropic/claude-haiku"
standard = "anthropic/claude-sonnet-4-6"
premium = "anthropic/claude-opus-4-6"
```

## Related Pages

- [Heuristic Router](./heuristic)
- [KNN Router](./knn)
- [Automix Router](./automix)
- [LLM Providers](/en/prx/providers/)

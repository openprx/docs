---
title: Causal Tree Engine
description: Overview of the PRX Causal Tree Engine (CTE) — speculative multi-branch prediction with rehearsal, scoring, and automatic circuit breaker.
---

# Causal Tree Engine

The Causal Tree Engine (CTE) is a speculative execution system that evaluates multiple response strategies in parallel before committing to the best one. It integrates into the PRX agent pipeline between intent classification and LLM invocation.

> **Disabled by default.** The CTE is opt-in — set `causal_tree.enabled = true` in your config to activate it.

## How It Works

```text
snapshot → expand → rehearse → score → select → feedback
```

1. **Snapshot** — Captures the current causal state (session context, budget, constraints)
2. **Expand** — Generates candidate branches (e.g., direct answer, tool use, sub-agent delegation)
3. **Rehearse** — Runs lightweight "dry runs" of promising branches in read-only mode
4. **Score** — Ranks branches by a weighted composite of confidence, cost, and latency
5. **Select** — Commits the top-scoring branch if it meets the threshold; otherwise falls back
6. **Feedback** — Logs the decision for observability and future learning

## When to Enable CTE

The CTE adds value for complex, multi-step agent tasks where choosing the wrong approach wastes significant tokens or time. For simple Q&A workloads, the overhead may not be justified.

| Scenario | Recommendation |
|----------|---------------|
| Simple Q&A, casual chat | Leave CTE **disabled** |
| Multi-step tool use workflows | Enable CTE |
| Autonomous agent tasks (Xin/evolution) | Enable CTE |
| Cost-sensitive deployments | Enable CTE with tight `extra_token_ratio_limit` |

## Quick Start

Add to your PRX config file (`~/.openprx/config.toml`):

```toml
[causal_tree]
enabled = true
```

All other parameters have sensible defaults. See [Configuration Reference](./configuration) for the full parameter list.

## Architecture

```text
                    ┌──────────────────────────────┐
                    │       CausalTreeEngine        │
                    │      (pipeline orchestrator)   │
                    └──┬───┬───┬───┬───┬───┬───────┘
                       │   │   │   │   │   │
              Snapshot Expand Rehearse Score Select Feedback
                 │      │      │      │     │      │
                 ▼      ▼      ▼      ▼     ▼      ▼
              State  Expander  Engine Scorer Selector Writer
```

All components are injected via `Arc<dyn Trait>` for runtime polymorphism. The engine uses **composition** rather than a super-trait to avoid a "God Object" pattern.

## Circuit Breaker

The CTE includes a built-in circuit breaker to prevent cascading failures:

- After `circuit_breaker_threshold` consecutive failures (default: 5), the CTE trips and all requests bypass it
- After `circuit_breaker_cooldown_secs` (default: 60s), the circuit breaker allows a retry
- A single successful run resets the failure counter

## Metrics

The CTE tracks key performance indicators:

| Metric | Description |
|--------|-------------|
| `hit_at_1_ratio` | Fraction of runs where the first-ranked branch was correct |
| `hit_at_3_ratio` | Fraction where the correct branch was in top-3 |
| `wasted_speculation_ratio` | Rehearsals performed but not used |
| `commit_success_rate` | Successful commit percentage |
| `avg_extra_latency_ms` | Average additional latency per run |
| `circuit_breaker_trips` | Number of times the circuit breaker tripped |

Enable metrics with `causal_tree.write_metrics = true` (default).

## Related Pages

- [Configuration Reference](./configuration)
- [Agent Runtime](/en/prx/agent/runtime)
- [LLM Router](/en/prx/router/)
- [Observability](/en/prx/observability/)

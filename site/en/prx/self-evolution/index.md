---
title: Self-Evolution System
description: Overview of the PRX 3-layer self-evolution system for autonomous agent improvement.
---

# Self-Evolution System

PRX includes a 3-layer self-evolution system that enables agents to autonomously improve their behavior over time. The system continuously analyzes agent performance and applies graduated improvements -- from memory optimization to prompt tuning to strategic policy changes.

## Overview

Self-evolution is organized into three layers, each operating at a different level of abstraction:

| Layer | Scope | Frequency | Risk |
|-------|-------|-----------|------|
| [L1: Memory](./l1-memory) | Memory compaction, topic clustering | Every session | Low |
| [L2: Prompt](./l2-prompt) | System prompt optimization, A/B testing | Daily/weekly | Medium |
| [L3: Strategy](./l3-strategy) | Tool policies, routing rules, governance | Weekly/monthly | High |

## Architecture

```
┌───────────────────────────────────────┐
│         Self-Evolution Engine          │
│                                        │
│  L3: Strategy    ← Low frequency       │
│    ├── Tool policy tuning              │
│    ├── Routing optimization            │
│    └── Governance adjustments          │
│                                        │
│  L2: Prompt      ← Medium frequency    │
│    ├── System prompt refinement        │
│    └── A/B testing framework           │
│                                        │
│  L1: Memory      ← High frequency      │
│    ├── Memory compaction               │
│    └── Topic clustering                │
└───────────────────────────────────────┘
```

## Safety First

Every evolution proposal passes through a safety pipeline before execution. See [Safety](./safety) for details on rollback protection and sanity checks.

## Configuration

```toml
[self_evolution]
enabled = false  # opt-in only
auto_apply = false  # require manual approval by default

[self_evolution.l1]
enabled = true
schedule = "after_session"

[self_evolution.l2]
enabled = false
schedule = "weekly"

[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
```

## Related Pages

- [L1: Memory Compaction](./l1-memory)
- [L2: Prompt Optimization](./l2-prompt)
- [L3: Strategy Tuning](./l3-strategy)
- [Evolution Pipeline](./pipeline)
- [Safety & Rollback](./safety)

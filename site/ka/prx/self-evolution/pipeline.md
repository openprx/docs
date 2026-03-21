---
title: ევოლუციის პაიპლაინი
description: The 4-stage self-evolution pipeline in PRX -- gate, analyze, judge, execute.
---

# Evolution Pipeline

Every self-evolution proposal in PRX passes through a 4-stage pipeline: gate, analyze, judge, and execute. This pipeline ensures that changes are well-reasoned, safe, and reversible.

## Pipeline Stages

```
┌────────┐    ┌─────────┐    ┌────────┐    ┌─────────┐
│  Gate  │───►│ Analyze │───►│ Judge  │───►│ Execute │
└────────┘    └─────────┘    └────────┘    └─────────┘
```

### 1. Gate

The gate stage determines whether an evolution cycle should trigger. It checks:

- Schedule conditions (time-based triggers)
- Data sufficiency (enough samples for analysis)
- System health (no active incidents)
- Rate limits (maximum changes per time window)

### 2. Analyze

The analysis stage examines collected data to identify improvement opportunities:

- Performance metrics aggregation
- Pattern detection and anomaly identification
- Comparison against baselines
- Proposal generation with expected impact estimates

### 3. Judge

The judgment stage evaluates proposals for safety and correctness:

- Sanity checks against predefined invariants
- Risk assessment scoring
- Conflict detection with existing policies
- Approval routing (automatic for L1, manual for L3)

### 4. Execute

The execution stage applies approved changes:

- Create a rollback snapshot
- Apply the change atomically
- Monitor for regression signals
- Auto-rollback if sanity checks fail

## კონფიგურაცია

```toml
[self_evolution.pipeline]
gate_check_interval_secs = 3600
min_data_points = 100
health_check_url = "http://localhost:3120/health"
```

## Related Pages

- [Self-Evolution Overview](./)
- [Safety & Rollback](./safety)

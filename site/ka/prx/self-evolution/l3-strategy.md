---
title: "L3: Strategy Evolution"
description: Layer 3 self-evolution in PRX covering tool policies, routing optimization, and governance tuning.
---

# L3: Strategy Evolution

Layer 3 is the highest-impact and lowest-frequency evolution layer. It modifies the agent's strategic behavior -- tool access policies, LLM routing rules, and governance parameters. Due to its broad impact, L3 changes always require explicit approval.

## მიმოხილვა

L3 evolution addresses:

- **Tool policy tuning** -- adjust which tools are available and their permission levels
- **Routing optimization** -- refine model selection heuristics based on performance data
- **Governance parameters** -- tune safety thresholds, rate limits, and approval workflows
- **Cost optimization** -- balance quality against resource usage

## როგორ მუშაობს

1. L3 collects aggregate performance data over weeks/months
2. It identifies patterns (e.g., a cheaper model handles 80% of queries adequately)
3. It proposes strategic changes with expected impact analysis
4. Changes are queued for human approval
5. Approved changes are applied with automatic rollback capability

## კონფიგურაცია

```toml
[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
rollback_window_hours = 168  # 7 days
max_policy_changes_per_cycle = 3
```

## Related Pages

- [Self-Evolution Overview](./)
- [L2: Prompt Optimization](./l2-prompt)
- [Evolution Pipeline](./pipeline)
- [Safety & Rollback](./safety)

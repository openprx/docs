---
title: CTE Configuration
description: Full configuration reference for the PRX Causal Tree Engine.
---

# CTE Configuration Reference

The Causal Tree Engine is configured via the `[causal_tree]` section in your PRX config file.

> **The CTE is disabled by default.** All parameters below only take effect when `causal_tree.enabled = true`.

## Full Example

```toml
[causal_tree]
enabled = true                  # Master switch (default: false)

# Scoring weights (must sum to 1.0)
w_confidence = 0.50             # Weight for confidence dimension
w_cost = 0.25                   # Weight for cost penalty
w_latency = 0.25                # Weight for latency penalty

# Logging
write_decision_log = true       # Log every CTE decision (default: true)
write_metrics = true            # Collect CTE metrics (default: true)

[causal_tree.policy]
max_branches = 3                # Max candidate branches to expand
commit_threshold = 0.62         # Minimum score to commit a branch
extra_token_ratio_limit = 0.35  # Max CTE overhead as ratio of baseline tokens
extra_latency_budget_ms = 300   # Max additional latency budget (ms)
rehearsal_timeout_ms = 5000     # Per-rehearsal timeout (ms)
default_side_effect_mode = "read_only"  # Rehearsal side-effect mode
circuit_breaker_threshold = 5   # Consecutive failures to trip breaker
circuit_breaker_cooldown_secs = 60  # Cooldown before retry (seconds)
```

## Parameter Reference

### Top-Level Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | bool | `false` | Master switch. When `false`, the CTE is completely bypassed. |
| `w_confidence` | f32 | `0.50` | Scoring weight for the confidence dimension. Higher values favor branches the model is more confident about. |
| `w_cost` | f32 | `0.25` | Scoring weight for cost penalty. Higher values penalize expensive branches more. |
| `w_latency` | f32 | `0.25` | Scoring weight for latency penalty. Higher values penalize slow branches more. |
| `write_decision_log` | bool | `true` | When enabled, emits a structured log entry for every CTE decision via `tracing::info!`. |
| `write_metrics` | bool | `true` | When enabled, collects CTE performance metrics (hit ratios, latency, etc.). |

### Policy Parameters (`[causal_tree.policy]`)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_branches` | usize | `3` | Maximum number of candidate branches the expander will generate per request. |
| `commit_threshold` | f32 | `0.62` | Minimum composite score required to commit a branch. Branches below this score are rejected. |
| `extra_token_ratio_limit` | f32 | `0.35` | Maximum ratio of extra tokens consumed by CTE overhead relative to the baseline request. Exceeding this triggers degradation. |
| `extra_latency_budget_ms` | u64 | `300` | Maximum additional latency (in milliseconds) the CTE pipeline is allowed to add. |
| `rehearsal_timeout_ms` | u64 | `5000` | Timeout for a single rehearsal run in milliseconds. |
| `default_side_effect_mode` | string | `"read_only"` | Side-effect mode for rehearsals. Options: `"read_only"`, `"dry_run"`, `"live"`. |
| `circuit_breaker_threshold` | u32 | `5` | Number of consecutive CTE failures before the circuit breaker trips. |
| `circuit_breaker_cooldown_secs` | u64 | `60` | Duration in seconds the circuit breaker stays open before allowing a retry. |

### Scoring Weights

The three scoring weights (`w_confidence`, `w_cost`, `w_latency`) should sum to `1.0`. The composite score for each branch is calculated as:

```
score = w_confidence * confidence - w_cost * normalized_cost - w_latency * normalized_latency
```

**Tuning tips:**

- **Cost-sensitive** — Increase `w_cost` (e.g., `0.40`) and decrease `w_confidence` (e.g., `0.40`)
- **Latency-sensitive** — Increase `w_latency` (e.g., `0.40`)
- **Quality-first** — Increase `w_confidence` (e.g., `0.70`) and decrease others

### Side-Effect Modes

| Mode | Description |
|------|-------------|
| `read_only` | Rehearsals cannot perform any write operations. Safest option. |
| `dry_run` | Rehearsals simulate writes but don't persist them. |
| `live` | Rehearsals can perform real writes. Use with caution. |

## Minimal Configuration

To enable CTE with all defaults:

```toml
[causal_tree]
enabled = true
```

## Related Pages

- [Causal Tree Engine Overview](./)
- [Full Configuration Reference](/en/prx/config/reference)

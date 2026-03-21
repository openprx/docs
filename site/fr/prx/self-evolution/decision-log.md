---
title: Journal de decisions
description: Decision logging during self-evolution cycles -- what gets recorded, format, analysis, and rollback tracing.
---

# Decision Log

Chaque decision made during a self-evolution cycle est enregistre in a structured decision log. This log provides a complete piste d'audit of what the evolution system decided, why it decided it, et what happened comme un result -- enabling post-hoc analysis, debugging, et safe rollback.

## Apercu

The decision log captures the full lifecycle of evolution decisions:

- **Proposal generation** -- quelle amelioration a ete proposee et pourquoi
- **Evaluation** -- how the proposal was scored against safety and fitness criteria
- **Verdict** -- whether the proposal wcomme unpproved, rejected, or deferred
- **Execution** -- quels changements ont ete appliques et leurs effets immediats
- **Outcome** -- measured results after the change, incluant any regressions

Unlike the security journal d'audit (which records all security events), the decision log is specifically focused sur le self-evolution system's reasoning process.

## Decision Record Structure

Each decision is stored comme un structured record:

| Champ | Type | Description |
|-------|------|-------------|
| `decision_id` | `String` | Unique identifier (UUIDv7, time-ordered) |
| `cycle_id` | `String` | The evolution cycle that produced this decision |
| `layer` | `Layer` | Evolution layer: `L1` (memory), `L2` (prompt), or `L3` (strategy) |
| `timestamp` | `DateTime<Utc>` | When the decision was recorded |
| `proposal` | `Proposal` | The proposed change (type, description, parameters) |
| `rationale` | `String` | Explanation of why this change was proposed |
| `data_points` | `usize` | Number of data samples that informed the decision |
| `fitness_before` | `f64` | Fitness score before the change |
| `fitness_after` | `Option<f64>` | Fitness score after the change (populated post-execution) |
| `verdict` | `Verdict` | `approved`, `rejected`, `deferred`, or `auto_approved` |
| `verdict_reason` | `String` | Why the verdict was reached (e.g., safety check result) |
| `executed` | `bool` | Whether the change wcomme unctually applied |
| `rollback_id` | `Option<String>` | Reference vers le rollback snapshot, if one was created |
| `outcome` | `Option<Outcome>` | Post-execution outcome: `improved`, `neutral`, `regressed`, or `rolled_back` |

### Verdict Types

| Verdict | Description | Trigger |
|---------|-------------|---------|
| `auto_approved` | Approved automatically by le pipeline | L1 changes with risk score below threshold |
| `approved` | Approved after evaluation | L2/L3 changes that pass safety checks |
| `rejected` | Rejected par le safety pipeline | Failed sanity checks, risk too high, or conflicts detected |
| `deferred` | Postponed for later evaluation | Insufficient data or system health concerns |

## Configuration

```toml
[self_evolution.decision_log]
enabled = true
storage = "file"                # "file" or "database"
path = "~/.local/share/openprx/decisions/"
format = "jsonl"                # "jsonl" or "json" (pretty-printed)
retention_days = 180            # auto-delete entries older than 180 days
max_entries = 10000             # maximum entries before rotation

[self_evolution.decision_log.database]
backend = "sqlite"
path = "~/.local/share/openprx/decisions.db"
```

## Configuration Reference

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable or disable decision logging |
| `storage` | `String` | `"file"` | Storage backend: `"file"` or `"database"` |
| `path` | `String` | `"~/.local/share/openprx/decisions/"` | Directory for log files (file mode) |
| `format` | `String` | `"jsonl"` | File format: `"jsonl"` (compact) or `"json"` (human-readable) |
| `retention_days` | `u64` | `180` | Auto-delete entries older than N days. 0 = keep forever |
| `max_entries` | `usize` | `10000` | Maximum entries per file before rotation |
| `database.backend` | `String` | `"sqlite"` | Database backend: `"sqlite"` or `"postgres"` |
| `database.path` | `String` | `""` | Database path (SQLite) or connection URL (PostgreSQL) |

## Exemple Decision Record

```json
{
  "decision_id": "019520b0-5678-7000-8000-000000000042",
  "cycle_id": "cycle_2026-03-21T03:00:00Z",
  "layer": "L2",
  "timestamp": "2026-03-21T03:05:12.345Z",
  "proposal": {
    "type": "prompt_refinement",
    "description": "Shorten system prompt preamble by 15% to reduce token usage",
    "parameters": {
      "target": "system_prompt.preamble",
      "old_token_count": 320,
      "new_token_count": 272
    }
  },
  "rationale": "Analysis of 500 sessions shows the preamble consumes 8% of context window with low recall contribution. A/B test variant with shortened preamble showed 3% improvement in response relevance.",
  "data_points": 500,
  "fitness_before": 0.72,
  "fitness_after": 0.75,
  "verdict": "approved",
  "verdict_reason": "Passed all safety checks. Risk score 0.12 (threshold: 0.5). No conflicts with existing policies.",
  "executed": true,
  "rollback_id": "snap_019520b0-5678-7000-8000-000000000043",
  "outcome": "improved"
}
```

## Querying the Decision Log

### CLI Commands

```bash
# View recent decisions
prx evolution decisions --tail 20

# Filter by layer
prx evolution decisions --layer L2 --last 30d

# Filter by verdict
prx evolution decisions --verdict rejected --last 7d

# Filter by outcome
prx evolution decisions --outcome regressed

# Show a specific decision with full details
prx evolution decisions --id 019520b0-5678-7000-8000-000000000042

# Export decisions for analysis
prx evolution decisions --last 90d --format json > decisions_q1.json
```

### Programmatic Access

The decision log is accessible via the gateway API:

```bash
# List recent decisions
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions?limit=20

# Get a specific decision
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions/019520b0-5678-7000-8000-000000000042
```

## Analyzing Decision Patterns

The decision log enables several types of analysis:

### Approval Rate by Layer

Track what percentage of proposals are approved at each layer to understand the evolution system's effectiveness:

```bash
prx evolution stats --last 90d
```

Example output:

```
Layer   Proposed  Approved  Rejected  Deferred  Approval Rate
L1      142       138       2         2         97.2%
L2      28        19        6         3         67.9%
L3      5         2         3         0         40.0%
```

### Regression Detection

Identify decisions that led to regressions:

```bash
prx evolution decisions --outcome regressed --last 90d
```

Each regressed decision includes the `fitness_before` and `fitness_after` values, making it straightforward to measure the impact and correlate avec le change.

### Rollback Tracing

When a decision is rolled back, le journal records:

1. The original decision with `outcome = "rolled_back"`
2. A new decision record pour le rollback action itself
3. The `rollback_id` links back vers le snapshot that was restored

This chain vous permet de trace the full lifecycle: proposal, execution, regression detection, and rollback.

## Rollback from Decision Log

To manually roll back a specific decision:

```bash
# View the decision and its rollback snapshot
prx evolution decisions --id <decision_id>

# Restore the snapshot
prx evolution rollback --snapshot <rollback_id>
```

The rollback operation creates un nouveau decision record documenting the manual intervention.

## Integration with Safety System

The decision log integrates avec le safety pipeline:

- **Pre-execution** -- the safety pipeline reads past decisions to detect patterns (e.g., repeated failures in the same area)
- **Post-execution** -- regression signals trigger automatic rollback, which est enregistre in le journal
- **Rate limiting** -- le pipeline checks le journal to enforce maximum changes per time window

## Limiteations

- Decision logs are local vers le PRX instance; multi-node deployments require external log aggregation
- Le fichier backend ne fait pas support indexed queries; use the database backend for large-scale analysis
- Fitness scores are only populated after the observation window completes (configurable per layer)
- Deferred decisions may never resolve si le deferral condition is not re-evaluated

## Voir aussi Pages

- [Self-Evolution Overview](./)
- [Evolution Pipeline](./pipeline) -- the 4-stage pipeline that produces decisions
- [Experiments & Fitness](./experiments) -- A/B testing and fitness scoring
- [Safety & Rollback](./safety) -- safety checks and automatic rollback

---
title: ექსპერიმენტები & Fitness Evaluation
description: A/B experiment tracking and fitness scoring for measuring self-evolution improvements in PRX.
---

# Experiments & Fitness Evaluation

The self-evolution system in PRX uses controlled experiments and fitness evaluation to measure whether proposed changes actually improve agent performance. Every evolution proposal above L1 is tested through an A/B experiment before permanent adoption.

## მიმოხილვა

The experiment system provides:

- **A/B testing** -- run control and treatment variants side by side
- **Fitness scoring** -- quantify agent performance with a composite score
- **Statistical validation** -- ensure improvements are significant, not random noise
- **Automatic convergence** -- promote the winner and retire the loser when results are conclusive

## Experiment Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│  Create  │───►│  Run     │───►│ Evaluate │───►│ Converge  │
│          │    │          │    │          │    │           │
│ Define   │    │ Split    │    │ Compare  │    │ Promote   │
│ variants │    │ traffic  │    │ fitness  │    │ or reject │
└──────────┘    └──────────┘    └──────────┘    └───────────┘
```

### 1. Create

An experiment is created when the evolution pipeline generates a proposal:

- A **control** variant representing the current configuration
- A **treatment** variant representing the proposed change
- Experiment parameters: duration, sample size, traffic split

### 2. Run

During the experiment, sessions are assigned to variants:

- Sessions are assigned randomly based on the traffic split ratio
- Each session runs entirely under one variant (no mid-session switching)
- Both variants are monitored for the same set of fitness metrics

### 3. Evaluate

After the minimum duration or sample size is reached:

- Fitness scores are computed for both variants
- Statistical significance is tested (default: 95% confidence)
- Effect size is calculated to measure practical significance

### 4. Converge

Based on evaluation results:

- **Treatment wins** -- the proposed change is promoted to the default configuration
- **Control wins** -- the proposed change is rejected; the control remains
- **Inconclusive** -- the experiment is extended or the change is deferred

## კონფიგურაცია

```toml
[self_evolution.experiments]
enabled = true
default_duration_hours = 168       # 1 week default
min_sample_size = 100              # minimum sessions per variant
traffic_split = 0.5                # 50/50 split between control and treatment
confidence_level = 0.95            # 95% statistical confidence required
min_effect_size = 0.02             # minimum 2% improvement to accept

[self_evolution.experiments.auto_converge]
enabled = true
check_interval_hours = 24          # evaluate results every 24 hours
max_duration_hours = 720           # force convergence after 30 days
```

## კონფიგურაციის მითითება

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable or disable the experiment system |
| `default_duration_hours` | `u64` | `168` | Default experiment duration in hours (1 week) |
| `min_sample_size` | `usize` | `100` | Minimum sessions per variant before evaluation |
| `traffic_split` | `f64` | `0.5` | Fraction of sessions assigned to the treatment variant (0.0--1.0) |
| `confidence_level` | `f64` | `0.95` | Required statistical confidence level |
| `min_effect_size` | `f64` | `0.02` | Minimum fitness improvement (fraction) to accept the treatment |
| `auto_converge.enabled` | `bool` | `true` | Automatically promote/reject when results are conclusive |
| `auto_converge.check_interval_hours` | `u64` | `24` | How often to check experiment results |
| `auto_converge.max_duration_hours` | `u64` | `720` | Force convergence after this duration (30 days default) |

## Experiment Record Structure

Each experiment is tracked as a structured record:

| Field | Type | Description |
|-------|------|-------------|
| `experiment_id` | `String` | Unique identifier (UUIDv7) |
| `decision_id` | `String` | Link to the originating decision |
| `layer` | `Layer` | Evolution layer: `L1`, `L2`, or `L3` |
| `status` | `Status` | `running`, `evaluating`, `converged`, `cancelled` |
| `created_at` | `DateTime<Utc>` | When the experiment was created |
| `converged_at` | `Option<DateTime<Utc>>` | When the experiment concluded |
| `control` | `Variant` | Description of the control variant |
| `treatment` | `Variant` | Description of the treatment variant |
| `control_sessions` | `usize` | Number of sessions assigned to control |
| `treatment_sessions` | `usize` | Number of sessions assigned to treatment |
| `control_fitness` | `FitnessScore` | Aggregate fitness for the control variant |
| `treatment_fitness` | `FitnessScore` | Aggregate fitness for the treatment variant |
| `p_value` | `Option<f64>` | Statistical significance (lower = more significant) |
| `winner` | `Option<String>` | `"control"`, `"treatment"`, or `null` if inconclusive |

## Fitness Evaluation

Fitness scoring quantifies agent performance across multiple dimensions. The composite fitness score is used to compare experiment variants and track evolution progress over time.

### Fitness Dimensions

| Dimension | Weight | Description | How Measured |
|-----------|--------|-------------|-------------|
| `response_relevance` | 0.30 | How relevant agent responses are to user queries | LLM-as-judge scoring |
| `task_completion` | 0.25 | Fraction of tasks completed successfully | Tool call success rate |
| `response_latency` | 0.15 | Time from user message to first response token | Percentile-based (p50, p95) |
| `token_efficiency` | 0.10 | Tokens consumed per successful task | Lower is better |
| `memory_precision` | 0.10 | Relevance of recalled memories | Recall relevance scoring |
| `user_satisfaction` | 0.10 | Explicit user feedback signals | Thumbs up/down, corrections |

### Composite Score

The composite fitness score is a weighted sum:

```
fitness = sum(dimension_score * dimension_weight)
```

Each dimension is normalized to a 0.0--1.0 range before weighting. The composite score is also in the 0.0--1.0 range, where higher is better.

### Fitness Configuration

```toml
[self_evolution.fitness]
evaluation_window_hours = 24       # aggregate metrics over this window
min_sessions_for_score = 10        # require at least 10 sessions for a valid score

[self_evolution.fitness.weights]
response_relevance = 0.30
task_completion = 0.25
response_latency = 0.15
token_efficiency = 0.10
memory_precision = 0.10
user_satisfaction = 0.10

[self_evolution.fitness.thresholds]
minimum_acceptable = 0.50          # fitness below this triggers an alert
regression_delta = 0.05            # fitness drop > 5% triggers rollback
```

### Fitness Configuration Reference

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|-------|------|---------|-------------|
| `evaluation_window_hours` | `u64` | `24` | Time window for aggregating fitness metrics |
| `min_sessions_for_score` | `usize` | `10` | Minimum sessions needed to compute a valid score |
| `weights.*` | `f64` | *(see table above)* | Weight for each fitness dimension (must sum to 1.0) |
| `thresholds.minimum_acceptable` | `f64` | `0.50` | Alert threshold for low fitness |
| `thresholds.regression_delta` | `f64` | `0.05` | Maximum fitness drop before automatic rollback |

## CLI Commands

```bash
# List active experiments
prx evolution experiments --status running

# View a specific experiment
prx evolution experiments --id <experiment_id>

# View experiment results with fitness breakdown
prx evolution experiments --id <experiment_id> --details

# Cancel a running experiment (reverts to control)
prx evolution experiments cancel <experiment_id>

# View current fitness score
prx evolution fitness

# View fitness history over time
prx evolution fitness --history --last 30d

# View fitness breakdown by dimension
prx evolution fitness --breakdown
```

### Example Fitness Output

```
Current Fitness Score: 0.74

Dimension            Score   Weight  Contribution
response_relevance   0.82    0.30    0.246
task_completion      0.78    0.25    0.195
response_latency     0.69    0.15    0.104
token_efficiency     0.65    0.10    0.065
memory_precision     0.71    0.10    0.071
user_satisfaction    0.60    0.10    0.060

Trend (last 7 days): +0.03 (improving)
```

## Experiment Examples

### L2 Prompt Optimization

A typical L2 experiment tests a system prompt change:

- **Control**: current system prompt (320 tokens)
- **Treatment**: refined system prompt (272 tokens, 15% shorter)
- **Hypothesis**: shorter prompt frees context window, improving response relevance
- **Duration**: 7 days, 100 sessions per variant
- **Result**: treatment fitness 0.75 vs control 0.72 (p = 0.03), treatment promoted

### L3 Strategy Change

An L3 experiment tests a routing policy change:

- **Control**: route all coding tasks to Claude Opus
- **Treatment**: route simple coding tasks to Claude Sonnet, complex to Opus
- **Hypothesis**: cost-efficient routing without quality loss
- **Duration**: 14 days, 200 sessions per variant
- **Result**: treatment fitness 0.73 vs control 0.74 (p = 0.42), inconclusive -- experiment extended

## Statistical Methods

The experiment system uses the following statistical methods:

- **Two-sample t-test** for comparing mean fitness scores between variants
- **Mann-Whitney U test** as a non-parametric alternative when fitness distributions are skewed
- **Bonferroni correction** when multiple fitness dimensions are compared simultaneously
- **Sequential analysis** with alpha-spending to allow early stopping when results are clearly significant

## შეზღუდვები

- Experiments require sufficient session volume; low-traffic deployments may take weeks to reach significance
- User satisfaction signals depend on explicit feedback, which may be sparse
- LLM-as-judge scoring for response relevance adds latency and cost to the evaluation pipeline
- Only one experiment can run per evolution layer at a time to avoid confounding
- Fitness scores are relative to the specific deployment; they are not comparable across different PRX instances

## Related Pages

- [Self-Evolution Overview](./)
- [Decision Log](./decision-log) -- decisions that trigger experiments
- [Evolution Pipeline](./pipeline) -- the pipeline that generates proposals
- [Safety & Rollback](./safety) -- automatic rollback on regression

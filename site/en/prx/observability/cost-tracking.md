---
title: Cost Tracking
description: Track token usage, API costs, and budget alerts across all LLM providers in PRX.
---

# Cost Tracking

PRX includes a built-in cost tracking system that monitors token consumption and API spending across all LLM providers. The `CostTracker` accumulates usage per request, per session, and per provider -- giving you full visibility into how your agents consume API resources.

## Overview

Every LLM request in PRX generates a `TokenUsage` record containing input tokens, output tokens, and the associated cost. These records are aggregated by the `CostTracker` and can be queried for reporting, budget enforcement, and anomaly detection.

```
LLM Request
    │
    ├── Provider returns usage metadata
    │   (input_tokens, output_tokens, cache hits)
    │
    ▼
TokenUsage record created
    │
    ├── Accumulated into CostTracker
    │   ├── Per-request breakdown
    │   ├── Per-session totals
    │   ├── Per-provider totals
    │   └── Per-model totals
    │
    ├── Budget check (if limits configured)
    │   ├── Under budget → continue
    │   └── Over budget → warning / hard stop
    │
    └── Written to observability pipeline
        (metrics, logs, tracing spans)
```

## Configuration

Enable and configure cost tracking in `config.toml`:

```toml
[cost]
enabled = true

# Currency for display purposes (does not affect calculations).
currency = "USD"

# How often to flush accumulated costs to persistent storage.
flush_interval_secs = 60

# Persist cost data across restarts.
persist = true
persist_path = "~/.local/share/openprx/cost.db"
```

### Budget Limits

Set spending limits to prevent runaway costs:

```toml
[cost.budget]
# Daily spending limit across all providers.
daily_limit = 10.00

# Monthly spending limit.
monthly_limit = 200.00

# Per-session limit (resets when a new session starts).
session_limit = 2.00

# Action when a limit is reached: "warn" or "stop".
# "warn" logs a warning but allows requests to continue.
# "stop" blocks further LLM requests until the period resets.
on_limit = "warn"
```

### Per-Provider Limits

Override budget limits for specific providers:

```toml
[cost.budget.providers.openai]
daily_limit = 5.00
monthly_limit = 100.00

[cost.budget.providers.anthropic]
daily_limit = 8.00
monthly_limit = 150.00
```

## TokenUsage Structure

Each LLM request produces a `TokenUsage` record:

| Field | Type | Description |
|-------|------|-------------|
| `input_tokens` | u64 | Number of tokens in the prompt (system + user + context) |
| `output_tokens` | u64 | Number of tokens in the model response |
| `cache_read_tokens` | u64 | Tokens served from provider cache (Anthropic prompt caching) |
| `cache_write_tokens` | u64 | Tokens written to provider cache |
| `total_tokens` | u64 | `input_tokens + output_tokens` |
| `cost` | f64 | Estimated cost in configured currency |
| `provider` | string | Provider name (e.g., "openai", "anthropic") |
| `model` | string | Model identifier (e.g., "gpt-4o", "claude-sonnet-4-20250514") |
| `timestamp` | datetime | When the request was made |
| `session_id` | string | Agent session that generated the request |

## CostTracker

The `CostTracker` is the central aggregation point for all token usage. It maintains running totals by provider, by model, per session, daily (resets at midnight UTC), and monthly (resets on the 1st). The tracker is thread-safe and updated after every LLM response.

## Pricing Data

PRX maintains a built-in pricing table for common providers and models. Prices are defined per million tokens:

| Provider | Model | Input (per 1M) | Output (per 1M) |
|----------|-------|----------------|-----------------|
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| OpenAI | o3 | $10.00 | $40.00 |
| Anthropic | claude-sonnet-4-20250514 | $3.00 | $15.00 |
| Anthropic | claude-haiku-35-20241022 | $0.80 | $4.00 |
| Anthropic | claude-opus-4-20250514 | $15.00 | $75.00 |
| Google | gemini-2.0-flash | $0.075 | $0.30 |
| DeepSeek | deepseek-chat | $0.14 | $0.28 |

### Custom Pricing

Override or add pricing for models not in the built-in table:

```toml
[cost.pricing."openai/gpt-4o"]
input_per_million = 2.50
output_per_million = 10.00

[cost.pricing."custom/my-model"]
input_per_million = 1.00
output_per_million = 3.00
```

For self-hosted models (Ollama, vLLM) where API calls are free, set pricing to zero:

```toml
[cost.pricing."ollama/llama3"]
input_per_million = 0.0
output_per_million = 0.0
```

## Usage Reports

### CLI Commands

```bash
# View current session cost summary
prx cost

# View daily breakdown
prx cost --period daily

# View monthly breakdown by provider
prx cost --period monthly --group-by provider

# View costs for a specific date range
prx cost --from 2026-03-01 --to 2026-03-15

# Export to CSV
prx cost --period monthly --format csv > costs.csv

# Export to JSON (for programmatic consumption)
prx cost --period daily --format json
```

### Example Output

```
PRX Cost Report (2026-03-21)
════════════════════════════════════════════════════
Provider     Model                   Tokens (in/out)    Cost
─────────────────────────────────────────────────────────────
anthropic    claude-sonnet-4-20250514      45.2K / 12.8K    $0.33
openai       gpt-4o                  22.1K / 8.4K     $0.14
openai       gpt-4o-mini              8.3K / 3.1K     $0.00
─────────────────────────────────────────────────────────────
Total                                75.6K / 24.3K    $0.47

Budget Status:
  Session: $0.47 / $2.00 (23.5%)
  Daily:   $3.82 / $10.00 (38.2%)
  Monthly: $42.15 / $200.00 (21.1%)
```

## Budget Alerts

When cost approaches a budget limit, PRX takes action based on the `on_limit` setting:

| Threshold | `on_limit = "warn"` | `on_limit = "stop"` |
|-----------|--------------------|--------------------|
| 80% of limit | Log warning | Log warning |
| 100% of limit | Log error, continue | Block LLM requests, notify user |
| Limit reset (new day/month) | Counters reset | Counters reset, requests unblocked |

Budget alerts are also emitted as observability events. When Prometheus metrics are enabled, the following gauges are exported:

```
prx_cost_daily_total{currency="USD"} 3.82
prx_cost_monthly_total{currency="USD"} 42.15
prx_cost_session_total{currency="USD"} 0.47
prx_cost_budget_daily_remaining{currency="USD"} 6.18
prx_cost_budget_monthly_remaining{currency="USD"} 157.85
```

## Integration with Observability

Cost data integrates with the PRX observability stack:

- **Prometheus** -- token counts and cost gauges per provider/model
- **OpenTelemetry** -- `prx.tokens.input`, `prx.tokens.output`, `prx.cost` span attributes
- **Logs** -- per-request cost logged at DEBUG level, budget warnings at WARN level

## Security Notes

- Cost data may reveal usage patterns. Restrict access to cost reports in multi-user deployments.
- The persistent cost database (`cost.db`) contains usage history. Include it in your backup strategy.
- Budget limits are enforced locally. They do not interact with provider-side spending limits. Configure both for defense in depth.

## Related Pages

- [Observability Overview](/en/prx/observability/)
- [Prometheus Metrics](/en/prx/observability/prometheus)
- [OpenTelemetry](/en/prx/observability/opentelemetry)
- [Provider Configuration](/en/prx/providers/)

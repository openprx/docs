---
title: Suivi des couts
description: Track token usage, API costs, and budget alerts across all LLM providers in PRX.
---

# Cost Tracking

PRX inclut a built-in cost tracking system qui surveille la consommation de tokens et les depenses API pour tous les LLM fournisseurs. The `CostTracker` accumulates usage par requete, par session, and per fournisseur -- giving you full visibility into how your agents consume API resources.

## Apercu

Chaque requete LLM in PRX genere a `TokenUsage` record contenant les tokens d'entree, les tokens de sortie et the associated cost. These records are aggregated par le `CostTracker` and peut etre queried for reporting, budget enforcement, and anomaly detection.

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

### Budget Limites

Set spending limits pour empecher runaway costs:

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

### Per-Provider Limites

Override budget limits for specific fournisseurs:

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

| Champ | Type | Description |
|-------|------|-------------|
| `input_tokens` | u64 | Number of tokens in the prompt (system + user + context) |
| `output_tokens` | u64 | Number of tokens in the model response |
| `cache_read_tokens` | u64 | Tokens served from fournisseur cache (Anthropic prompt caching) |
| `cache_write_tokens` | u64 | Tokens written to fournisseur cache |
| `total_tokens` | u64 | `input_tokens + output_tokens` |
| `cost` | f64 | Estimated cost in configured currency |
| `fournisseur` | string | Provider name (e.g., "openai", "anthropic") |
| `model` | string | Model identifier (e.g., "gpt-4o", "claude-sonnet-4-20250514") |
| `timestamp` | datetime | When la requete was made |
| `session_id` | string | Agent session that generated la requete |

## CostTracker

The `CostTracker` est le central aggregation point pour tous les token usage. Il maintient des totaux cumulatifs by fournisseur, by model, par session, daily (resets at midnight UTC), et monthly (resets sur le 1st). The tracker is thread-safe et updated after every LLM response.

## Pricing Data

PRX maintains a built-in pricing table for common fournisseurs and models. Prices sont definis per million tokens:

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

## Utilisation Reports

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

### Exemple Output

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

When cost approaches a budget limit, PRX takes action based sur le `on_limit` setting:

| Threshold | `on_limit = "warn"` | `on_limit = "stop"` |
|-----------|--------------------|--------------------|
| 80% of limit | Log warning | Log warning |
| 100% of limit | Log error, continue | Block LLM requests, notify user |
| Limite reset (new day/month) | Counters reset | Counters reset, requests unblocked |

Budget alerts are egalement emitted as observability events. When Prometheus metrics are enabled, les elements suivants gauges are exported:

```
prx_cost_daily_total{currency="USD"} 3.82
prx_cost_monthly_total{currency="USD"} 42.15
prx_cost_session_total{currency="USD"} 0.47
prx_cost_budget_daily_remaining{currency="USD"} 6.18
prx_cost_budget_monthly_remaining{currency="USD"} 157.85
```

## Integration with Observability

Cost data integrates avec le PRX observability stack:

- **Prometheus** -- token counts and cost gauges per fournisseur/model
- **OpenTelemetry** -- `prx.tokens.input`, `prx.tokens.output`, `prx.cost` span attributes
- **Logs** -- per-request cost logged at DEBUG level, budget warnings at WARN level

## Securite Nontes

- Cost data may reveal usage patterns. Restrict access to cost reports in multi-user deployments.
- The persistent cost database (`cost.db`) contains usage history. Include it in your backup strategy.
- Budget limits are enforced locally. They ne faites pas interact with fournisseur-side spending limits. Configure both for defense in depth.

## Voir aussi Pages

- [Observability Overview](/fr/prx/observability/)
- [Prometheus Metrics](/fr/prx/observability/prometheus)
- [OpenTelemetry](/fr/prx/observability/opentelemetry)
- [Provider Configuration](/fr/prx/fournisseurs/)

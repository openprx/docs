---
title: Automix Router
description: Cost-optimizing LLM routing that starts with cheap models and escalates on low confidence.
---

# Automix Router

The Automix router optimizes for cost by starting every query with a cheap model and only escalating to a premium model when the initial response's confidence is below a threshold.

## How It Works

1. **Initial query** -- send the query to the cheap model
2. **Confidence check** -- evaluate the response confidence score
3. **Escalate if needed** -- if confidence is below threshold, re-query with premium model
4. **Return** -- return the first confident response

## Confidence Scoring

Confidence is assessed based on:

- Self-reported confidence in the response
- Presence of hedging language ("I'm not sure", "might be")
- Token-level entropy of the response
- Tool call success rate

## Configuration

```toml
[router]
strategy = "automix"

[router.automix]
enabled = true
confidence_threshold = 0.7
cheap_model = "anthropic/claude-haiku"
premium_model = "anthropic/claude-opus-4-6"
max_escalations = 1
```

## Cost Savings

In typical usage, Automix routes 60-80% of queries to the cheap model, achieving significant cost savings while maintaining quality for complex queries.

## Related Pages

- [Router Overview](./)
- [Heuristic Router](./heuristic)
- [KNN Router](./knn)

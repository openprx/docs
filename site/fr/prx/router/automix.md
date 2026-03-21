---
title: Automix Router
description: Cost-optimizing LLM routing that starts with cheap models and escalates on low confidence.
---

# Automix Router

The Automix router optimizes for cost by starting every query avec un cheap model and only escalating vers un premium model lorsque le initial response's confidence is below a threshold.

## Fonctionnement

1. **Initial query** -- send the query vers le cheap model
2. **Confidence check** -- evaluate la reponse confidence score
3. **Escalate if needed** -- if confidence is below threshold, re-query with premium model
4. **Retour** -- retour the first confident response

## Confidence Scoring

Confidence is assessed based on:

- Self-reported confidence in la reponse
- Presence of hedging language ("I'm not sure", "pourrait etre")
- Token-level entropy of la reponse
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

In typical usage, Automix route 60-80% of interroge vers le cheap model, achieving significant cost savings tandis que maintaining quality for complex queries.

## Voir aussi Pages

- [Router Overview](./)
- [Heuristic Router](./heuristic)
- [KNN Router](./knn)

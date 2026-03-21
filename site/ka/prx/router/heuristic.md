---
title: ევრისტიკული მარშრუტიზატორი
description: Rule-based LLM routing in PRX using query feature scoring and capability matching.
---

# Heuristic Router

The heuristic router uses a rule-based scoring system to select the optimal model for each query. It analyzes query features (length, complexity, tool requirements) and matches them against model capability profiles.

## როგორ მუშაობს

1. **Feature extraction** -- analyze the query for length, keyword patterns, and tool requirements
2. **Capability scoring** -- score each model's suitability based on extracted features
3. **Cost weighting** -- apply cost preferences to favor cheaper models for simple queries
4. **Selection** -- choose the highest-scoring model that meets minimum quality thresholds

## Scoring Factors

| Factor | Weight | Description |
|--------|--------|-------------|
| Capability match | 0.4 | Model's ability to handle the query type |
| Elo rating | 0.2 | Historical model performance |
| Cost efficiency | 0.2 | Tokens per dollar |
| Latency | 0.1 | Average response time |
| Context window | 0.1 | Fits the conversation context |

## კონფიგურაცია

```toml
[router]
strategy = "heuristic"

[router.heuristic]
complexity_threshold = 0.6
prefer_cheap_below = 0.4
elo_weight = 0.2
cost_weight = 0.2
```

## Related Pages

- [Router Overview](./)
- [KNN Router](./knn)
- [Automix Router](./automix)

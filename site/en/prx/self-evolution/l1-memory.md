---
title: "L1: Memory Evolution"
description: Layer 1 self-evolution in PRX covering memory compaction and topic clustering.
---

# L1: Memory Evolution

Layer 1 is the most frequent and lowest-risk self-evolution layer. It operates on the agent's memory system, automatically compacting redundant entries and clustering related memories by topic.

## Overview

L1 evolution runs after every session (or on a configurable schedule) and performs:

- **Compaction** -- merge multiple related memory entries into concise summaries
- **Topic clustering** -- group memories by semantic similarity
- **Relevance scoring** -- adjust memory weights based on access frequency
- **Pruning** -- remove memories that have become stale or contradicted

## How It Works

1. After a session ends, L1 analyzes the newly stored memories
2. It identifies clusters of related entries using embedding similarity
3. Clusters that exceed a size threshold are compacted into summaries
4. Memory relevance scores are updated based on recall frequency

## Configuration

```toml
[self_evolution.l1]
enabled = true
schedule = "after_session"  # or "hourly", "daily"
compaction_threshold = 10
cluster_similarity = 0.8
min_access_count = 2
```

## Related Pages

- [Self-Evolution Overview](./)
- [Memory Hygiene](/en/prx/memory/hygiene)
- [L2: Prompt Optimization](./l2-prompt)

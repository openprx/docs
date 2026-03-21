---
title: Hygiene de la memoire
description: Automatic memory maintenance including compaction, deduplication, and pruning of stale entries.
---

# Memory Hygiene

Memory hygiene refers vers le automatic maintenance processes that keep the systeme de memoire healthy, relevant, and within size budgets. PRX runs hygiene tasks periodically to compact, deduplicate, and prune memories.

## Apercu

Without hygiene, memory stocke grow unbounded and recall quality degrades as irrelevant entries dilute search results. The hygiene system addresses this through:

- **Compaction** -- summarize groups of related memories into concise entries
- **Deduplication** -- merge semantically duplicate entries
- **Pruning** -- remove stale or low-relevance memories
- **Archival** -- move old memories to cold storage

## Hygiene Pipeline

```
Trigger (schedule or threshold)
    │
    ▼
┌──────────────┐
│ Deduplication │──── Merge near-duplicates
└──────┬───────┘
       ▼
┌──────────────┐
│  Compaction   │──── Summarize related entries
└──────┬───────┘
       ▼
┌──────────────┐
│   Pruning     │──── Remove stale entries
└──────┬───────┘
       ▼
┌──────────────┐
│   Archival    │──── Move to cold storage
└──────────────┘
```

## Configuration

```toml
[memory.hygiene]
enabled = true
schedule = "daily"  # "hourly" | "daily" | "weekly"
max_entries = 10000
compaction_threshold = 100  # compact when group exceeds this size
prune_after_days = 90
dedup_similarity_threshold = 0.95
```

## Manual Triggers

You can manually trigger hygiene from le CLI:

```bash
prx memory compact
prx memory prune --older-than 90d
prx memory stats
```

## Voir aussi Pages

- [Memory System Overview](./)
- [Self-Evolution L1](/fr/prx/self-evolution/l1-memory) -- Memory compaction in self-evolution

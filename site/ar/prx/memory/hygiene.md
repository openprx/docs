---
title: نظافة الذاكرة
description: صيانة تلقائية للذاكرة تشمل الضغط وإزالة التكرار وتشذيب الإدخالات القديمة.
---

# نظافة الذاكرة

تشير نظافة الذاكرة إلى عمليات الصيانة التلقائية التي تُبقي نظام الذاكرة سليمًا وذا صلة وضمن حدود الحجم. يشغّل PRX مهام النظافة دوريًا لضغط الذكريات وإزالة التكرارات وتشذيبها.

## نظرة عامة

من دون نظافة، تنمو مخازن الذاكرة بلا حدود وتتراجع جودة الاسترجاع لأن الإدخالات غير ذات الصلة تُضعف نتائج البحث. يعالج نظام النظافة ذلك عبر:

- **Compaction** -- تلخيص مجموعات الذكريات المرتبطة في إدخالات موجزة
- **Deduplication** -- دمج الإدخالات المتطابقة دلاليًا
- **Pruning** -- إزالة الذكريات القديمة أو منخفضة الصلة
- **Archival** -- نقل الذكريات القديمة إلى تخزين بارد

## خط أنابيب النظافة

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

## الإعدادات

```toml
[memory.hygiene]
enabled = true
schedule = "daily"  # "hourly" | "daily" | "weekly"
max_entries = 10000
compaction_threshold = 100  # compact when group exceeds this size
prune_after_days = 90
dedup_similarity_threshold = 0.95
```

## التشغيل اليدوي

يمكنك تشغيل النظافة يدويًا من CLI:

```bash
prx memory compact
prx memory prune --older-than 90d
prx memory stats
```

## صفحات ذات صلة

- [نظرة عامة على نظام الذاكرة](./)
- [Self-Evolution L1](/ar/prx/self-evolution/l1-memory) -- ضغط الذاكرة في التطور الذاتي

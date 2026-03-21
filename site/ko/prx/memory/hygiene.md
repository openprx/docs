---
title: 메모리 정리
description: 압축, 중복 제거, 오래된 항목 정리를 포함한 자동 메모리 유지보수입니다.
---

# 메모리 정리

메모리 정리는 메모리 시스템을 건강하고 관련성 있으며 크기 예산 내에서 유지하는 자동 유지보수 프로세스를 의미합니다. PRX는 메모리를 압축, 중복 제거, 정리하기 위해 정기적으로 정리 작업을 실행합니다.

## 개요

정리 없이는 메모리 저장소가 무한히 커지고 관련 없는 항목이 검색 결과를 희석시켜 리콜 품질이 저하됩니다. 정리 시스템은 다음을 통해 이를 해결합니다:

- **압축** -- 관련된 메모리 그룹을 간결한 항목으로 요약합니다
- **중복 제거** -- 의미적으로 중복된 항목을 병합합니다
- **정리** -- 오래되거나 관련성이 낮은 메모리를 제거합니다
- **보관** -- 오래된 메모리를 콜드 스토리지로 이동합니다

## 정리 파이프라인

```
Trigger (schedule or threshold)
    │
    ▼
┌──────────────┐
│ Deduplication │──── 유사 중복 병합
└──────┬───────┘
       ▼
┌──────────────┐
│  Compaction   │──── 관련 항목 요약
└──────┬───────┘
       ▼
┌──────────────┐
│   Pruning     │──── 오래된 항목 제거
└──────┬───────┘
       ▼
┌──────────────┐
│   Archival    │──── 콜드 스토리지로 이동
└──────────────┘
```

## 설정

```toml
[memory.hygiene]
enabled = true
schedule = "daily"  # "hourly" | "daily" | "weekly"
max_entries = 10000
compaction_threshold = 100  # 그룹이 이 크기를 초과하면 압축
prune_after_days = 90
dedup_similarity_threshold = 0.95
```

## 수동 트리거

CLI에서 수동으로 정리를 트리거할 수 있습니다:

```bash
prx memory compact
prx memory prune --older-than 90d
prx memory stats
```

## 관련 페이지

- [메모리 시스템 개요](./)
- [자기 진화 L1](/ko/prx/self-evolution/l1-memory) -- 자기 진화에서의 메모리 압축

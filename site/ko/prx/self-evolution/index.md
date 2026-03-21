---
title: 자기 진화 시스템
description: 자율적 에이전트 개선을 위한 PRX 3계층 자기 진화 시스템 개요입니다.
---

# 자기 진화 시스템

PRX에는 에이전트가 시간이 지남에 따라 자율적으로 동작을 개선할 수 있는 3계층 자기 진화 시스템이 포함되어 있습니다. 이 시스템은 에이전트 성능을 지속적으로 분석하고 단계적인 개선을 적용합니다 -- 메모리 최적화에서 프롬프트 튜닝, 전략적 정책 변경까지.

## 개요

자기 진화는 각각 다른 추상화 수준에서 작동하는 세 개의 계층으로 구성됩니다:

| 계층 | 범위 | 빈도 | 위험 |
|------|------|------|------|
| [L1: 메모리](./l1-memory) | 메모리 압축, 토픽 클러스터링 | 매 세션 | 낮음 |
| [L2: 프롬프트](./l2-prompt) | 시스템 프롬프트 최적화, A/B 테스트 | 주간/일간 | 중간 |
| [L3: 전략](./l3-strategy) | 도구 정책, 라우팅 규칙, 거버넌스 | 주간/월간 | 높음 |

## 아키텍처

```
┌───────────────────────────────────────┐
│         Self-Evolution Engine          │
│                                        │
│  L3: Strategy    ← Low frequency       │
│    ├── Tool policy tuning              │
│    ├── Routing optimization            │
│    └── Governance adjustments          │
│                                        │
│  L2: Prompt      ← Medium frequency    │
│    ├── System prompt refinement        │
│    └── A/B testing framework           │
│                                        │
│  L1: Memory      ← High frequency      │
│    ├── Memory compaction               │
│    └── Topic clustering                │
└───────────────────────────────────────┘
```

## 안전 우선

모든 진화 제안은 실행 전에 안전 파이프라인을 통과합니다. 롤백 보호 및 무결성 검사에 대한 자세한 내용은 [안전](./safety)을 참조하세요.

## 설정

```toml
[self_evolution]
enabled = false  # 옵트인 전용
auto_apply = false  # 기본적으로 수동 승인 필요

[self_evolution.l1]
enabled = true
schedule = "after_session"

[self_evolution.l2]
enabled = false
schedule = "weekly"

[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
```

## 관련 페이지

- [L1: 메모리 압축](./l1-memory)
- [L2: 프롬프트 최적화](./l2-prompt)
- [L3: 전략 튜닝](./l3-strategy)
- [진화 파이프라인](./pipeline)
- [안전 및 롤백](./safety)

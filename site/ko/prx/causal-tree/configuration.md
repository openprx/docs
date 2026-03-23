---
title: CTE 설정 레퍼런스
description: PRX 인과 트리 엔진의 전체 설정 레퍼런스.
---

# CTE 설정 레퍼런스

인과 트리 엔진은 PRX 설정 파일의 `[causal_tree]` 섹션에서 구성합니다.

> **CTE는 기본적으로 비활성화되어 있습니다.** 아래 모든 매개변수는 `causal_tree.enabled = true`일 때만 적용됩니다.

## 전체 설정 예시

```toml
[causal_tree]
enabled = true

w_confidence = 0.50
w_cost = 0.25
w_latency = 0.25

write_decision_log = true
write_metrics = true

[causal_tree.policy]
max_branches = 3
commit_threshold = 0.62
extra_token_ratio_limit = 0.35
extra_latency_budget_ms = 300
rehearsal_timeout_ms = 5000
default_side_effect_mode = "read_only"
circuit_breaker_threshold = 5
circuit_breaker_cooldown_secs = 60
```

## 매개변수 레퍼런스

### 최상위 매개변수

| 매개변수 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `enabled` | bool | `false` | 마스터 스위치. `false`이면 CTE가 완전히 바이패스됩니다. |
| `w_confidence` | f32 | `0.50` | 신뢰도 차원의 스코어링 가중치. |
| `w_cost` | f32 | `0.25` | 비용 페널티의 스코어링 가중치. |
| `w_latency` | f32 | `0.25` | 지연 시간 페널티의 스코어링 가중치. |
| `write_decision_log` | bool | `true` | 활성화 시 각 CTE 결정의 구조화된 로그 출력. |
| `write_metrics` | bool | `true` | 활성화 시 CTE 성능 메트릭 수집. |

### 정책 매개변수 (`[causal_tree.policy]`)

| 매개변수 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `max_branches` | usize | `3` | 요청당 최대 후보 분기 수. |
| `commit_threshold` | f32 | `0.62` | 분기를 커밋하기 위한 최소 복합 점수. |
| `extra_token_ratio_limit` | f32 | `0.35` | 기준 요청 대비 CTE 오버헤드의 최대 토큰 비율. |
| `extra_latency_budget_ms` | u64 | `300` | CTE 파이프라인의 최대 추가 지연 시간 (밀리초). |
| `rehearsal_timeout_ms` | u64 | `5000` | 단일 리허설 타임아웃 (밀리초). |
| `default_side_effect_mode` | string | `"read_only"` | 리허설 부작용 모드. `"read_only"` / `"dry_run"` / `"live"`. |
| `circuit_breaker_threshold` | u32 | `5` | 서킷 브레이커 트립까지의 연속 실패 횟수. |
| `circuit_breaker_cooldown_secs` | u64 | `60` | 서킷 브레이커 쿨다운 기간 (초). |

## 최소 설정

```toml
[causal_tree]
enabled = true
```

## 관련 페이지

- [인과 트리 엔진 개요](./)
- [전체 설정 레퍼런스](/ko/prx/config/reference)

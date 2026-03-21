---
title: 의사결정 로그
description: 자기 진화 주기 동안의 의사결정 로깅 -- 기록 내용, 포맷, 분석, 롤백 추적입니다.
---

# 의사결정 로그

자기 진화 주기 동안 내려진 모든 결정은 구조화된 의사결정 로그에 기록됩니다. 이 로그는 진화 시스템이 무엇을 결정했는지, 왜 결정했는지, 결과가 어떠했는지에 대한 완전한 감사 추적을 제공하여 사후 분석, 디버깅, 안전한 롤백을 가능하게 합니다.

## 개요

의사결정 로그는 진화 결정의 전체 생명주기를 캡처합니다:

- **제안 생성** -- 어떤 개선이 제안되었고 왜
- **평가** -- 제안이 안전성과 적합성 기준에 대해 어떻게 점수화되었는지
- **판정** -- 제안이 승인, 거부 또는 연기되었는지
- **실행** -- 어떤 변경이 적용되었고 즉각적인 효과
- **결과** -- 변경 후 측정된 결과, 회귀 포함

보안 감사 로그 (모든 보안 이벤트를 기록)와 달리 의사결정 로그는 자기 진화 시스템의 추론 과정에 특별히 초점을 맞춥니다.

## 의사결정 레코드 구조

각 결정은 구조화된 레코드로 저장됩니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `decision_id` | `String` | 고유 식별자 (UUIDv7, 시간 순서) |
| `cycle_id` | `String` | 이 결정을 생성한 진화 주기 |
| `layer` | `Layer` | 진화 계층: `L1` (메모리), `L2` (프롬프트) 또는 `L3` (전략) |
| `timestamp` | `DateTime<Utc>` | 결정이 기록된 시점 |
| `proposal` | `Proposal` | 제안된 변경 (유형, 설명, 파라미터) |
| `rationale` | `String` | 이 변경이 제안된 이유에 대한 설명 |
| `data_points` | `usize` | 결정에 영향을 준 데이터 샘플 수 |
| `fitness_before` | `f64` | 변경 전 적합성 점수 |
| `fitness_after` | `Option<f64>` | 변경 후 적합성 점수 (실행 후 채워짐) |
| `verdict` | `Verdict` | `approved`, `rejected`, `deferred` 또는 `auto_approved` |
| `verdict_reason` | `String` | 판정에 도달한 이유 (예: 안전 검사 결과) |
| `executed` | `bool` | 변경이 실제로 적용되었는지 여부 |
| `rollback_id` | `Option<String>` | 롤백 스냅샷에 대한 참조 (생성된 경우) |
| `outcome` | `Option<Outcome>` | 실행 후 결과: `improved`, `neutral`, `regressed` 또는 `rolled_back` |

### 판정 유형

| 판정 | 설명 | 트리거 |
|------|------|--------|
| `auto_approved` | 파이프라인에 의해 자동 승인 | 위험 점수가 임계값 이하인 L1 변경 |
| `approved` | 평가 후 승인 | 안전 검사를 통과한 L2/L3 변경 |
| `rejected` | 안전 파이프라인에 의해 거부 | 무결성 검사 실패, 위험이 너무 높음 또는 충돌 감지 |
| `deferred` | 나중에 평가하기 위해 연기 | 데이터 불충분 또는 시스템 상태 우려 |

## 설정

```toml
[self_evolution.decision_log]
enabled = true
storage = "file"                # "file" 또는 "database"
path = "~/.local/share/openprx/decisions/"
format = "jsonl"                # "jsonl" 또는 "json" (보기 좋게 포맷)
retention_days = 180            # 180일 이상 된 항목 자동 삭제
max_entries = 10000             # 로테이션 전 최대 항목 수

[self_evolution.decision_log.database]
backend = "sqlite"
path = "~/.local/share/openprx/decisions.db"
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 의사결정 로깅 활성화 또는 비활성화 |
| `storage` | `String` | `"file"` | 저장 백엔드: `"file"` 또는 `"database"` |
| `path` | `String` | `"~/.local/share/openprx/decisions/"` | 로그 파일 디렉터리 (파일 모드) |
| `format` | `String` | `"jsonl"` | 파일 포맷: `"jsonl"` (압축) 또는 `"json"` (사람이 읽기 쉬움) |
| `retention_days` | `u64` | `180` | N일 이상 된 항목 자동 삭제. 0 = 영구 보관 |
| `max_entries` | `usize` | `10000` | 로테이션 전 파일당 최대 항목 수 |
| `database.backend` | `String` | `"sqlite"` | 데이터베이스 백엔드: `"sqlite"` 또는 `"postgres"` |
| `database.path` | `String` | `""` | 데이터베이스 경로 (SQLite) 또는 연결 URL (PostgreSQL) |

## 의사결정 레코드 예시

```json
{
  "decision_id": "019520b0-5678-7000-8000-000000000042",
  "cycle_id": "cycle_2026-03-21T03:00:00Z",
  "layer": "L2",
  "timestamp": "2026-03-21T03:05:12.345Z",
  "proposal": {
    "type": "prompt_refinement",
    "description": "Shorten system prompt preamble by 15% to reduce token usage",
    "parameters": {
      "target": "system_prompt.preamble",
      "old_token_count": 320,
      "new_token_count": 272
    }
  },
  "rationale": "Analysis of 500 sessions shows the preamble consumes 8% of context window with low recall contribution. A/B test variant with shortened preamble showed 3% improvement in response relevance.",
  "data_points": 500,
  "fitness_before": 0.72,
  "fitness_after": 0.75,
  "verdict": "approved",
  "verdict_reason": "Passed all safety checks. Risk score 0.12 (threshold: 0.5). No conflicts with existing policies.",
  "executed": true,
  "rollback_id": "snap_019520b0-5678-7000-8000-000000000043",
  "outcome": "improved"
}
```

## 의사결정 로그 쿼리

### CLI 명령어

```bash
# 최근 결정 보기
prx evolution decisions --tail 20

# 계층별 필터링
prx evolution decisions --layer L2 --last 30d

# 판정별 필터링
prx evolution decisions --verdict rejected --last 7d

# 결과별 필터링
prx evolution decisions --outcome regressed

# 전체 세부 정보가 포함된 특정 결정 보기
prx evolution decisions --id 019520b0-5678-7000-8000-000000000042

# 분석을 위한 결정 내보내기
prx evolution decisions --last 90d --format json > decisions_q1.json
```

### 프로그래밍 방식 접근

의사결정 로그는 게이트웨이 API를 통해 접근 가능합니다:

```bash
# 최근 결정 목록
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions?limit=20

# 특정 결정 가져오기
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions/019520b0-5678-7000-8000-000000000042
```

## 의사결정 패턴 분석

### 계층별 승인률

각 계층에서 제안의 몇 퍼센트가 승인되는지 추적하여 진화 시스템의 효과를 파악합니다:

```bash
prx evolution stats --last 90d
```

출력 예시:

```
Layer   Proposed  Approved  Rejected  Deferred  Approval Rate
L1      142       138       2         2         97.2%
L2      28        19        6         3         67.9%
L3      5         2         3         0         40.0%
```

### 회귀 감지

회귀를 초래한 결정을 식별합니다:

```bash
prx evolution decisions --outcome regressed --last 90d
```

각 회귀 결정에는 `fitness_before`와 `fitness_after` 값이 포함되어 있어 영향을 측정하고 변경 사항과 상관관계를 파악하기 쉽습니다.

### 롤백 추적

결정이 롤백되면 로그에 기록됩니다:

1. `outcome = "rolled_back"`인 원래 결정
2. 롤백 작업 자체에 대한 새 결정 레코드
3. `rollback_id`가 복원된 스냅샷을 참조

이 체인을 통해 전체 생명주기를 추적할 수 있습니다: 제안, 실행, 회귀 감지, 롤백.

## 의사결정 로그에서 롤백

특정 결정을 수동으로 롤백하려면:

```bash
# 결정과 롤백 스냅샷 보기
prx evolution decisions --id <decision_id>

# 스냅샷 복원
prx evolution rollback --snapshot <rollback_id>
```

롤백 작업은 수동 개입을 문서화하는 새 결정 레코드를 생성합니다.

## 안전 시스템과의 통합

의사결정 로그는 안전 파이프라인과 통합됩니다:

- **실행 전** -- 안전 파이프라인이 패턴 감지를 위해 과거 결정을 읽습니다 (예: 같은 영역에서의 반복 실패)
- **실행 후** -- 회귀 신호가 자동 롤백을 트리거하며 이는 로그에 기록됩니다
- **레이트 리밋** -- 파이프라인이 시간 창당 최대 변경 수를 적용하기 위해 로그를 확인합니다

## 제한 사항

- 의사결정 로그는 PRX 인스턴스에 로컬입니다; 다중 노드 배포에는 외부 로그 집계가 필요합니다
- 파일 백엔드는 인덱스 쿼리를 지원하지 않습니다; 대규모 분석에는 데이터베이스 백엔드를 사용하세요
- 적합성 점수는 관찰 기간이 완료된 후에만 채워집니다 (계층별 설정 가능)
- 연기된 결정은 연기 조건이 다시 평가되지 않으면 해결되지 않을 수 있습니다

## 관련 페이지

- [자기 진화 개요](./)
- [진화 파이프라인](./pipeline) -- 결정을 생성하는 4단계 파이프라인
- [실험 및 적합성](./experiments) -- A/B 테스트 및 적합성 점수
- [안전 및 롤백](./safety) -- 안전 검사 및 자동 롤백

---
title: 실험 및 적합성 평가
description: PRX 자기 진화 개선을 측정하기 위한 A/B 실험 추적 및 적합성 점수입니다.
---

# 실험 및 적합성 평가

PRX의 자기 진화 시스템은 제어된 실험과 적합성 평가를 사용하여 제안된 변경이 실제로 에이전트 성능을 개선하는지 측정합니다. L1 이상의 모든 진화 제안은 영구 채택 전에 A/B 실험을 통해 테스트됩니다.

## 개요

실험 시스템은 다음을 제공합니다:

- **A/B 테스트** -- 대조군과 처리군 변형을 나란히 실행
- **적합성 점수** -- 복합 점수로 에이전트 성능 정량화
- **통계적 검증** -- 개선이 무작위 노이즈가 아닌 유의미한지 확인
- **자동 수렴** -- 결과가 결정적이면 승자를 승격하고 패자를 퇴출

## 실험 생명주기

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│  Create  │───►│  Run     │───►│ Evaluate │───►│ Converge  │
│          │    │          │    │          │    │           │
│ Define   │    │ Split    │    │ Compare  │    │ Promote   │
│ variants │    │ traffic  │    │ fitness  │    │ or reject │
└──────────┘    └──────────┘    └──────────┘    └───────────┘
```

### 1. 생성

진화 파이프라인이 제안을 생성할 때 실험이 생성됩니다:

- 현재 설정을 나타내는 **대조군** 변형
- 제안된 변경을 나타내는 **처리군** 변형
- 실험 파라미터: 기간, 샘플 크기, 트래픽 분배

### 2. 실행

실험 기간 동안 세션이 변형에 할당됩니다:

- 세션은 트래픽 분배 비율에 따라 무작위 할당
- 각 세션은 전적으로 하나의 변형 하에서 실행 (세션 중 전환 없음)
- 두 변형 모두 동일한 적합성 메트릭 세트로 모니터링

### 3. 평가

최소 기간 또는 샘플 크기에 도달한 후:

- 두 변형에 대한 적합성 점수 계산
- 통계적 유의성 테스트 (기본: 95% 신뢰도)
- 실용적 유의성을 측정하기 위한 효과 크기 계산

### 4. 수렴

평가 결과에 따라:

- **처리군 승리** -- 제안된 변경이 기본 설정으로 승격
- **대조군 승리** -- 제안된 변경이 거부; 대조군 유지
- **결론 불가** -- 실험이 연장되거나 변경이 연기됨

## 설정

```toml
[self_evolution.experiments]
enabled = true
default_duration_hours = 168       # 기본 1주일
min_sample_size = 100              # 변형당 최소 세션 수
traffic_split = 0.5                # 대조군과 처리군 50/50 분배
confidence_level = 0.95            # 95% 통계적 신뢰도 필요
min_effect_size = 0.02             # 채택을 위한 최소 2% 개선

[self_evolution.experiments.auto_converge]
enabled = true
check_interval_hours = 24          # 24시간마다 결과 평가
max_duration_hours = 720           # 30일 후 강제 수렴
```

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 실험 시스템 활성화 또는 비활성화 |
| `default_duration_hours` | `u64` | `168` | 기본 실험 기간 (시간, 1주일) |
| `min_sample_size` | `usize` | `100` | 평가 전 변형당 최소 세션 수 |
| `traffic_split` | `f64` | `0.5` | 처리군 변형에 할당되는 세션 비율 (0.0--1.0) |
| `confidence_level` | `f64` | `0.95` | 필요한 통계적 신뢰도 수준 |
| `min_effect_size` | `f64` | `0.02` | 처리군 채택을 위한 최소 적합성 개선 (비율) |
| `auto_converge.enabled` | `bool` | `true` | 결과가 결정적일 때 자동 승격/거부 |
| `auto_converge.check_interval_hours` | `u64` | `24` | 실험 결과를 확인하는 빈도 |
| `auto_converge.max_duration_hours` | `u64` | `720` | 이 기간 후 강제 수렴 (기본 30일) |

## 적합성 평가

적합성 점수는 여러 차원에 걸쳐 에이전트 성능을 정량화합니다. 복합 적합성 점수는 실험 변형을 비교하고 시간에 따른 진화 진행 상황을 추적하는 데 사용됩니다.

### 적합성 차원

| 차원 | 가중치 | 설명 | 측정 방법 |
|------|--------|------|----------|
| `response_relevance` | 0.30 | 에이전트 응답이 사용자 쿼리에 얼마나 관련있는지 | LLM-as-judge 점수 |
| `task_completion` | 0.25 | 성공적으로 완료된 작업 비율 | 도구 호출 성공률 |
| `response_latency` | 0.15 | 사용자 메시지에서 첫 응답 토큰까지의 시간 | 백분위 기반 (p50, p95) |
| `token_efficiency` | 0.10 | 성공적 작업당 소비된 토큰 | 낮을수록 좋음 |
| `memory_precision` | 0.10 | 리콜된 메모리의 관련성 | 리콜 관련성 점수 |
| `user_satisfaction` | 0.10 | 명시적 사용자 피드백 신호 | 좋아요/싫어요, 수정 |

### 복합 점수

복합 적합성 점수는 가중 합산입니다:

```
fitness = sum(dimension_score * dimension_weight)
```

각 차원은 가중치 적용 전 0.0--1.0 범위로 정규화됩니다. 복합 점수도 0.0--1.0 범위이며 높을수록 좋습니다.

### 적합성 설정

```toml
[self_evolution.fitness]
evaluation_window_hours = 24       # 이 기간에 걸쳐 메트릭 집계
min_sessions_for_score = 10        # 유효한 점수를 위한 최소 10개 세션 필요

[self_evolution.fitness.weights]
response_relevance = 0.30
task_completion = 0.25
response_latency = 0.15
token_efficiency = 0.10
memory_precision = 0.10
user_satisfaction = 0.10

[self_evolution.fitness.thresholds]
minimum_acceptable = 0.50          # 이 이하의 적합성은 알림 트리거
regression_delta = 0.05            # 5% 이상 적합성 하락 시 롤백 트리거
```

### 적합성 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `evaluation_window_hours` | `u64` | `24` | 적합성 메트릭 집계 시간 창 |
| `min_sessions_for_score` | `usize` | `10` | 유효한 점수 계산에 필요한 최소 세션 수 |
| `weights.*` | `f64` | *(위 표 참조)* | 각 적합성 차원의 가중치 (합계 1.0) |
| `thresholds.minimum_acceptable` | `f64` | `0.50` | 낮은 적합성에 대한 알림 임계값 |
| `thresholds.regression_delta` | `f64` | `0.05` | 자동 롤백 전 최대 적합성 하락 |

## CLI 명령어

```bash
# 활성 실험 목록
prx evolution experiments --status running

# 특정 실험 보기
prx evolution experiments --id <experiment_id>

# 적합성 분석이 포함된 실험 결과 보기
prx evolution experiments --id <experiment_id> --details

# 실행 중인 실험 취소 (대조군으로 복귀)
prx evolution experiments cancel <experiment_id>

# 현재 적합성 점수 보기
prx evolution fitness

# 시간에 따른 적합성 이력 보기
prx evolution fitness --history --last 30d

# 차원별 적합성 분석 보기
prx evolution fitness --breakdown
```

### 적합성 출력 예시

```
Current Fitness Score: 0.74

Dimension            Score   Weight  Contribution
response_relevance   0.82    0.30    0.246
task_completion      0.78    0.25    0.195
response_latency     0.69    0.15    0.104
token_efficiency     0.65    0.10    0.065
memory_precision     0.71    0.10    0.071
user_satisfaction    0.60    0.10    0.060

Trend (last 7 days): +0.03 (improving)
```

## 통계적 방법

실험 시스템은 다음 통계적 방법을 사용합니다:

- 변형 간 평균 적합성 점수 비교를 위한 **이표본 t-검정**
- 적합성 분포가 비대칭일 때의 비모수적 대안으로 **Mann-Whitney U 검정**
- 여러 적합성 차원을 동시에 비교할 때의 **Bonferroni 보정**
- 결과가 명확히 유의한 경우 조기 종료를 허용하는 알파 지출이 포함된 **순차 분석**

## 제한 사항

- 실험은 충분한 세션 볼륨이 필요합니다; 트래픽이 적은 배포에서는 유의성에 도달하는 데 수 주가 걸릴 수 있습니다
- 사용자 만족도 신호는 명시적 피드백에 의존하며 이는 드물 수 있습니다
- 응답 관련성에 대한 LLM-as-judge 점수는 평가 파이프라인에 지연 시간과 비용을 추가합니다
- 교란을 방지하기 위해 한 번에 진화 계층당 하나의 실험만 실행할 수 있습니다
- 적합성 점수는 특정 배포에 상대적입니다; 다른 PRX 인스턴스 간에 비교할 수 없습니다

## 관련 페이지

- [자기 진화 개요](./)
- [의사결정 로그](./decision-log) -- 실험을 트리거하는 결정
- [진화 파이프라인](./pipeline) -- 제안을 생성하는 파이프라인
- [안전 및 롤백](./safety) -- 회귀 시 자동 롤백

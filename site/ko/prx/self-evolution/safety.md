---
title: 진화 안전
description: PRX 자기 진화를 위한 롤백 보호, 무결성 검사, 안전 메커니즘입니다.
---

# 진화 안전

안전은 자기 진화 시스템의 최우선 순위입니다. 모든 변경에는 롤백 기능, 사전/사후 무결성 검사, 유해한 수정을 방지하기 위한 자동 회귀 감지가 포함됩니다.

## 안전 메커니즘

### 롤백 보호

모든 진화 변경은 적용 전에 스냅샷을 생성합니다. 문제가 감지되면 시스템은 즉시 이전 상태로 되돌릴 수 있습니다:

- **자동 롤백** -- 변경 후 무결성 검사 실패 시 트리거
- **수동 롤백** -- 사람이 시작하는 복원을 위해 CLI를 통해 사용 가능
- **시간 기반 롤백** -- 롤백 기간 내에 명시적으로 확인되지 않으면 변경이 자동 복원

### 무결성 검사

모든 변경 전후에 시스템이 검증합니다:

- 핵심 기능이 여전히 작동하는지 (스모크 테스트)
- 안전 불변값이 유지되는지 (예: 보안 정책 약화 없음)
- 성능 메트릭이 허용 범위 내에 있는지
- 순환 종속성이나 충돌하는 규칙이 없는지

### 회귀 감지

변경이 적용된 후 시스템은 설정 가능한 기간 동안 주요 메트릭을 모니터링합니다:

- 작업 완료율
- 오류율
- 평균 응답 품질
- 사용자 만족도 신호

어떤 메트릭이든 임계값을 초과하여 저하되면 변경이 자동으로 롤백됩니다.

## 설정

```toml
[self_evolution.safety]
rollback_enabled = true
rollback_window_hours = 168  # 7일
sanity_check_timeout_secs = 30
regression_monitoring_hours = 24
max_regression_threshold = 0.1  # 10% 저하 시 롤백 트리거
```

## CLI 명령어

```bash
prx evolution status          # 활성 진화 상태 보기
prx evolution rollback        # 마지막 변경 롤백
prx evolution history         # 진화 이력 보기
prx evolution approve <id>    # 대기 중인 제안 승인
```

## 관련 페이지

- [자기 진화 개요](./)
- [진화 파이프라인](./pipeline)
- [보안 정책 엔진](/ko/prx/security/policy-engine)

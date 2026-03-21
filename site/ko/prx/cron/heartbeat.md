---
title: 하트비트
description: PRX cron 시스템의 주기적 상태 확인 및 상태 보고입니다.
---

# 하트비트

하트비트는 PRX 데몬의 작동 상태를 모니터링하는 주기적 상태 확인입니다. 설정 가능한 간격 (기본값: 30초)으로 실행되며 시스템 상태를 보고합니다.

## 확인 항목

- **데몬 프로세스** -- 데몬이 응답하는지 여부
- **프로바이더 연결** -- 설정된 LLM 프로바이더에 접근할 수 있는지 여부
- **메모리 사용량** -- 메모리 소비가 제한 내에 있는지 여부
- **디스크 공간** -- 데이터 저장을 위한 충분한 디스크 공간이 있는지 여부
- **활성 세션** -- 실행 중인 에이전트 세션의 수 및 상태

## 상태 게시

하트비트는 다음을 통해 상태를 게시합니다:

- 디버그 수준의 로그 항목
- `/health` API 엔드포인트
- Prometheus 메트릭 (활성화된 경우)
- 선택적 외부 상태 확인 URL

## 설정

```toml
[cron.heartbeat]
interval_secs = 30
check_providers = true
check_disk_space = true
disk_space_threshold_mb = 100
external_health_url = ""  # 선택: 외부 URL로 상태 POST
```

## 관련 페이지

- [Cron 시스템 개요](./)
- [관측성](/ko/prx/observability/)
- [Prometheus 메트릭](/ko/prx/observability/prometheus)

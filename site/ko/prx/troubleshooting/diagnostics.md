---
title: 진단
description: PRX 문제를 디버깅하기 위한 상세한 진단 절차와 도구입니다.
---

# 진단

이 페이지는 기본 문제 해결 단계로 해결되지 않는 PRX 문제를 조사하기 위한 고급 진단 절차를 다룹니다.

## 진단 명령

### prx doctor

종합적인 상태 점검:

```bash
prx doctor
```

출력에 포함되는 항목:
- 설정 검증 결과
- 프로바이더 연결 테스트
- 시스템 의존성 확인
- 리소스 사용량 요약

### prx debug

상세한 작업 추적을 위해 디버그 수준 로깅을 활성화합니다:

```bash
PRX_LOG=debug prx daemon
```

또는 설정에서 지정:

```toml
[observability]
log_level = "debug"
```

### prx info

시스템 정보를 표시합니다:

```bash
prx info
```

표시 내용:
- PRX 버전 및 빌드 정보
- OS 및 아키텍처
- 설정된 프로바이더와 상태
- 메모리 백엔드 유형 및 크기
- 플러그인 수 및 상태

## 로그 분석

PRX 로그는 구조화된 JSON입니다 (`log_format = "json"`일 때). 주요 확인 필드:

| 필드 | 설명 |
|------|------|
| `level` | 로그 수준 (debug, info, warn, error) |
| `target` | Rust 모듈 경로 |
| `session_id` | 관련 세션 ID |
| `provider` | 관련 LLM 프로바이더 |
| `duration_ms` | 작업 소요 시간 |
| `error` | 오류 상세 (해당되는 경우) |

## 네트워크 진단

프로바이더 연결을 테스트합니다:

```bash
# Anthropic API 테스트
prx provider test anthropic

# 설정된 모든 프로바이더 테스트
prx provider test --all

# 샌드박스에서 네트워크 확인
prx sandbox test-network
```

## 성능 프로파일링

메트릭 엔드포인트를 활성화하고 Prometheus/Grafana를 사용하여 성능을 분석합니다:

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
```

모니터링할 주요 메트릭:
- `prx_llm_request_duration_seconds` -- LLM 지연 시간
- `prx_sessions_active` -- 동시 세션 수
- `prx_memory_usage_bytes` -- 메모리 소비량

## 관련 페이지

- [문제 해결 개요](./)
- [관측성](/ko/prx/observability/)
- [Prometheus 메트릭](/ko/prx/observability/prometheus)

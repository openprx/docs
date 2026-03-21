---
title: 관측성
description: 메트릭, 트레이싱, 로깅을 포함한 PRX 관측성 기능 개요입니다.
---

# 관측성

PRX는 메트릭, 분산 트레이싱, 구조화된 로깅을 통한 포괄적인 관측성을 제공합니다. 이러한 기능은 에이전트 운영의 모니터링, 디버깅, 성능 최적화를 가능하게 합니다.

## 개요

| 기능 | 백엔드 | 목적 |
|------|--------|------|
| [Prometheus 메트릭](./prometheus) | Prometheus | 정량적 모니터링 (요청 비율, 지연 시간, 오류) |
| [OpenTelemetry](./opentelemetry) | OTLP 호환 | 분산 트레이싱 및 스팬 수준 분석 |
| 구조화된 로깅 | stdout/파일 | 상세한 운영 로그 |

## 빠른 시작

`config.toml`에서 관측성을 활성화합니다:

```toml
[observability]
log_level = "info"
log_format = "json"  # "json" | "pretty"

[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"

[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"
```

## 주요 메트릭

PRX는 다음에 대한 메트릭을 노출합니다:

- **에이전트 성능** -- 세션 지속 시간, 세션당 턴 수, 도구 호출
- **LLM 프로바이더** -- 요청 지연 시간, 토큰 사용량, 오류율, 비용
- **메모리** -- 리콜 지연 시간, 저장소 크기, 압축 빈도
- **시스템** -- CPU 사용량, 메모리 소비, 활성 연결

## 관련 페이지

- [Prometheus 메트릭](./prometheus)
- [OpenTelemetry 트레이싱](./opentelemetry)
- [하트비트](/ko/prx/cron/heartbeat)

---
title: Prometheus 메트릭
description: PRX의 Prometheus 메트릭 엔드포인트와 사용 가능한 메트릭입니다.
---

# Prometheus 메트릭

PRX는 Grafana, Datadog, AlertManager 등의 모니터링 시스템과 통합하기 위한 Prometheus 호환 메트릭 엔드포인트를 노출합니다.

## 엔드포인트

활성화되면 메트릭은 다음에서 사용할 수 있습니다:

```
http://127.0.0.1:9090/metrics
```

## 사용 가능한 메트릭

### 에이전트 메트릭

| 메트릭 | 타입 | 설명 |
|--------|------|------|
| `prx_sessions_total` | Counter | 생성된 총 세션 수 |
| `prx_sessions_active` | Gauge | 현재 활성 세션 수 |
| `prx_session_duration_seconds` | Histogram | 세션 지속 시간 |
| `prx_turns_total` | Counter | 총 대화 턴 수 |
| `prx_tool_calls_total` | Counter | 총 도구 호출 수 (도구명별) |

### LLM 프로바이더 메트릭

| 메트릭 | 타입 | 설명 |
|--------|------|------|
| `prx_llm_requests_total` | Counter | 총 LLM 요청 수 (프로바이더, 모델별) |
| `prx_llm_request_duration_seconds` | Histogram | LLM 요청 지연 시간 |
| `prx_llm_tokens_total` | Counter | 총 토큰 수 (입력/출력, 모델별) |
| `prx_llm_errors_total` | Counter | LLM 오류 수 (유형별) |
| `prx_llm_cost_dollars` | Counter | 추정 비용 (USD) |

### 시스템 메트릭

| 메트릭 | 타입 | 설명 |
|--------|------|------|
| `prx_memory_usage_bytes` | Gauge | 프로세스 메모리 사용량 |
| `prx_cpu_usage_ratio` | Gauge | 프로세스 CPU 사용량 |

## 설정

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## 관련 페이지

- [관측성 개요](./)
- [OpenTelemetry 트레이싱](./opentelemetry)

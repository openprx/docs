---
title: OpenTelemetry
description: PRX에서 스팬 수준 분석을 위한 OpenTelemetry 분산 트레이싱입니다.
---

# OpenTelemetry

PRX는 분산 트레이싱을 위해 OpenTelemetry (OTLP)를 지원합니다. 트레이스는 LLM 호출, 도구 실행, 메모리 작업을 포함한 에이전트 운영에 대한 스팬 수준의 가시성을 제공합니다.

## 개요

각 에이전트 작업은 중첩된 스팬이 포함된 트레이스를 생성합니다:

```
Session
  └── Turn
       ├── Memory Recall (span)
       ├── LLM Request (span)
       │    ├── Token Streaming
       │    └── Response Parsing
       └── Tool Execution (span)
            ├── Policy Check
            └── Sandbox Run
```

## 설정

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP gRPC 엔드포인트
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # 0.0 ~ 1.0
```

## 지원되는 백엔드

PRX는 OTLP 호환 백엔드로 트레이스를 내보낼 수 있습니다:

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray (OTLP 컬렉터 경유)

## 스팬 속성

스팬에 첨부되는 주요 속성:

| 속성 | 설명 |
|------|------|
| `prx.session_id` | 에이전트 세션 식별자 |
| `prx.provider` | LLM 프로바이더명 |
| `prx.model` | 모델 식별자 |
| `prx.tool` | 도구명 (도구 스팬용) |
| `prx.tokens.input` | 입력 토큰 수 |
| `prx.tokens.output` | 출력 토큰 수 |

## 관련 페이지

- [관측성 개요](./)
- [Prometheus 메트릭](./prometheus)

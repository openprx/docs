---
title: OpenTelemetry
description: Распределённая трассировка с OpenTelemetry в PRX для анализа на уровне спанов.
---

# OpenTelemetry

PRX поддерживает OpenTelemetry (OTLP) для распределённой трассировки. Трассы обеспечивают видимость на уровне спанов для операций агента, включая вызовы LLM, выполнения инструментов и операции с памятью.

## Обзор

Каждая операция агента создаёт трассу с вложенными спанами:

```
Session
  └── Turn
       ├── Memory Recall (спан)
       ├── LLM Request (спан)
       │    ├── Token Streaming
       │    └── Response Parsing
       └── Tool Execution (спан)
            ├── Policy Check
            └── Sandbox Run
```

## Конфигурация

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP gRPC-эндпоинт
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # от 0.0 до 1.0
```

## Поддерживаемые бэкенды

PRX может экспортировать трассы в любой OTLP-совместимый бэкенд:

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray (через OTLP-коллектор)

## Атрибуты спанов

Общие атрибуты, прикрепляемые к спанам:

| Атрибут | Описание |
|---------|----------|
| `prx.session_id` | Идентификатор сессии агента |
| `prx.provider` | Имя LLM-провайдера |
| `prx.model` | Идентификатор модели |
| `prx.tool` | Имя инструмента (для спанов инструментов) |
| `prx.tokens.input` | Количество входных токенов |
| `prx.tokens.output` | Количество выходных токенов |

## Связанные страницы

- [Обзор наблюдаемости](./)
- [Метрики Prometheus](./prometheus)

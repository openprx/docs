---
title: OpenTelemetry
description: التتبّع الموزع باستخدام OpenTelemetry في PRX لتحليل على مستوى span.
---

# OpenTelemetry

يدعم PRX معيار OpenTelemetry (OTLP) للتتبّع الموزع. توفّر الآثار traces رؤية على مستوى span لعمليات الوكيل، بما في ذلك استدعاءات LLM، وتنفيذ الأدوات، وعمليات الذاكرة.

## نظرة عامة

تنشئ كل عملية وكيل trace مع spans متداخلة:

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

## الإعداد

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP gRPC endpoint
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # 0.0 to 1.0
```

## الخلفيات المدعومة

يمكن لـ PRX تصدير traces إلى أي خلفية متوافقة مع OTLP:

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray (via OTLP collector)

## خصائص Span

الخصائص الشائعة المرفقة مع spans:

| Attribute | Description |
|-----------|-------------|
| `prx.session_id` | معرّف جلسة الوكيل |
| `prx.provider` | اسم مزود LLM |
| `prx.model` | معرّف النموذج |
| `prx.tool` | اسم الأداة (لـ tool spans) |
| `prx.tokens.input` | عدد توكنات الإدخال |
| `prx.tokens.output` | عدد توكنات الإخراج |

## صفحات ذات صلة

- [نظرة عامة على قابلية الرصد](./)
- [Prometheus Metrics](./prometheus)

---
title: قابلية الرصد
description: نظرة عامة على ميزات قابلية الرصد في PRX بما يشمل المقاييس والتتبّع والتسجيل.
---

# قابلية الرصد

يوفّر PRX قابلية رصد شاملة عبر المقاييس، والتتبّع الموزع، والتسجيل المنظّم. تمكّن هذه الميزات من المراقبة، وتصحيح الأخطاء، وتحسين أداء عمليات الوكيل.

## نظرة عامة

| Feature | Backend | Purpose |
|---------|---------|---------|
| [Prometheus Metrics](./prometheus) | Prometheus | مراقبة كمية (معدلات الطلبات، زمن الاستجابة، الأخطاء) |
| [OpenTelemetry](./opentelemetry) | OTLP-compatible | تتبّع موزع وتحليل على مستوى span |
| Structured Logging | stdout/file | سجلات تشغيلية مفصلة |

## البدء السريع

فعّل قابلية الرصد في `config.toml`:

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

## المقاييس الأساسية

يكشف PRX مقاييس لـ:

- **أداء الوكيل** -- مدة الجلسة، عدد الأدوار لكل جلسة، استدعاءات الأدوات
- **مزود LLM** -- زمن استجابة الطلب، استخدام التوكنات، معدلات الأخطاء، التكلفة
- **الذاكرة** -- زمن استدعاء الذاكرة، حجم التخزين، تكرار الضغط
- **النظام** -- استخدام CPU، استهلاك الذاكرة، الاتصالات النشطة

## صفحات ذات صلة

- [Prometheus Metrics](./prometheus)
- [OpenTelemetry Tracing](./opentelemetry)
- [Heartbeat](/ar/prx/cron/heartbeat)

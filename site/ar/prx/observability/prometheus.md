---
title: مقاييس Prometheus
description: نقطة نهاية مقاييس Prometheus والمقاييس المتاحة في PRX.
---

# مقاييس Prometheus

يوفّر PRX نقطة نهاية متوافقة مع Prometheus للمقاييس بهدف التكامل مع أنظمة المراقبة مثل Grafana وDatadog وAlertManager.

## نقطة النهاية

عند التفعيل، تصبح المقاييس متاحة على:

```
http://127.0.0.1:9090/metrics
```

## المقاييس المتاحة

### مقاييس الوكيل

| Metric | Type | Description |
|--------|------|-------------|
| `prx_sessions_total` | Counter | إجمالي الجلسات المُنشأة |
| `prx_sessions_active` | Gauge | الجلسات النشطة حاليًا |
| `prx_session_duration_seconds` | Histogram | مدة الجلسة |
| `prx_turns_total` | Counter | إجمالي أدوار المحادثة |
| `prx_tool_calls_total` | Counter | إجمالي استدعاءات الأدوات (حسب اسم الأداة) |

### مقاييس مزود LLM

| Metric | Type | Description |
|--------|------|-------------|
| `prx_llm_requests_total` | Counter | إجمالي طلبات LLM (حسب المزود والنموذج) |
| `prx_llm_request_duration_seconds` | Histogram | زمن استجابة طلب LLM |
| `prx_llm_tokens_total` | Counter | إجمالي التوكنات (إدخال/إخراج، حسب النموذج) |
| `prx_llm_errors_total` | Counter | أخطاء LLM (حسب النوع) |
| `prx_llm_cost_dollars` | Counter | التكلفة التقديرية بالدولار الأمريكي |

### مقاييس النظام

| Metric | Type | Description |
|--------|------|-------------|
| `prx_memory_usage_bytes` | Gauge | استخدام ذاكرة العملية |
| `prx_cpu_usage_ratio` | Gauge | استخدام CPU للعملية |

## الإعداد

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## صفحات ذات صلة

- [نظرة عامة على قابلية الرصد](./)
- [OpenTelemetry Tracing](./opentelemetry)

---
title: التشخيص
description: إجراءات وأدوات تشخيص مفصلة لاستكشاف مشكلات PRX وإصلاحها.
---

# التشخيص

تغطي هذه الصفحة إجراءات تشخيص متقدمة للتحقيق في مشكلات PRX التي لا تُحل عبر خطوات استكشاف الأخطاء الأساسية.

## أوامر التشخيص

### prx doctor

فحص صحة شامل:

```bash
prx doctor
```

يتضمن الإخراج:
- نتائج التحقق من صحة الإعدادات
- اختبارات اتصال المزوّد
- فحوصات تبعيات النظام
- ملخص استخدام الموارد

### prx debug

فعّل تسجيلات مستوى التصحيح للحصول على تتبع تفصيلي للعمليات:

```bash
PRX_LOG=debug prx daemon
```

أو اضبطه في الإعدادات:

```toml
[observability]
log_level = "debug"
```

### prx info

اعرض معلومات النظام:

```bash
prx info
```

يعرض:
- إصدار PRX ومعلومات البناء
- نظام التشغيل والبنية المعمارية
- المزوّدون المكوّنون وحالتهم
- نوع الذاكرة الخلفية وحجمها
- عدد الإضافات وحالتها

## تحليل السجلات

سجلات PRX هي JSON منظّم (عند تعيين `log_format = "json"`). الحقول الأساسية التي يجب البحث عنها:

| الحقل | الوصف |
|-------|-------------|
| `level` | مستوى السجل (debug, info, warn, error) |
| `target` | مسار وحدة Rust |
| `session_id` | معرّف الجلسة المرتبط |
| `provider` | مزوّد LLM المستخدم |
| `duration_ms` | مدة العملية |
| `error` | تفاصيل الخطأ (عند الاقتضاء) |

## تشخيص الشبكة

اختبر اتصال المزوّد:

```bash
# Test Anthropic API
prx provider test anthropic

# Test all configured providers
prx provider test --all

# Check network from sandbox
prx sandbox test-network
```

## تحليل الأداء

فعّل نقطة نهاية المقاييس واستخدم Prometheus/Grafana لتحليل الأداء:

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
```

أهم المقاييس التي ينبغي مراقبتها:
- `prx_llm_request_duration_seconds` -- زمن استجابة LLM
- `prx_sessions_active` -- الجلسات المتزامنة
- `prx_memory_usage_bytes` -- استهلاك الذاكرة

## صفحات ذات صلة

- [نظرة عامة على استكشاف الأخطاء وإصلاحها](./)
- [الملاحظة](/ar/prx/observability/)
- [مقاييس Prometheus](/ar/prx/observability/prometheus)

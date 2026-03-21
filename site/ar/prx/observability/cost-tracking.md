---
title: تتبّع التكلفة
description: تتبّع استخدام التوكنات وتكاليف API وتنبيهات الميزانية عبر جميع مزوّدي LLM في PRX.
---

# تتبّع التكلفة

يتضمن PRX نظامًا مدمجًا لتتبّع التكلفة يراقب استهلاك التوكنات والإنفاق على API عبر جميع مزوّدي LLM. يقوم `CostTracker` بتجميع الاستخدام لكل طلب، ولكل جلسة، ولكل مزوّد -- ما يمنحك رؤية كاملة لكيفية استهلاك وكلائك لموارد API.

## نظرة عامة

ينتج عن كل طلب LLM في PRX سجل `TokenUsage` يحتوي على توكنات الإدخال وتوكنات الإخراج والتكلفة المرتبطة. يجري تجميع هذه السجلات بواسطة `CostTracker` ويمكن الاستعلام عنها للتقارير، وفرض الميزانية، وكشف الحالات الشاذة.

```
LLM Request
    │
    ├── Provider returns usage metadata
    │   (input_tokens, output_tokens, cache hits)
    │
    ▼
TokenUsage record created
    │
    ├── Accumulated into CostTracker
    │   ├── Per-request breakdown
    │   ├── Per-session totals
    │   ├── Per-provider totals
    │   └── Per-model totals
    │
    ├── Budget check (if limits configured)
    │   ├── Under budget → continue
    │   └── Over budget → warning / hard stop
    │
    └── Written to observability pipeline
        (metrics, logs, tracing spans)
```

## الإعداد

فعّل واضبط تتبّع التكلفة في `config.toml`:

```toml
[cost]
enabled = true

# Currency for display purposes (does not affect calculations).
currency = "USD"

# How often to flush accumulated costs to persistent storage.
flush_interval_secs = 60

# Persist cost data across restarts.
persist = true
persist_path = "~/.local/share/openprx/cost.db"
```

### حدود الميزانية

اضبط حدود الإنفاق لمنع تصاعد التكاليف بشكل غير مضبوط:

```toml
[cost.budget]
# Daily spending limit across all providers.
daily_limit = 10.00

# Monthly spending limit.
monthly_limit = 200.00

# Per-session limit (resets when a new session starts).
session_limit = 2.00

# Action when a limit is reached: "warn" or "stop".
# "warn" logs a warning but allows requests to continue.
# "stop" blocks further LLM requests until the period resets.
on_limit = "warn"
```

### حدود لكل مزوّد

يمكنك تجاوز حدود الميزانية لمزوّدين محددين:

```toml
[cost.budget.providers.openai]
daily_limit = 5.00
monthly_limit = 100.00

[cost.budget.providers.anthropic]
daily_limit = 8.00
monthly_limit = 150.00
```

## بنية TokenUsage

ينتج عن كل طلب LLM سجل `TokenUsage`:

| Field | Type | Description |
|-------|------|-------------|
| `input_tokens` | u64 | عدد التوكنات في prompt (system + user + context) |
| `output_tokens` | u64 | عدد التوكنات في استجابة النموذج |
| `cache_read_tokens` | u64 | توكنات تم تقديمها من cache المزود (Anthropic prompt caching) |
| `cache_write_tokens` | u64 | توكنات كُتبت إلى cache المزود |
| `total_tokens` | u64 | `input_tokens + output_tokens` |
| `cost` | f64 | التكلفة التقديرية بالعملة المُعدّة |
| `provider` | string | اسم المزوّد (مثل "openai", "anthropic") |
| `model` | string | معرّف النموذج (مثل "gpt-4o", "claude-sonnet-4-20250514") |
| `timestamp` | datetime | وقت تنفيذ الطلب |
| `session_id` | string | جلسة الوكيل التي أنشأت الطلب |

## CostTracker

يُعد `CostTracker` نقطة التجميع المركزية لكل استخدام التوكنات. وهو يحافظ على مجاميع تراكمية حسب المزوّد، وحسب النموذج، ولكل جلسة، ويوميًا (يعاد التصفير عند منتصف الليل UTC)، وشهريًا (يعاد التصفير في اليوم الأول من الشهر). المتتبع آمن للخيوط ويتم تحديثه بعد كل استجابة LLM.

## بيانات التسعير

يحافظ PRX على جدول تسعير مدمج للمزوّدين والنماذج الشائعة. تُعرّف الأسعار لكل مليون توكن:

| Provider | Model | Input (per 1M) | Output (per 1M) |
|----------|-------|----------------|-----------------|
| OpenAI | gpt-4o | $2.50 | $10.00 |
| OpenAI | gpt-4o-mini | $0.15 | $0.60 |
| OpenAI | o3 | $10.00 | $40.00 |
| Anthropic | claude-sonnet-4-20250514 | $3.00 | $15.00 |
| Anthropic | claude-haiku-35-20241022 | $0.80 | $4.00 |
| Anthropic | claude-opus-4-20250514 | $15.00 | $75.00 |
| Google | gemini-2.0-flash | $0.075 | $0.30 |
| DeepSeek | deepseek-chat | $0.14 | $0.28 |

### تسعير مخصص

يمكنك تجاوز التسعير أو إضافة تسعير لنماذج غير موجودة في الجدول المدمج:

```toml
[cost.pricing."openai/gpt-4o"]
input_per_million = 2.50
output_per_million = 10.00

[cost.pricing."custom/my-model"]
input_per_million = 1.00
output_per_million = 3.00
```

بالنسبة للنماذج المستضافة ذاتيًا (Ollama, vLLM) حيث تكون استدعاءات API مجانية، اضبط التسعير إلى صفر:

```toml
[cost.pricing."ollama/llama3"]
input_per_million = 0.0
output_per_million = 0.0
```

## تقارير الاستخدام

### أوامر CLI

```bash
# View current session cost summary
prx cost

# View daily breakdown
prx cost --period daily

# View monthly breakdown by provider
prx cost --period monthly --group-by provider

# View costs for a specific date range
prx cost --from 2026-03-01 --to 2026-03-15

# Export to CSV
prx cost --period monthly --format csv > costs.csv

# Export to JSON (for programmatic consumption)
prx cost --period daily --format json
```

### مثال على المخرجات

```
PRX Cost Report (2026-03-21)
════════════════════════════════════════════════════
Provider     Model                   Tokens (in/out)    Cost
─────────────────────────────────────────────────────────────
anthropic    claude-sonnet-4-20250514      45.2K / 12.8K    $0.33
openai       gpt-4o                  22.1K / 8.4K     $0.14
openai       gpt-4o-mini              8.3K / 3.1K     $0.00
─────────────────────────────────────────────────────────────
Total                                75.6K / 24.3K    $0.47

Budget Status:
  Session: $0.47 / $2.00 (23.5%)
  Daily:   $3.82 / $10.00 (38.2%)
  Monthly: $42.15 / $200.00 (21.1%)
```

## تنبيهات الميزانية

عندما تقترب التكلفة من حد الميزانية، يتخذ PRX إجراءً بناءً على إعداد `on_limit`:

| Threshold | `on_limit = "warn"` | `on_limit = "stop"` |
|-----------|--------------------|--------------------|
| 80% of limit | Log warning | Log warning |
| 100% of limit | Log error, continue | Block LLM requests, notify user |
| Limit reset (new day/month) | Counters reset | Counters reset, requests unblocked |

كما يتم إصدار تنبيهات الميزانية كأحداث قابلية رصد. عند تفعيل مقاييس Prometheus، يتم تصدير المقاييس التالية:

```
prx_cost_daily_total{currency="USD"} 3.82
prx_cost_monthly_total{currency="USD"} 42.15
prx_cost_session_total{currency="USD"} 0.47
prx_cost_budget_daily_remaining{currency="USD"} 6.18
prx_cost_budget_monthly_remaining{currency="USD"} 157.85
```

## التكامل مع قابلية الرصد

تتكامل بيانات التكلفة مع منظومة قابلية الرصد في PRX:

- **Prometheus** -- عدادات التوكنات ومقاييس التكلفة لكل مزوّد/نموذج
- **OpenTelemetry** -- خصائص span مثل `prx.tokens.input` و`prx.tokens.output` و`prx.cost`
- **Logs** -- تُسجل تكلفة كل طلب على مستوى DEBUG، وتنبيهات الميزانية على مستوى WARN

## ملاحظات أمنية

- قد تكشف بيانات التكلفة أنماط الاستخدام. قيّد الوصول إلى تقارير التكلفة في البيئات متعددة المستخدمين.
- تحتوي قاعدة بيانات التكلفة الدائمة (`cost.db`) على سجل الاستخدام. أدرجها ضمن استراتيجية النسخ الاحتياطي.
- يتم فرض حدود الميزانية محليًا. وهي لا تتفاعل مع حدود الإنفاق لدى المزوّد. اضبط الاثنين معًا لتحقيق دفاع متعدد الطبقات.

## صفحات ذات صلة

- [نظرة عامة على قابلية الرصد](/ar/prx/observability/)
- [Prometheus Metrics](/ar/prx/observability/prometheus)
- [OpenTelemetry](/ar/prx/observability/opentelemetry)
- [إعداد المزوّد](/ar/prx/providers/)

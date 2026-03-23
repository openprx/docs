---
title: مرجع تكوين CTE
description: مرجع التكوين الكامل لمحرك الشجرة السببية في PRX.
---

# مرجع تكوين CTE

يتم تكوين محرك الشجرة السببية عبر قسم `[causal_tree]` في ملف تكوين PRX.

> **CTE معطل افتراضياً.** جميع المعلمات أدناه تسري فقط عندما `causal_tree.enabled = true`.

## مثال كامل

```toml
[causal_tree]
enabled = true

w_confidence = 0.50
w_cost = 0.25
w_latency = 0.25

write_decision_log = true
write_metrics = true

[causal_tree.policy]
max_branches = 3
commit_threshold = 0.62
extra_token_ratio_limit = 0.35
extra_latency_budget_ms = 300
rehearsal_timeout_ms = 5000
default_side_effect_mode = "read_only"
circuit_breaker_threshold = 5
circuit_breaker_cooldown_secs = 60
```

## مرجع المعلمات

### معلمات المستوى الأعلى

| المعلمة | النوع | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `enabled` | bool | `false` | المفتاح الرئيسي. عند `false`، يتم تجاوز CTE بالكامل. |
| `w_confidence` | f32 | `0.50` | وزن التقييم لبعد الثقة. |
| `w_cost` | f32 | `0.25` | وزن التقييم لعقوبة التكلفة. |
| `w_latency` | f32 | `0.25` | وزن التقييم لعقوبة زمن الاستجابة. |
| `write_decision_log` | bool | `true` | عند التفعيل، يصدر سجلاً منظماً لكل قرار CTE. |
| `write_metrics` | bool | `true` | عند التفعيل، يجمع مقاييس أداء CTE. |

### معلمات السياسة (`[causal_tree.policy]`)

| المعلمة | النوع | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `max_branches` | usize | `3` | الحد الأقصى لعدد الفروع المرشحة لكل طلب. |
| `commit_threshold` | f32 | `0.62` | الحد الأدنى للدرجة المركبة لالتزام فرع. |
| `extra_token_ratio_limit` | f32 | `0.35` | الحد الأقصى لنسبة الرموز الإضافية لـ CTE مقارنة بالطلب الأساسي. |
| `extra_latency_budget_ms` | u64 | `300` | الحد الأقصى لزمن الاستجابة الإضافي لخط أنابيب CTE (ملي ثانية). |
| `rehearsal_timeout_ms` | u64 | `5000` | مهلة التجربة الواحدة (ملي ثانية). |
| `default_side_effect_mode` | string | `"read_only"` | وضع الآثار الجانبية. `"read_only"` / `"dry_run"` / `"live"`. |
| `circuit_breaker_threshold` | u32 | `5` | عدد حالات الفشل المتتالية لتشغيل قاطع الدائرة. |
| `circuit_breaker_cooldown_secs` | u64 | `60` | فترة تبريد قاطع الدائرة (ثوانٍ). |

## التكوين الأدنى

```toml
[causal_tree]
enabled = true
```

## صفحات ذات صلة

- [نظرة عامة على محرك الشجرة السببية](./)
- [مرجع التكوين الكامل](/ar/prx/config/reference)

---
title: سجل القرارات
description: "تسجيل القرارات أثناء دورات التطور الذاتي: ما الذي يُسجل، والصيغة، والتحليل، وتتبع rollback."
---

# سجل القرارات

يتم تسجيل كل قرار يُتخذ أثناء دورة التطور الذاتي في سجل قرارات منظّم. يوفّر هذا السجل مسار تدقيق كاملًا لما قرره نظام التطور، ولماذا قرره، وما الذي حدث نتيجة لذلك، مما يتيح التحليل اللاحق والتصحيح وrollback الآمن.

## نظرة عامة

يلتقط سجل القرارات دورة الحياة الكاملة لقرارات التطور:

- **توليد المقترح** -- ما التحسين المقترح ولماذا
- **التقييم** -- كيف جرى تقييم المقترح مقابل معايير السلامة والملاءمة
- **الحكم** -- هل تمت الموافقة على المقترح أو رفضه أو تأجيله
- **التنفيذ** -- ما التغييرات التي طُبقت وآثارها المباشرة
- **النتيجة** -- النتائج المقاسة بعد التغيير، بما في ذلك أي تراجعات

بخلاف سجل تدقيق الأمان (الذي يسجل جميع الأحداث الأمنية)، يركّز سجل القرارات تحديدًا على عملية الاستدلال الخاصة بنظام التطور الذاتي.

## بنية سجل القرار

يُخزن كل قرار كسجل منظّم:

| الحقل | النوع | الوصف |
|-------|------|-------|
| `decision_id` | `String` | معرف فريد (UUIDv7 مرتب زمنيًا) |
| `cycle_id` | `String` | دورة التطور التي أنتجت هذا القرار |
| `layer` | `Layer` | طبقة التطور: `L1` (memory) أو `L2` (prompt) أو `L3` (strategy) |
| `timestamp` | `DateTime<Utc>` | وقت تسجيل القرار |
| `proposal` | `Proposal` | التغيير المقترح (النوع، الوصف، المعلمات) |
| `rationale` | `String` | تفسير سبب اقتراح هذا التغيير |
| `data_points` | `usize` | عدد عينات البيانات التي استند إليها القرار |
| `fitness_before` | `f64` | درجة fitness قبل التغيير |
| `fitness_after` | `Option<f64>` | درجة fitness بعد التغيير (تُملأ بعد التنفيذ) |
| `verdict` | `Verdict` | `approved` أو `rejected` أو `deferred` أو `auto_approved` |
| `verdict_reason` | `String` | سبب الوصول للحكم (مثل نتيجة فحص السلامة) |
| `executed` | `bool` | هل تم تطبيق التغيير فعليًا |
| `rollback_id` | `Option<String>` | مرجع snapshot الخاص بالـ rollback، إن تم إنشاؤه |
| `outcome` | `Option<Outcome>` | نتيجة ما بعد التنفيذ: `improved` أو `neutral` أو `regressed` أو `rolled_back` |

### أنواع الأحكام

| الحكم | الوصف | المُشغّل |
|------|-------|----------|
| `auto_approved` | موافقة تلقائية من خط الأنابيب | تغييرات L1 بدرجة مخاطر أقل من الحد |
| `approved` | تمت الموافقة بعد التقييم | تغييرات L2/L3 التي تتجاوز فحوصات السلامة |
| `rejected` | رُفض من خط أنابيب السلامة | فشل فحوصات sanity، أو مخاطر عالية، أو تعارضات مكتشفة |
| `deferred` | أُجّل لتقييم لاحق | بيانات غير كافية أو مخاوف متعلقة بصحة النظام |

## الإعداد

```toml
[self_evolution.decision_log]
enabled = true
storage = "file"                # "file" or "database"
path = "~/.local/share/openprx/decisions/"
format = "jsonl"                # "jsonl" or "json" (pretty-printed)
retention_days = 180            # auto-delete entries older than 180 days
max_entries = 10000             # maximum entries before rotation

[self_evolution.decision_log.database]
backend = "sqlite"
path = "~/.local/share/openprx/decisions.db"
```

## مرجع الإعداد

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|-----------|-------|
| `enabled` | `bool` | `true` | تفعيل أو تعطيل تسجيل القرارات |
| `storage` | `String` | `"file"` | واجهة التخزين الخلفية: `"file"` أو `"database"` |
| `path` | `String` | `"~/.local/share/openprx/decisions/"` | الدليل الخاص بملفات السجل (وضع الملف) |
| `format` | `String` | `"jsonl"` | تنسيق الملف: `"jsonl"` (مضغوط) أو `"json"` (مقروء بشريًا) |
| `retention_days` | `u64` | `180` | حذف تلقائي للإدخالات الأقدم من N يومًا. 0 = الاحتفاظ دائمًا |
| `max_entries` | `usize` | `10000` | أقصى عدد إدخالات لكل ملف قبل التدوير |
| `database.backend` | `String` | `"sqlite"` | واجهة قاعدة البيانات: `"sqlite"` أو `"postgres"` |
| `database.path` | `String` | `""` | مسار قاعدة البيانات (SQLite) أو عنوان الاتصال (PostgreSQL) |

## مثال على سجل قرار

```json
{
  "decision_id": "019520b0-5678-7000-8000-000000000042",
  "cycle_id": "cycle_2026-03-21T03:00:00Z",
  "layer": "L2",
  "timestamp": "2026-03-21T03:05:12.345Z",
  "proposal": {
    "type": "prompt_refinement",
    "description": "Shorten system prompt preamble by 15% to reduce token usage",
    "parameters": {
      "target": "system_prompt.preamble",
      "old_token_count": 320,
      "new_token_count": 272
    }
  },
  "rationale": "Analysis of 500 sessions shows the preamble consumes 8% of context window with low recall contribution. A/B test variant with shortened preamble showed 3% improvement in response relevance.",
  "data_points": 500,
  "fitness_before": 0.72,
  "fitness_after": 0.75,
  "verdict": "approved",
  "verdict_reason": "Passed all safety checks. Risk score 0.12 (threshold: 0.5). No conflicts with existing policies.",
  "executed": true,
  "rollback_id": "snap_019520b0-5678-7000-8000-000000000043",
  "outcome": "improved"
}
```

## الاستعلام عن سجل القرارات

### أوامر CLI

```bash
# View recent decisions
prx evolution decisions --tail 20

# Filter by layer
prx evolution decisions --layer L2 --last 30d

# Filter by verdict
prx evolution decisions --verdict rejected --last 7d

# Filter by outcome
prx evolution decisions --outcome regressed

# Show a specific decision with full details
prx evolution decisions --id 019520b0-5678-7000-8000-000000000042

# Export decisions for analysis
prx evolution decisions --last 90d --format json > decisions_q1.json
```

### الوصول البرمجي

يمكن الوصول إلى سجل القرارات عبر Gateway API:

```bash
# List recent decisions
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions?limit=20

# Get a specific decision
curl -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/evolution/decisions/019520b0-5678-7000-8000-000000000042
```

## تحليل أنماط القرارات

يتيح سجل القرارات عدة أنواع من التحليل:

### معدل الموافقة حسب الطبقة

تابع نسبة المقترحات الموافق عليها في كل طبقة لفهم فعالية نظام التطور:

```bash
prx evolution stats --last 90d
```

مثال على المخرجات:

```
Layer   Proposed  Approved  Rejected  Deferred  Approval Rate
L1      142       138       2         2         97.2%
L2      28        19        6         3         67.9%
L3      5         2         3         0         40.0%
```

### اكتشاف التراجع

حدد القرارات التي أدت إلى تراجعات:

```bash
prx evolution decisions --outcome regressed --last 90d
```

يتضمن كل قرار متراجع القيمتين `fitness_before` و`fitness_after`، ما يجعل قياس الأثر والربط مع التغيير مباشرًا.

### تتبع Rollback

عند تنفيذ rollback لقرار ما، يسجل السجل ما يلي:

1. القرار الأصلي مع `outcome = "rolled_back"`
2. سجل قرار جديد لعملية rollback نفسها
3. `rollback_id` يعود إلى snapshot الذي تمت استعادته

تتيح هذه السلسلة تتبع دورة الحياة كاملة: المقترح، التنفيذ، اكتشاف التراجع، ثم rollback.

## تنفيذ Rollback من سجل القرارات

لإجراء rollback يدوي لقرار محدد:

```bash
# View the decision and its rollback snapshot
prx evolution decisions --id <decision_id>

# Restore the snapshot
prx evolution rollback --snapshot <rollback_id>
```

تنشئ عملية rollback سجل قرار جديدًا يوثّق التدخل اليدوي.

## التكامل مع نظام السلامة

يتكامل سجل القرارات مع خط أنابيب السلامة:

- **قبل التنفيذ** -- يقرأ خط أنابيب السلامة القرارات السابقة لاكتشاف الأنماط (مثل الإخفاقات المتكررة في المنطقة نفسها)
- **بعد التنفيذ** -- إشارات التراجع تُفعّل rollback تلقائيًا، ويُسجل ذلك في السجل
- **تحديد المعدل** -- يفحص خط الأنابيب السجل لفرض الحد الأقصى للتغييرات لكل نافذة زمنية

## القيود

- سجلات القرارات محلية لمثيل PRX؛ النشرات متعددة العقد تتطلب تجميع سجلات خارجي
- واجهة الملفات لا تدعم الاستعلامات المفهرسة؛ استخدم واجهة قاعدة البيانات للتحليل واسع النطاق
- درجات fitness لا تُملأ إلا بعد اكتمال نافذة الملاحظة (قابلة للضبط حسب الطبقة)
- قد لا تُحل القرارات المؤجلة أبدًا إذا لم يُعد تقييم شرط التأجيل

## صفحات ذات صلة

- [نظرة عامة على التطور الذاتي](./)
- [خط أنابيب التطور](./pipeline) -- خط الأنابيب المكون من 4 مراحل الذي ينتج القرارات
- [التجارب وتقييم Fitness](./experiments) -- A/B testing وتقييم fitness
- [السلامة وRollback](./safety) -- فحوصات السلامة وrollback التلقائي

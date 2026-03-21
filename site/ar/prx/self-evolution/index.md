---
title: نظام التطور الذاتي
description: نظرة عامة على نظام PRX للتطور الذاتي متعدد الطبقات (3 طبقات) لتحسين الوكلاء بشكل مستقل.
---

# نظام التطور الذاتي

يتضمن PRX نظام تطور ذاتي من 3 طبقات يمكّن الوكلاء من تحسين سلوكهم بشكل مستقل مع مرور الوقت. يحلل النظام أداء الوكيل باستمرار ويطبق تحسينات متدرجة، من تحسين الذاكرة إلى ضبط المطالبات ثم تغييرات السياسات الاستراتيجية.

## نظرة عامة

يُنظَّم التطور الذاتي في ثلاث طبقات، تعمل كل منها على مستوى مختلف من التجريد:

| الطبقة | النطاق | التكرار | المخاطر |
|-------|--------|---------|---------|
| [L1: الذاكرة](./l1-memory) | ضغط الذاكرة، تجميع المواضيع | كل جلسة | منخفض |
| [L2: المطالبة](./l2-prompt) | تحسين مطالبة النظام، A/B testing | يومي/أسبوعي | متوسط |
| [L3: الاستراتيجية](./l3-strategy) | سياسات الأدوات، قواعد التوجيه، الحوكمة | أسبوعي/شهري | مرتفع |

## المعمارية

```
┌───────────────────────────────────────┐
│         Self-Evolution Engine          │
│                                        │
│  L3: Strategy    ← Low frequency       │
│    ├── Tool policy tuning              │
│    ├── Routing optimization            │
│    └── Governance adjustments          │
│                                        │
│  L2: Prompt      ← Medium frequency    │
│    ├── System prompt refinement        │
│    └── A/B testing framework           │
│                                        │
│  L1: Memory      ← High frequency      │
│    ├── Memory compaction               │
│    └── Topic clustering                │
└───────────────────────────────────────┘
```

## السلامة أولًا

يمر كل مقترح تطور عبر خط أنابيب أمان قبل التنفيذ. راجع [السلامة](./safety) للتفاصيل حول حماية rollback وفحوصات sanity.

## الإعداد

```toml
[self_evolution]
enabled = false  # opt-in only
auto_apply = false  # require manual approval by default

[self_evolution.l1]
enabled = true
schedule = "after_session"

[self_evolution.l2]
enabled = false
schedule = "weekly"

[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
```

## صفحات ذات صلة

- [L1: ضغط الذاكرة](./l1-memory)
- [L2: تحسين المطالبة](./l2-prompt)
- [L3: ضبط الاستراتيجية](./l3-strategy)
- [خط أنابيب التطور](./pipeline)
- [السلامة وRollback](./safety)

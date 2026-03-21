---
title: prx evolution
description: مراقبة والتحكم في محرك التطور الذاتي لـ PRX.
---

# prx evolution

فحص والتحكم في محرك التطور الذاتي. يدعم PRX ثلاثة مستويات من التطور المستقل: الطبقة الأولى (الذاكرة)، الطبقة الثانية (المطالبات)، والطبقة الثالثة (الاستراتيجيات). يتيح لك هذا الأمر التحقق من حالة التطور ومراجعة السجل وتحديث الإعدادات وتشغيل دورات تطور يدوية.

## الاستخدام

```bash
prx evolution <SUBCOMMAND> [OPTIONS]
```

## الأوامر الفرعية

### `prx evolution status`

عرض الحالة الحالية لمحرك التطور.

```bash
prx evolution status [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--json` | `-j` | `false` | المخرج بتنسيق JSON |

**مثال على المخرج:**

```
 Evolution Engine Status
 ───────────────────────
 Engine:    running
 L1 Memory:    enabled   (last: 2h ago, next: in 4h)
 L2 Prompt:    enabled   (last: 1d ago, next: in 23h)
 L3 Strategy:  disabled
 Total cycles: 142
 Rollbacks:    3
```

### `prx evolution history`

عرض سجل التطور.

```bash
prx evolution history [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--limit` | `-n` | `20` | عدد المدخلات المعروضة |
| `--level` | `-l` | الكل | التصفية حسب المستوى: `l1`، `l2`، `l3` |
| `--json` | `-j` | `false` | المخرج بتنسيق JSON |

```bash
# عرض آخر 10 تطورات من الطبقة الثانية
prx evolution history --limit 10 --level l2
```

**مثال على المخرج:**

```
 Time                Level  Action                          Status
 2026-03-21 08:00    L1     memory consolidation            success
 2026-03-20 20:00    L1     memory consolidation            success
 2026-03-20 09:00    L2     prompt refinement (system)      success
 2026-03-19 14:22    L2     prompt refinement (tool-use)    rolled back
```

### `prx evolution config`

عرض أو تحديث إعدادات التطور.

```bash
prx evolution config [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--set` | | | تعيين قيمة إعداد (مثل `--set l1.enabled=true`) |
| `--json` | `-j` | `false` | المخرج بتنسيق JSON |

```bash
# عرض الإعدادات الحالية
prx evolution config

# تفعيل تطور استراتيجيات الطبقة الثالثة
prx evolution config --set l3.enabled=true

# تعيين فاصل الطبقة الأولى إلى ساعتين
prx evolution config --set l1.interval=7200
```

### `prx evolution trigger`

تشغيل دورة تطور يدويًا.

```bash
prx evolution trigger [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--level` | `-l` | `l1` | مستوى التطور المراد تشغيله: `l1`، `l2`، `l3` |
| `--dry-run` | | `false` | معاينة التطور دون تطبيق التغييرات |

```bash
# تشغيل تطور ذاكرة الطبقة الأولى
prx evolution trigger --level l1

# معاينة تطور مطالبات الطبقة الثانية
prx evolution trigger --level l2 --dry-run
```

## مستويات التطور

| المستوى | الهدف | الوصف |
|---------|-------|-------|
| **الطبقة الأولى** | الذاكرة | تجميع وإزالة التكرار وتنظيم مدخلات الذاكرة |
| **الطبقة الثانية** | المطالبات | تحسين مطالبات النظام وتعليمات استخدام الأدوات بناءً على أنماط التفاعل |
| **الطبقة الثالثة** | الاستراتيجيات | تكييف الاستراتيجيات السلوكية عالية المستوى (يتطلب تفعيلاً صريحًا) |

جميع تغييرات التطور قابلة للعكس. يحتفظ المحرك بسجل تراجع ويعكس التغييرات تلقائيًا التي تسبب تدهورًا في الأداء.

## ذو صلة

- [نظرة عامة على التطور الذاتي](/ar/prx/self-evolution/) -- البنية والمفاهيم
- [الطبقة الأولى: تطور الذاكرة](/ar/prx/self-evolution/l1-memory) -- تفاصيل تجميع الذاكرة
- [الطبقة الثانية: تطور المطالبات](/ar/prx/self-evolution/l2-prompt) -- أنبوب تحسين المطالبات
- [الطبقة الثالثة: تطور الاستراتيجيات](/ar/prx/self-evolution/l3-strategy) -- تكييف الاستراتيجيات
- [سلامة التطور](/ar/prx/self-evolution/safety) -- آليات التراجع والسلامة

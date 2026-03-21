---
title: prx cron
description: إدارة المهام الدورية المجدولة التي تعمل على خادم PRX.
---

# prx cron

إدارة المهام المجدولة التي تُنفَّذ على مجدول المهام الدورية في PRX. يمكن للمهام الدورية تشغيل مطالبات النماذج اللغوية أو أوامر الصدفة أو استدعاءات الأدوات وفق جدول محدد.

## الاستخدام

```bash
prx cron <SUBCOMMAND> [OPTIONS]
```

## الأوامر الفرعية

### `prx cron list`

عرض جميع المهام الدورية المضبوطة وحالتها.

```bash
prx cron list [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--json` | `-j` | `false` | المخرج بتنسيق JSON |
| `--verbose` | `-v` | `false` | عرض تفاصيل المهمة الكاملة بما في ذلك تعبير الجدولة |

**مثال على المخرج:**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

إضافة مهمة دورية جديدة.

```bash
prx cron add [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--name` | `-n` | مطلوب | اسم المهمة |
| `--schedule` | `-s` | مطلوب | تعبير cron (5 أو 6 حقول) |
| `--prompt` | `-p` | | مطالبة النموذج اللغوي للتنفيذ |
| `--command` | `-c` | | أمر صدفة للتنفيذ |
| `--channel` | | | القناة لإرسال المخرج إليها |
| `--provider` | `-P` | الافتراضي من الإعدادات | مزود النماذج اللغوية لمهام المطالبات |
| `--model` | `-m` | الافتراضي من المزود | النموذج لمهام المطالبات |
| `--enabled` | | `true` | تفعيل المهمة فورًا |

يجب تقديم إما `--prompt` أو `--command`.

```bash
# جدولة ملخص يومي
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# جدولة أمر نسخ احتياطي
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# تقرير أسبوعي كل يوم اثنين الساعة 10 صباحًا
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

إزالة مهمة دورية بالمعرف أو الاسم.

```bash
prx cron remove <ID|NAME> [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--force` | `-f` | `false` | تجاوز طلب التأكيد |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

إيقاف مهمة دورية مؤقتًا. تبقى المهمة مضبوطة لكنها لن تُنفَّذ حتى يتم استئنافها.

```bash
prx cron pause <ID|NAME>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

استئناف مهمة دورية متوقفة.

```bash
prx cron resume <ID|NAME>
```

```bash
prx cron resume weekly-report
```

## تنسيق تعبير Cron

يستخدم PRX تعبيرات cron القياسية ذات 5 حقول:

```
 ┌───────── الدقيقة (0-59)
 │ ┌───────── الساعة (0-23)
 │ │ ┌───────── يوم الشهر (1-31)
 │ │ │ ┌───────── الشهر (1-12)
 │ │ │ │ ┌───────── يوم الأسبوع (0-7، 0 و7 = الأحد)
 │ │ │ │ │
 * * * * *
```

أمثلة شائعة:

| التعبير | الوصف |
|---------|-------|
| `0 9 * * *` | كل يوم الساعة 9:00 صباحًا |
| `*/15 * * * *` | كل 15 دقيقة |
| `0 */6 * * *` | كل 6 ساعات |
| `0 10 * * 1` | كل يوم اثنين الساعة 10:00 صباحًا |
| `0 0 1 * *` | أول يوم من كل شهر عند منتصف الليل |

## ذو صلة

- [نظرة عامة على الجدولة](/ar/prx/cron/) -- بنية cron ونبضات القلب
- [مهام Cron](/ar/prx/cron/tasks) -- أنواع المهام وتفاصيل التنفيذ
- [prx daemon](./daemon) -- الخادم الذي يشغّل مجدول المهام الدورية

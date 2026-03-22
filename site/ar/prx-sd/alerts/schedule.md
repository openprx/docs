---
title: الفحوصات المجدولة
description: إعداد مهام فحص متكررة باستخدام sd schedule للكشف الآلي عن التهديدات على فترات منتظمة.
---

# الفحوصات المجدولة

يُدير الأمر `sd schedule` مهام فحص متكررة تعمل على فترات زمنية محددة. تُكمِّل الفحوصات المجدولة المراقبة في الوقت الفعلي عن طريق إجراء فحوصات كاملة دورية للدلائل المحددة، واكتشاف التهديدات التي ربما فاتت أو أُدخِلت أثناء توقف المراقبة.

## الاستخدام

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### الأوامر الفرعية

| الأمر الفرعي | الوصف |
|------------|-------------|
| `add` | إنشاء مهمة فحص مجدولة جديدة |
| `remove` | إزالة مهمة فحص مجدولة |
| `list` | سرد جميع مهام الفحص المجدولة |
| `status` | عرض حالة المهام المجدولة بما فيها آخر تشغيل وأوقات التشغيل التالي |
| `run` | تشغيل مهمة مجدولة يدوياً بشكل فوري |

## إضافة فحص مجدول

```bash
sd schedule add <PATH> [OPTIONS]
```

| العلم | المختصر | الافتراضي | الوصف |
|------|-------|---------|-------------|
| `--frequency` | `-f` | `daily` | تكرار الفحص: `hourly`, `4h`, `12h`, `daily`, `weekly` |
| `--name` | `-n` | مُولَّد تلقائياً | اسم قابل للقراءة لهذه المهمة |
| `--recursive` | `-r` | `true` | فحص الدلائل بشكل متكرر |
| `--auto-quarantine` | `-q` | `false` | عزل التهديدات المكتشفة |
| `--exclude` | `-e` | | أنماط glob للاستثناء (قابل للتكرار) |
| `--notify` | | `true` | إرسال تنبيهات عند الاكتشاف |
| `--time` | `-t` | عشوائي | وقت البدء المفضل (HH:MM، صيغة 24 ساعة) |
| `--day` | `-d` | `monday` | يوم الأسبوع للفحوصات الأسبوعية |

### خيارات التكرار

| التكرار | الفترة | حالة الاستخدام |
|-----------|----------|----------|
| `hourly` | كل 60 دقيقة | الدلائل عالية المخاطر (رفع الملفات، المؤقت) |
| `4h` | كل 4 ساعات | الدلائل المشتركة، جذور الويب |
| `12h` | كل 12 ساعة | دلائل المنزل للمستخدم |
| `daily` | كل 24 ساعة | الفحوصات الكاملة للأغراض العامة |
| `weekly` | كل 7 أيام | الأرشيفات منخفضة المخاطر، التحقق من النسخ الاحتياطية |

### أمثلة

```bash
# فحص يومي لدلائل المنزل
sd schedule add /home --frequency daily --name "home-daily"

# فحص ساعي لدليل الرفع مع عزل تلقائي
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# فحص أسبوعي كامل باستثناء ملفات الوسائط الكبيرة
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# فحص كل 4 ساعات لدلائل temp
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# فحص يومي في وقت محدد
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# فحص أسبوعي يوم الأحد
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## سرد الفحوصات المجدولة

```bash
sd schedule list
```

```
Scheduled Scan Jobs (4)

Name              Path              Frequency  Auto-Q  Next Run
home-daily        /home             daily      no      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly     yes     2026-03-21 11:00
tmp-4h            /tmp              4h         yes     2026-03-21 14:00
full-weekly       /                 weekly     no      2026-03-23 03:00 (Sun)
```

## فحص حالة المهمة

```bash
sd schedule status
```

```
Scheduled Scan Status

Name              Last Run              Duration  Files    Threats  Status
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        clean
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        threats found
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        clean
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        threats found
```

الحصول على حالة مفصلة لمهمة محددة:

```bash
sd schedule status home-daily
```

```
Job: home-daily
  Path:           /home
  Frequency:      daily (every 24h)
  Preferred Time: 02:00
  Auto-Quarantine: no
  Recursive:      yes
  Excludes:       (none)

  Last Run:       2026-03-21 02:00:12 UTC
  Duration:       8 minutes 32 seconds
  Files Scanned:  45,231
  Threats Found:  0
  Result:         Clean

  Next Run:       2026-03-22 02:00 UTC
  Total Runs:     47
  Total Threats:  3 (across all runs)
```

## إزالة الفحوصات المجدولة

```bash
# إزالة بالاسم
sd schedule remove home-daily

# إزالة جميع الفحوصات المجدولة
sd schedule remove --all
```

## تشغيل فحص يدوياً

تشغيل مهمة مجدولة فوراً دون انتظار الفترة التالية:

```bash
sd schedule run home-daily
```

يُنفِّذ هذا الفحص بجميع الخيارات المُهيَّأة (العزل، الاستثناءات، الإشعارات) ويُحدِّث طابع وقت آخر تشغيل للمهمة.

## كيف يعمل الجدول الزمني

يستخدم PRX-SD جدولاً زمنياً داخلياً، وليس cron النظام. يعمل الجدول الزمني كجزء من عملية الـ daemon:

```
sd daemon start
  └── Scheduler thread
        ├── Check job intervals every 60 seconds
        ├── Launch scan jobs when interval elapsed
        ├── Serialize results to ~/.prx-sd/schedule/
        └── Send notifications on completion
```

::: warning
تعمل الفحوصات المجدولة فقط عندما يكون الـ daemon نشطاً. إذا توقف الـ daemon، ستعمل الفحوصات الفائتة عند بدء الـ daemon التالي. استخدم `sd daemon start` لضمان الجدولة المستمرة.
:::

## ملف الإعدادات

تُحفظ المهام المجدولة في `~/.prx-sd/schedule.json` ويمكن أيضاً تعريفها في `config.toml`:

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## تقارير الفحص

كل فحص مجدول يُولِّد تقريراً مُخزَّناً في `~/.prx-sd/reports/`:

```bash
# عرض أحدث تقرير لمهمة
sd schedule report home-daily

# تصدير التقرير بتنسيق JSON
sd schedule report home-daily --json > report.json

# سرد جميع التقارير
sd schedule report --list
```

::: tip
ادمج الفحوصات المجدولة مع تنبيهات البريد الإلكتروني للحصول على تقارير تلقائية. هيِّئ `scan_completed` في أحداث البريد الإلكتروني للحصول على ملخص بعد كل فحص مجدول.
:::

## الخطوات التالية

- [تنبيهات Webhook](./webhook) -- الحصول على إشعارات عندما تجد الفحوصات المجدولة تهديدات
- [تنبيهات البريد الإلكتروني](./email) -- تقارير البريد الإلكتروني من الفحوصات المجدولة
- [الـ Daemon](/ar/prx-sd/realtime/daemon) -- مطلوب لتنفيذ الفحص المجدول
- [الاستجابة للتهديدات](/ar/prx-sd/remediation/) -- تهيئة ما يحدث عند اكتشاف التهديدات

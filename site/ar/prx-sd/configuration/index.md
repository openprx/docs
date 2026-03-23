---
title: نظرة عامة على الإعدادات
description: "فهم كيفية عمل إعدادات PRX-SD وأين تُخزَّن ملفات الإعداد وكيفية عرض الإعدادات وتعديلها وإعادة تعيينها باستخدام أمر sd config."
---

# نظرة عامة على الإعدادات

يخزّن PRX-SD جميع الإعدادات في ملف JSON واحد في `~/.prx-sd/config.json`. يُنشأ هذا الملف تلقائياً عند التشغيل الأول بإعدادات افتراضية معقولة. يمكنك عرض الإعدادات وتعديلها وإعادة تعيينها باستخدام أمر `sd config` أو عن طريق تحرير ملف JSON مباشرةً.

## موقع ملف الإعدادات

| المنصة | المسار الافتراضي |
|----------|-------------|
| لينكس / ماك أو إس | `~/.prx-sd/config.json` |
| ويندوز | `%USERPROFILE%\.prx-sd\config.json` |
| مخصص | `--data-dir /path/to/dir` (علم CLI عام) |

يُلغي علم `--data-dir` العام الموقع الافتراضي. عند تعيينه، يُقرأ ملف الإعداد من `<data-dir>/config.json`.

```bash
# استخدام دليل بيانات مخصص
sd --data-dir /opt/prx-sd config show
```

## أمر `sd config`

### عرض الإعدادات الحالية

عرض جميع الإعدادات الحالية بما فيها مسار ملف الإعدادات:

```bash
sd config show
```

المخرجات:

```
Current Configuration
  File: /home/user/.prx-sd/config.json

{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

### تعيين قيمة إعداد

تعيين أي مفتاح إعداد باستخدام علامة النقطة كفاصل. تُحلَّل القيم تلقائياً بنوع JSON المناسب (منطقي، عدد صحيح، عائم، مصفوفة، كائن، أو نص).

```bash
sd config set <key> <value>
```

أمثلة:

```bash
# تعيين الحد الأقصى لحجم الملف إلى 200 MiB
sd config set scan.max_file_size 209715200

# تعيين خيوط الفحص إلى 8
sd config set scan.threads 8

# تمكين العزل التلقائي
sd config set quarantine.auto_quarantine true

# تعيين عتبة الاكتشاف الاستدلالي إلى 50 (أكثر حساسية)
sd config set scan.heuristic_threshold 50

# إضافة مسارات استثناء كمصفوفة JSON
sd config set scan.exclude_paths '["*.log", "/proc", "/sys"]'

# تغيير URL خادم التحديث
sd config set update_server_url "https://custom-update.example.com/v1"
```

المخرجات:

```
OK Set scan.max_file_size = 209715200 (was 104857600)
```

::: tip
تستخدم المفاتيح المتداخلة علامة النقطة كفاصل. مثلاً، `scan.max_file_size` ينتقل إلى كائن `scan` ويعين حقل `max_file_size`. يُنشأ الكائنات الوسيطة تلقائياً إذا لم تكن موجودة.
:::

### إعادة التعيين إلى الافتراضيات

استعادة جميع الإعدادات إلى الإعدادات الافتراضية:

```bash
sd config reset
```

المخرجات:

```
OK Configuration reset to defaults.
```

::: warning
لا تحذف إعادة تعيين الإعدادات قواعد بيانات التوقيعات أو قواعد YARA أو الملفات المعزولة. إنها تُعيد تعيين ملف `config.json` فقط إلى القيم الافتراضية.
:::

## فئات الإعدادات

الإعدادات مُنظَّمة في أربعة أقسام رئيسية:

| القسم | الغرض |
|---------|---------|
| `scan.*` | سلوك فحص الملفات: حدود حجم الملف والخيوط والمهل الزمنية والأرشيفات والاستدلاليات |
| `monitor.*` | المراقبة في الوقت الفعلي: وضع الحجب وسعة قناة الأحداث |
| `quarantine.*` | قبو العزل: العزل التلقائي والحد الأقصى لحجم القبو |
| `update_server_url` | نقطة نهاية خادم تحديث التوقيعات |

للحصول على مرجع كامل لكل مفتاح إعداد ونوعه وقيمته الافتراضية ووصفه، انظر [مرجع الإعدادات](./reference).

## الإعدادات الافتراضية

عند التشغيل الأول، يُولّد PRX-SD الإعدادات الافتراضية التالية:

```json
{
  "scan": {
    "max_file_size": 104857600,
    "threads": null,
    "timeout_per_file_ms": 30000,
    "scan_archives": true,
    "max_archive_depth": 3,
    "heuristic_threshold": 60,
    "exclude_paths": []
  },
  "monitor": {
    "block_mode": false,
    "channel_capacity": 4096
  },
  "update_server_url": null,
  "quarantine": {
    "auto_quarantine": false,
    "max_vault_size_mb": 1024
  }
}
```

الافتراضيات الرئيسية:

- **الحد الأقصى لحجم الملف:** 100 MiB (تُتجاوز الملفات الأكبر من هذا)
- **الخيوط:** `null` (كشف تلقائي بناءً على عدد وحدات المعالجة المركزية)
- **المهلة:** 30 ثانية لكل ملف
- **الأرشيفات:** تُفحص، حتى 3 مستويات من التداخل
- **عتبة الاستدلاليات:** 60 (نتيجة 60+ = خطير، 30-59 = مشبوه)
- **وضع الحجب:** معطّل (الشاشة تُبلّغ لكن لا تحجب الوصول للملف)
- **العزل التلقائي:** معطّل (التهديدات تُبلَّغ لكن لا تُنقل)
- **حد حجم القبو:** 1024 MiB

## تحرير ملف الإعدادات مباشرةً

يمكنك أيضاً تحرير `~/.prx-sd/config.json` بأي محرر نصوص. يقرأ PRX-SD الملف عند بدء كل أمر، لذا تسري التغييرات فوراً.

```bash
# فتح في المحرر الخاص بك
$EDITOR ~/.prx-sd/config.json
```

تأكد من صحة تنسيق JSON للملف. إذا كان مشوهاً، يعود PRX-SD إلى القيم الافتراضية ويطبع تحذيراً.

## هيكل دليل البيانات

```
~/.prx-sd/
  config.json       # إعدادات المحرك
  signatures/       # قاعدة بيانات هاش LMDB
  yara/             # ملفات قواعد YARA المُجمَّعة
  quarantine/       # قبو عزل مشفر بـ AES-256-GCM
  adblock/          # قوائم فلاتر adblock وسجلاتها
  plugins/          # أدلة إضافات WASM
  audit/            # سجلات تدقيق الفحص (JSONL)
  prx-sd.pid        # ملف PID لوحيد الخدمة (عند التشغيل)
```

## الخطوات التالية

- انظر [مرجع الإعدادات](./reference) لكل مفتاح ونوع وقيمة افتراضية
- تعلّم عن [الفحص](../scanning/file-scan) لفهم كيف تؤثر الإعدادات على الفحوصات
- إعداد [المراقبة في الوقت الفعلي](../realtime/) وتهيئة `monitor.block_mode`
- تهيئة سلوك العزل التلقائي في [العزل](../quarantine/)

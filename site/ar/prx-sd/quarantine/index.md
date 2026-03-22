---
title: إدارة العزل
description: إدارة التهديدات المعزولة باستخدام قبو مشفر بـ AES-256-GCM واستعادة الملفات ومراجعة إحصاءات العزل.
---

# إدارة العزل

عندما يكتشف PRX-SD تهديداً، يمكنه عزل الملف في قبو عزل مشفر. الملفات المعزولة مشفرة بـ AES-256-GCM ومُعاد تسميتها ومنقولة إلى دليل آمن حيث لا يمكن تنفيذها عن طريق الخطأ. يُحفَظ جميع البيانات الوصفية الأصلية للتحليل الجنائي.

## كيف يعمل العزل

```
تم اكتشاف تهديد
  1. توليد مفتاح AES-256-GCM عشوائي
  2. تشفير محتويات الملف
  3. تخزين blob مشفر في vault.bin
  4. حفظ البيانات الوصفية (المسار الأصلي، الهاش، معلومات الكشف) بتنسيق JSON
  5. حذف الملف الأصلي من القرص
  6. تسجيل حدث العزل
```

يُخزَّن قبو العزل في `~/.prx-sd/quarantine/`:

```
~/.prx-sd/quarantine/
  vault.bin                    # مخزن الملفات المشفرة (للإلحاق فقط)
  index.json                   # فهرس العزل مع البيانات الوصفية
  entries/
    a1b2c3d4.json             # البيانات الوصفية لكل إدخال
    e5f6g7h8.json
```

كل إدخال عزل يحتوي على:

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
يستخدم قبو العزل تشفيراً مصادقاً (AES-256-GCM). هذا يمنع كلاً من التنفيذ العرضي للبرامج الضارة المعزولة والتلاعب بالأدلة.
:::

## سرد الملفات المعزولة

```bash
sd quarantine list [OPTIONS]
```

| العلم | المختصر | الافتراضي | الوصف |
|------|-------|---------|-------------|
| `--json` | | `false` | المخرجات بتنسيق JSON |
| `--sort` | `-s` | `date` | الترتيب حسب: `date`، `name`، `size`، `severity` |
| `--filter` | `-f` | | الفلترة حسب الخطورة: `malicious`، `suspicious` |
| `--limit` | `-n` | الكل | الحد الأقصى للإدخالات المعروضة |

### مثال

```bash
sd quarantine list
```

```
Quarantine Vault (4 entries, 1.2 MB)

ID        Date                 Size     Severity   Detection              Original Path
a1b2c3d4  2026-03-21 10:15:32  240 KB   malicious  Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   malicious  Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    suspicious  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   malicious  SHA256_Match          /tmp/dropper.bin
```

## استعادة الملفات

استعادة ملف معزول إلى موقعه الأصلي أو مسار محدد:

```bash
sd quarantine restore <ID> [OPTIONS]
```

| العلم | المختصر | الافتراضي | الوصف |
|------|-------|---------|-------------|
| `--to` | `-t` | المسار الأصلي | الاستعادة إلى موقع مختلف |
| `--force` | `-f` | `false` | الكتابة فوق الملف إذا كان الوجهة موجودة |

::: warning
استعادة ملف معزول تضع ملفاً ضاراً أو مشبوهاً معروفاً على القرص. استعد الملفات فقط إذا تأكدت من أنها نتائج إيجابية كاذبة أو تحتاجها للتحليل في بيئة معزولة.
:::

### أمثلة

```bash
# الاستعادة إلى الموقع الأصلي
sd quarantine restore a1b2c3d4

# الاستعادة إلى دليل محدد للتحليل
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# الكتابة فوق الملف إذا كان موجوداً في الوجهة
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## حذف الملفات المعزولة

حذف الإدخالات المعزولة نهائياً:

```bash
# حذف إدخال واحد
sd quarantine delete <ID>

# حذف جميع الإدخالات
sd quarantine delete-all

# حذف الإدخالات الأقدم من 30 يوماً
sd quarantine delete --older-than 30d

# حذف جميع الإدخالات بخطورة محددة
sd quarantine delete --filter malicious
```

عند الحذف، تُكتب البيانات المشفرة فوقها بأصفار قبل إزالتها من القبو.

::: warning
الحذف دائم. بيانات الملف المشفرة والبيانات الوصفية غير قابلة للاسترداد بعد الحذف. فكّر في تصدير الإدخالات للأرشفة قبل الحذف.
:::

## إحصاءات العزل

عرض إحصاءات مجمَّعة عن قبو العزل:

```bash
sd quarantine stats
```

```
Quarantine Statistics
  Total entries:       47
  Total size:          28.4 MB (encrypted)
  Oldest entry:        2026-02-15
  Newest entry:        2026-03-21

  By severity:
    Malicious:         31 (65.9%)
    Suspicious:        16 (34.1%)

  By detection engine:
    YARA rules:        22 (46.8%)
    Hash match:        15 (31.9%)
    Heuristic:          7 (14.9%)
    Ransomware:         3 (6.4%)

  Top detections:
    Win_Trojan_Agent    8 entries
    Ransom_LockBit3     5 entries
    SHA256_Match        5 entries
    Suspicious_Script   4 entries
```

## العزل التلقائي

تمكين العزل التلقائي أثناء الفحوصات أو المراقبة:

```bash
# فحص مع عزل تلقائي
sd scan /tmp --auto-quarantine

# مراقبة مع عزل تلقائي
sd monitor --auto-quarantine /home /tmp

# وحيد خدمة مع عزل تلقائي
sd daemon start --auto-quarantine
```

أو تعيينها كسياسة افتراضية:

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## تصدير بيانات العزل

تصدير بيانات وصفية العزل للتقارير أو تكامل SIEM:

```bash
# تصدير جميع البيانات الوصفية بتنسيق JSON
sd quarantine list --json > quarantine_report.json

# تصدير الإحصاءات بتنسيق JSON
sd quarantine stats --json > quarantine_stats.json
```

## الخطوات التالية

- [الاستجابة للتهديدات](/ar/prx-sd/remediation/) -- تهيئة سياسات الاستجابة بما يتجاوز العزل
- [مراقبة الملفات](/ar/prx-sd/realtime/monitor) -- الحماية في الوقت الفعلي مع العزل التلقائي
- [تنبيهات Webhook](/ar/prx-sd/alerts/webhook) -- تلقي الإشعارات عند عزل الملفات
- [استخبارات التهديدات](/ar/prx-sd/signatures/) -- نظرة عامة على قاعدة بيانات التوقيعات

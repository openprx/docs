---
title: البداية السريعة
description: ابدأ استخدام PRX-SD لفحص البرامج الضارة في 5 دقائق. تثبيت وتحديث التوقيعات وفحص الملفات ومراجعة النتائج وتمكين المراقبة في الوقت الفعلي.
---

# البداية السريعة

يأخذك هذا الدليل من الصفر إلى فحصك الأول للبرامج الضارة في أقل من 5 دقائق. بحلول النهاية، ستكون قد ثبّتت PRX-SD وحدّثت التوقيعات وشغّلت المراقبة في الوقت الفعلي.

::: tip المتطلبات المسبقة
تحتاج إلى نظام لينكس أو ماك أو إس مع تثبيت `curl`. انظر [دليل التثبيت](./installation) للطرق الأخرى وتفاصيل المنصة.
:::

## الخطوة 1: تثبيت PRX-SD

نزّل وثبّت أحدث إصدار باستخدام سكريبت التثبيت:

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

تحقق من التثبيت:

```bash
sd --version
```

يجب أن ترى مخرجات مثل:

```
prx-sd 0.5.0
```

## الخطوة 2: تحديث قاعدة بيانات التوقيعات

يأتي PRX-SD مع قائمة حظر مدمجة، لكنك تحتاج إلى تنزيل أحدث استخبارات التهديدات للحماية الكاملة. يجلب أمر `update` توقيعات الهاش وقواعد YARA من جميع المصادر المُهيَّأة:

```bash
sd update
```

المخرجات المتوقعة:

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip التحديث الكامل
لتضمين قاعدة بيانات VirusShare الكاملة (أكثر من 20 مليون هاش MD5)، شغّل:
```bash
sd update --full
```
يستغرق هذا وقتاً أطول لكنه يوفر تغطية هاش قصوى.
:::

## الخطوة 3: فحص ملف أو دليل

فحص ملف مشبوه واحد:

```bash
sd scan /path/to/suspicious_file
```

فحص دليل كامل بشكل متكرر:

```bash
sd scan /home --recursive
```

مثال على مخرجات دليل نظيف:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

مثال على مخرجات عند اكتشاف تهديدات:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## الخطوة 4: مراجعة النتائج واتخاذ الإجراء

للحصول على تقرير JSON تفصيلي مناسب للأتمتة أو استيعاب السجلات:

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

لعزل التهديدات المكتشفة تلقائياً أثناء الفحص:

```bash
sd scan /home --recursive --auto-quarantine
```

تُنقل الملفات المعزولة إلى دليل مشفر آمن. يمكنك سردها واستعادتها:

```bash
# سرد الملفات المعزولة
sd quarantine list

# استعادة ملف بمعرف العزل الخاص به
sd quarantine restore QR-20260321-001
```

::: warning العزل
الملفات المعزولة مشفرة ولا يمكن تنفيذها عن طريق الخطأ. استخدم `sd quarantine restore` فقط إذا كنت متأكداً من أن الملف نتيجة إيجابية كاذبة.
:::

## الخطوة 5: تمكين المراقبة في الوقت الفعلي

ابدأ شاشة الوقت الفعلي لمراقبة الأدلة بحثاً عن الملفات الجديدة أو المعدلة:

```bash
sd monitor /home /tmp /var/www
```

تعمل الشاشة في المقدمة وتفحص الملفات عند إنشائها أو تغييرها:

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

لتشغيل الشاشة كخدمة في الخلفية:

```bash
# تثبيت وتشغيل خدمة systemd
sd service install
sd service start

# التحقق من حالة الخدمة
sd service status
```

## ما لديك الآن

بعد إتمام هذه الخطوات، يمتلك نظامك:

| المكوّن | الحالة |
|-----------|--------|
| الملف الثنائي `sd` | مثبّت في PATH |
| قاعدة بيانات الهاش | أكثر من 28,000 هاش SHA-256/MD5 في LMDB |
| قواعد YARA | أكثر من 38,800 قاعدة من 8 مصادر |
| شاشة الوقت الفعلي | تراقب الأدلة المحددة |

## الخطوات التالية

- [فحص الملفات والأدلة](../scanning/file-scan) -- استكشاف جميع خيارات `sd scan` بما فيها الخيوط والاستثناءات وحدود الحجم
- [فحص الذاكرة](../scanning/memory-scan) -- فحص ذاكرة العملية الجارية بحثاً عن التهديدات الموجودة في الذاكرة
- [كشف Rootkit](../scanning/rootkit) -- التحقق من rootkit على مستوى النواة ومستوى المستخدم
- [محرك الكشف](../detection/) -- فهم كيفية عمل خط الأنابيب متعدد الطبقات
- [قواعد YARA](../detection/yara-rules) -- تعلم عن مصادر القواعد والقواعد المخصصة

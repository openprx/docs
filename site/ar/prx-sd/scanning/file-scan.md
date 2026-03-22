---
title: فحص الملفات والأدلة
description: مرجع كامل لأمر sd scan. فحص الملفات والأدلة بحثاً عن البرامج الضارة باستخدام مطابقة الهاش وقواعد YARA والتحليل الاكتشافي.
---

# فحص الملفات والأدلة

أمر `sd scan` هو الطريقة الأساسية للتحقق من الملفات والأدلة بحثاً عن البرامج الضارة. يمرر كل ملف من خلال خط أنابيب الكشف متعدد الطبقات -- مطابقة الهاش وقواعد YARA والتحليل الاكتشافي -- ويبلغ عن حكم لكل ملف.

## الاستخدام الأساسي

فحص ملف واحد:

```bash
sd scan /path/to/file
```

فحص دليل (غير متكرر بشكل افتراضي):

```bash
sd scan /home/user/downloads
```

فحص دليل وجميع الأدلة الفرعية:

```bash
sd scan /home --recursive
```

## خيارات الأمر

| الخيار | المختصر | الافتراضي | الوصف |
|--------|-------|---------|-------------|
| `--recursive` | `-r` | إيقاف | التكرار في الأدلة الفرعية |
| `--json` | `-j` | إيقاف | مخرجات النتائج بتنسيق JSON |
| `--threads` | `-t` | أنوية المعالج | عدد خيوط الفحص المتوازية |
| `--auto-quarantine` | `-q` | إيقاف | عزل التهديدات المكتشفة تلقائياً |
| `--remediate` | | إيقاف | محاولة المعالجة التلقائية (حذف/عزل استناداً إلى السياسة) |
| `--exclude` | `-e` | لا شيء | نمط glob لاستبعاد الملفات أو الأدلة |
| `--report` | | لا شيء | كتابة تقرير الفحص إلى مسار ملف |
| `--max-size-mb` | | 100 | تخطي الملفات الأكبر من هذا الحجم بالميغابايت |
| `--no-yara` | | إيقاف | تخطي فحص قواعد YARA |
| `--no-heuristics` | | إيقاف | تخطي التحليل الاكتشافي |
| `--min-severity` | | `suspicious` | الحد الأدنى للخطورة للإبلاغ (`suspicious` أو `malicious`) |

## تدفق الكشف

عندما يعالج `sd scan` ملفاً، يمر عبر خط أنابيب الكشف بالترتيب:

```
ملف → كشف الرقم السحري → تحديد نوع الملف
  │
  ├─ الطبقة 1: بحث هاش SHA-256 (LMDB)
  │   تطابق → MALICIOUS (فوري، ~1μs لكل ملف)
  │
  ├─ الطبقة 2: فحص قواعد YARA-X (أكثر من 38,800 قاعدة)
  │   تطابق → MALICIOUS مع اسم القاعدة
  │
  ├─ الطبقة 3: التحليل الاكتشافي (مدرك لنوع الملف)
  │   نتيجة ≥ 60 → MALICIOUS
  │   نتيجة 30-59 → SUSPICIOUS
  │   نتيجة < 30 → CLEAN
  │
  └─ تجميع النتائج → أعلى خطورة تفوز
```

يعمل خط الأنابيب بدائرة قصر: إذا وُجد تطابق هاش، يُتجاوز تحليل YARA والاستدلاليات لذلك الملف. هذا يجعل فحص الأدلة الكبيرة سريعاً -- معظم الملفات النظيفة تُحَل في طبقة الهاش في ميكروثوانٍ.

## تنسيقات المخرجات

### قابل للقراءة البشرية (الافتراضي)

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### مخرجات JSON

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### ملف التقرير

كتابة النتائج إلى ملف للأرشفة:

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## أنماط الاستثناء

استخدم `--exclude` لتخطي الملفات أو الأدلة المطابقة لأنماط glob. يمكن تحديد أنماط متعددة:

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip الأداء
استبعاد الأدلة الكبيرة مثل `node_modules` و`.git` وصور الأجهزة الافتراضية يحسن سرعة الفحص بشكل كبير.
:::

## العزل التلقائي

يُنقل علم `--auto-quarantine` التهديدات المكتشفة إلى قبو العزل أثناء الفحص:

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

الملفات المعزولة مشفرة بـ AES-256 ومخزنة في `~/.local/share/prx-sd/quarantine/`. لا يمكن تنفيذها عن طريق الخطأ. انظر [توثيق العزل](../quarantine/) للتفاصيل.

## سيناريوهات مثال

### فحص خط CI/CD

فحص مخرجات البناء قبل النشر:

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

استخدم رمز الخروج للأتمتة: `0` = نظيف، `1` = تهديدات موجودة، `2` = خطأ في الفحص.

### فحص خادم الويب اليومي

جدولة فحص ليلي لأدلة الويب المُتاحة:

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### التحقيق الجنائي

فحص صورة قرص مثبتة للقراءة فقط:

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning الفحوصات الكبيرة
عند فحص ملايين الملفات، استخدم `--threads` للتحكم في استخدام الموارد و`--max-size-mb` لتخطي الملفات الكبيرة جداً التي قد تُبطئ الفحص.
:::

### فحص سريع للدليل الرئيسي

فحص سريع لمواقع التهديدات الشائعة:

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## ضبط الأداء

| الملفات | الوقت التقريبي | ملاحظات |
|-------|-------------------|-------|
| 1,000 | < 1 ثانية | طبقة الهاش تحل معظم الملفات |
| 10,000 | 2-5 ثوانٍ | قواعد YARA تضيف ~0.3 مللي ثانية لكل ملف |
| 100,000 | 20-60 ثانية | يعتمد على أحجام الملفات وأنواعها |
| 1,000,000+ | 5-15 دقيقة | استخدم `--threads` و`--exclude` |

عوامل تؤثر على سرعة الفحص:

- **إدخال/إخراج القرص** -- SSD أسرع 5-10x من HDD للقراءات العشوائية
- **توزيع حجم الملفات** -- الملفات الصغيرة الكثيرة أسرع من الملفات الكبيرة القليلة
- **طبقات الكشف** -- الفحوصات المستندة إلى الهاش فقط (`--no-yara --no-heuristics`) هي الأسرع
- **عدد الخيوط** -- المزيد من الخيوط تساعد على الأنظمة متعددة الأنوية مع تخزين سريع

## الخطوات التالية

- [فحص الذاكرة](./memory-scan) -- فحص ذاكرة العملية الجارية
- [كشف Rootkit](./rootkit) -- التحقق من التهديدات على مستوى النواة
- [فحص USB](./usb-scan) -- فحص الوسائط القابلة للإزالة
- [محرك الكشف](../detection/) -- كيف تعمل كل طبقة كشف

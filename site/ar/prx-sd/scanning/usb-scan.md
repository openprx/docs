---
title: فحص أجهزة USB
description: الكشف التلقائي عن أجهزة تخزين USB القابلة للإزالة المتصلة وفحصها بحثاً عن البرامج الضارة عند توصيلها باستخدام sd scan-usb.
---

# فحص أجهزة USB

يكشف أمر `sd scan-usb` عن أجهزة تخزين USB القابلة للإزالة المتصلة ويفحص محتوياتها بحثاً عن البرامج الضارة. هذا أمر بالغ الأهمية للبيئات التي تُعد فيها محركات USB ناقلاً شائعاً لتسليم البرامج الضارة، مثل الشبكات المعزولة عن الهواء ومحطات العمل المشتركة وأنظمة التحكم الصناعي.

## كيف يعمل

عند استدعائه، يُجري `sd scan-usb` الخطوات التالية:

1. **اكتشاف الجهاز** -- يُعدِّد الأجهزة الكتلية عبر `/sys/block/` ويحدد الأجهزة القابلة للإزالة (USB mass storage).
2. **كشف التثبيت** -- يتحقق مما إذا كان الجهاز مثبتاً بالفعل. إذا لم يكن، يمكنه تثبيته اختيارياً في وضع القراءة فقط في دليل مؤقت.
3. **الفحص الكامل** -- يُشغِّل خط أنابيب الكشف الكامل (مطابقة الهاش وقواعد YARA والتحليل الاكتشافي) على جميع الملفات على الجهاز.
4. **التقرير** -- يُنتج تقرير فحص مع أحكام لكل ملف.

::: tip التثبيت التلقائي
بشكل افتراضي، يفحص `sd scan-usb` الأجهزة المثبتة بالفعل. استخدم `--auto-mount` لتثبيت أجهزة USB غير المثبتة تلقائياً في وضع القراءة فقط للفحص.
:::

## الاستخدام الأساسي

فحص جميع أجهزة تخزين USB المتصلة:

```bash
sd scan-usb
```

مثال على المخرجات:

```
PRX-SD USB Scan
===============
Detected USB devices:
  /dev/sdb1 → /media/user/USB_DRIVE (vfat, 16 GB)

Scanning /media/user/USB_DRIVE...
Scanned: 847 files (2.1 GB)
Threats: 1

  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe
    Layer:   YARA rule
    Rule:    win_worm_usb_spreader
    Details: USB worm with autorun.inf exploitation

Duration: 4.2s
```

## خيارات الأمر

| الخيار | المختصر | الافتراضي | الوصف |
|--------|-------|---------|-------------|
| `--auto-quarantine` | `-q` | إيقاف | عزل التهديدات المكتشفة تلقائياً |
| `--auto-mount` | | إيقاف | تثبيت أجهزة USB غير المثبتة في وضع القراءة فقط |
| `--device` | `-d` | الكل | فحص جهاز محدد فقط (مثل `/dev/sdb1`) |
| `--json` | `-j` | إيقاف | مخرجات النتائج بتنسيق JSON |
| `--eject-after` | | إيقاف | إخراج الجهاز بأمان بعد الفحص |
| `--max-size-mb` | | 100 | تخطي الملفات الأكبر من هذا الحجم |

## العزل التلقائي

عزل التهديدات الموجودة على أجهزة USB تلقائياً:

```bash
sd scan-usb --auto-quarantine
```

```
Scanning /media/user/USB_DRIVE...
  [MALICIOUS] /media/user/USB_DRIVE/autorun.exe → Quarantined (QR-20260321-012)
  [MALICIOUS] /media/user/USB_DRIVE/.hidden/payload.bin → Quarantined (QR-20260321-013)

Threats quarantined: 2
Safe to use: Review remaining files before opening.
```

::: warning مهم
عند استخدام `--auto-quarantine` مع فحص USB، تُنقل الملفات الضارة إلى قبو العزل المحلي على الجهاز المضيف، وليس حذفها من جهاز USB. تبقى الملفات الأصلية على USB ما لم تستخدم أيضاً `--remediate`.
:::

## فحص أجهزة محددة

إذا كانت أجهزة USB متعددة متصلة، افحص جهازاً محدداً:

```bash
sd scan-usb --device /dev/sdb1
```

سرد أجهزة USB المكتشفة بدون فحص:

```bash
sd scan-usb --list
```

```
Detected USB storage devices:
  1. /dev/sdb1  Kingston DataTraveler  16 GB  vfat  Mounted: /media/user/USB_DRIVE
  2. /dev/sdc1  SanDisk Ultra          64 GB  exfat Not mounted
```

## مخرجات JSON

```bash
sd scan-usb --json
```

```json
{
  "scan_type": "usb",
  "timestamp": "2026-03-21T17:00:00Z",
  "devices": [
    {
      "device": "/dev/sdb1",
      "label": "USB_DRIVE",
      "filesystem": "vfat",
      "size_gb": 16,
      "mount_point": "/media/user/USB_DRIVE",
      "files_scanned": 847,
      "threats": [
        {
          "path": "/media/user/USB_DRIVE/autorun.exe",
          "verdict": "malicious",
          "layer": "yara",
          "rule": "win_worm_usb_spreader"
        }
      ]
    }
  ]
}
```

## تهديدات USB الشائعة

تُستخدم أجهزة USB بشكل متكرر لتسليم الأنواع التالية من البرامج الضارة:

| نوع التهديد | الوصف | طبقة الكشف |
|-------------|-------------|-----------------|
| دودة autorun | استغلال `autorun.inf` للتنفيذ على ويندوز | قواعد YARA |
| محمّلات USB | ملفات قابلة للتنفيذ مُتنكِّرة (مثل `document.pdf.exe`) | الاستدلاليات + YARA |
| حمولات BadUSB | نصوص برمجية تستهدف هجمات محاكاة HID | تحليل الملفات |
| ناقلات برامج الفدية | حمولات مشفرة تُنشَّط عند النسخ | الهاش + YARA |
| أدوات استخراج البيانات | أدوات مصممة لجمع البيانات واستخراجها | التحليل الاكتشافي |

## التكامل مع المراقبة في الوقت الفعلي

يمكنك دمج فحص USB مع وحيد خدمة `sd monitor` لفحص أجهزة USB تلقائياً عند توصيلها:

```bash
sd monitor --watch-usb /home /tmp
```

يبدأ هذا شاشة الملفات في الوقت الفعلي ويضيف قدرة الفحص التلقائي لـ USB. عند اكتشاف جهاز USB جديد عبر udev، يُفحص تلقائياً.

::: tip وضع الكشك
للمحطات العامة أو محطات العمل المشتركة، ادمج `--watch-usb` مع `--auto-quarantine` لتحييد التهديدات من أجهزة USB تلقائياً بدون تدخل المستخدم.
:::

## الخطوات التالية

- [فحص الملفات والأدلة](./file-scan) -- مرجع كامل لـ `sd scan`
- [فحص الذاكرة](./memory-scan) -- فحص ذاكرة العملية الجارية
- [كشف Rootkit](./rootkit) -- التحقق من التهديدات على مستوى النظام
- [محرك الكشف](../detection/) -- كيف يعمل خط الأنابيب متعدد الطبقات

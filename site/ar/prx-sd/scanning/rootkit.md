---
title: كشف Rootkit
description: كشف rootkit على مستوى النواة ومستوى المستخدم على لينكس باستخدام sd check-rootkit. يفحص العمليات المخفية ووحدات النواة وخطافات جدول استدعاءات النظام وغيرها.
---

# كشف Rootkit

يُجري أمر `sd check-rootkit` فحوصات عميقة لسلامة النظام للكشف عن rootkit على مستوى النواة ومستوى المستخدم. Rootkit من أخطر أنواع البرامج الضارة لأنها تُخفي وجودها عن أدوات النظام القياسية، مما يجعلها غير مرئية للماسحات التقليدية للملفات.

::: warning المتطلبات
- **صلاحيات الجذر مطلوبة** -- يقرأ كشف Rootkit هياكل بيانات النواة وداخليات النظام.
- **لينكس فقط** -- تعتمد هذه الميزة على `/proc` و`/sys` وواجهات النواة الخاصة بلينكس.
:::

## ما يكشفه

يتحقق PRX-SD من وجود rootkit عبر ناقلات متعددة:

### فحوصات مستوى النواة

| الفحصة | الوصف |
|-------|-------------|
| وحدات النواة المخفية | مقارنة الوحدات المحملة من `/proc/modules` مقابل إدخالات `sysfs` للعثور على التناقضات |
| خطافات جدول استدعاءات النظام | التحقق من إدخالات جدول syscall مقابل رموز النواة المعروفة الجيدة |
| تناقضات `/proc` | كشف العمليات المخفية من `/proc` لكن المرئية عبر واجهات أخرى |
| التلاعب برموز النواة | التحقق من مؤشرات الدوال المعدلة في هياكل النواة الرئيسية |
| جدول واصف المقاطعات | التحقق من إدخالات IDT للتعديلات غير المتوقعة |

### فحوصات مستوى المستخدم

| الفحصة | الوصف |
|-------|-------------|
| العمليات المخفية | المقارنة المتبادلة لنتائج `readdir(/proc)` مع تعداد PID بالقوة الغاشمة |
| حقن LD_PRELOAD | التحقق من المكتبات المشتركة الضارة المحملة عبر `LD_PRELOAD` أو `/etc/ld.so.preload` |
| استبدال الثنائيات | التحقق من سلامة الثنائيات الحيوية للنظام (`ls`، `ps`، `netstat`، `ss`، `lsof`) |
| الملفات المخفية | كشف الملفات المخفية باعتراض syscall `getdents` |
| إدخالات cron المشبوهة | فحص crontabs بحثاً عن الأوامر المُشوَّشة أو المُرمَّزة |
| التلاعب بخدمة systemd | التحقق من وحدات systemd غير المصرح بها أو المعدلة |
| الأبواب الخلفية SSH | البحث عن مفاتيح SSH غير مصرح بها وتعديلات `sshd_config` وثنائيات `sshd` مُغيَّرة |
| مستمعو الشبكة | تحديد مقابس الشبكة المخفية غير المُظهَرة بـ `ss`/`netstat` |

## الاستخدام الأساسي

تشغيل فحص rootkit كامل:

```bash
sudo sd check-rootkit
```

مثال على المخرجات:

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## خيارات الأمر

| الخيار | المختصر | الافتراضي | الوصف |
|--------|-------|---------|-------------|
| `--json` | `-j` | إيقاف | مخرجات النتائج بتنسيق JSON |
| `--kernel-only` | | إيقاف | تشغيل فحوصات مستوى النواة فقط |
| `--userspace-only` | | إيقاف | تشغيل فحوصات مستوى المستخدم فقط |
| `--baseline` | | لا شيء | مسار ملف الخط الأساسي للمقارنة |
| `--save-baseline` | | لا شيء | حفظ الحالة الحالية كخط أساسي |

## مقارنة الخط الأساسي

للمراقبة المستمرة، أنشئ خطاً أساسياً لحالة النظام المعروفة الجيدة وقارن معه في الفحوصات المستقبلية:

```bash
# إنشاء خط أساسي على نظام معروف بأنه نظيف
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# الفحوصات المستقبلية تقارن مع الخط الأساسي
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

يُسجّل الخط الأساسي قوائم وحدات النواة وهاشات جدول syscall وملخصات الثنائيات الحيوية وحالات مستمعي الشبكة. أي انحراف يُثير تنبيهاً.

## مخرجات JSON

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## مثال: كشف Rootkit وحدة النواة

عندما يُخفي rootkit وحدة نواة، يكشف `sd check-rootkit` التناقض:

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning النتائج الحرجة
يجب التعامل مع نتيجة `CRITICAL` من فاحص rootkit بوصفها حادثة أمنية خطيرة. لا تحاول المعالجة على نظام يحتمل اختراقه. بدلاً من ذلك، عزل الجهاز والتحقق من الوسائط الموثوقة.
:::

## جدولة الفحوصات المنتظمة

أضف فحوصات rootkit إلى روتين مراقبتك:

```bash
# Cron: فحص كل 4 ساعات
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## الخطوات التالية

- [فحص الذاكرة](./memory-scan) -- كشف التهديدات الموجودة في ذاكرة العمليات الجارية
- [فحص الملفات والأدلة](./file-scan) -- الفحص التقليدي المستند إلى الملفات
- [فحص USB](./usb-scan) -- فحص الوسائط القابلة للإزالة عند الاتصال
- [محرك الكشف](../detection/) -- نظرة عامة على جميع طبقات الكشف

---
title: Sandbox
description: واجهات sandbox الخلفية لعزل تنفيذ الأدوات في PRX.
---

# Sandbox

يوفّر sandbox في PRX عزلًا للعمليات ونظام الملفات عند تنفيذ الأدوات. عندما يستدعي الوكيل أداة تشغّل أوامر خارجية، يضمن sandbox تشغيل الأمر داخل بيئة مقيّدة.

## واجهات Sandbox الخلفية

يدعم PRX عدة واجهات sandbox خلفية:

| الواجهة | المنصة | مستوى العزل | الحمل |
|---------|--------|-------------|-------|
| **Docker** | Linux, macOS | حاوية كاملة | عالٍ |
| **Bubblewrap** | Linux | Namespace + seccomp | منخفض |
| **Firejail** | Linux | Namespace + seccomp | منخفض |
| **Landlock** | Linux (5.13+) | Kernel LSM | أدنى |
| **None** | All | بدون عزل | لا شيء |

## الإعداد

```toml
[security.sandbox]
backend = "bubblewrap"

[security.sandbox.docker]
image = "prx-sandbox:latest"
network = "none"
memory_limit = "256m"
cpu_limit = "1.0"

[security.sandbox.bubblewrap]
allow_network = false
writable_paths = ["/tmp"]
readonly_paths = ["/usr", "/lib"]
```

## آلية العمل

1. يطلب الوكيل استدعاء أداة (مثل تنفيذ أمر shell)
2. يتحقق محرك السياسات مما إذا كان الاستدعاء مسموحًا
3. يغلّف sandbox التنفيذ باستخدام الواجهة الخلفية المضبوطة
4. تعمل الأداة مع وصول مقيّد إلى نظام الملفات والشبكة
5. تُلتقط النتائج وتُعاد إلى الوكيل

## صفحات ذات صلة

- [نظرة عامة على الأمان](./)
- [محرك السياسات](./policy-engine)
- [عامل الجلسة](/ar/prx/agent/session-worker)

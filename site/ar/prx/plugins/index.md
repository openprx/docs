---
title: نظام الإضافات
description: نظرة عامة على نظام إضافات PRX المبني على WASM لتوسيع قدرات الوكلاء.
---

# نظام الإضافات

يدعم PRX نظام إضافات WebAssembly (WASM) يتيح توسيع قدرات الوكلاء دون تعديل قاعدة الشيفرة الأساسية. تعمل الإضافات داخل بيئة WASM معزولة وبوصول مضبوط إلى وظائف المضيف.

## نظرة عامة

يوفّر نظام الإضافات:

- **تنفيذ داخل Sandbox** -- تعمل الإضافات في WASM مع عزل للذاكرة
- **واجهة Host function API** -- وصول مضبوط إلى HTTP ونظام الملفات وحالة الوكيل
- **إعادة تحميل فورية** -- تحميل الإضافات وإلغاء تحميلها دون إعادة تشغيل الـ daemon
- **دعم لغات متعددة** -- كتابة الإضافات بـ Rust أو Go أو C أو أي لغة تُترجم إلى WASM

## أنواع الإضافات

| Type | Description | Example |
|------|-------------|---------|
| **Tool plugins** | إضافة أدوات جديدة للوكيل | تكاملات API مخصصة |
| **Channel plugins** | إضافة قنوات مراسلة جديدة | منصة محادثة مخصصة |
| **Filter plugins** | معالجة الرسائل قبل/بعد التنفيذ | ضبط المحتوى |
| **Provider plugins** | إضافة مزودات LLM جديدة | نقاط نهاية نماذج مخصصة |

## البدء السريع

```bash
# Install a plugin from a URL
prx plugin install https://example.com/my-plugin.wasm

# List installed plugins
prx plugin list

# Enable/disable a plugin
prx plugin enable my-plugin
prx plugin disable my-plugin
```

## الإعداد

```toml
[plugins]
enabled = true
directory = "~/.local/share/openprx/plugins"
max_memory_mb = 64
max_execution_time_ms = 5000

[[plugins.registry]]
name = "my-plugin"
path = "~/.local/share/openprx/plugins/my-plugin.wasm"
enabled = true
```

## صفحات ذات صلة

- [البنية](./architecture)
- [دليل المطور](./developer-guide)
- [وظائف المضيف](./host-functions)
- [PDK (Plugin Development Kit)](./pdk)
- [أمثلة](./examples)

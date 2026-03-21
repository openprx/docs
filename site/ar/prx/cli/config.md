---
title: prx config
description: فحص وتعديل إعدادات PRX من سطر الأوامر.
---

# prx config

قراءة وكتابة والتحقق من صحة وتحويل ملف إعدادات PRX دون تحرير TOML يدويًا.

## الاستخدام

```bash
prx config <SUBCOMMAND> [OPTIONS]
```

## الأوامر الفرعية

### `prx config get`

قراءة قيمة إعداد بمسار مفتاح منقّط.

```bash
prx config get <KEY> [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--config` | `-c` | `~/.config/prx/config.toml` | مسار ملف الإعدادات |
| `--json` | `-j` | `false` | إخراج القيمة بتنسيق JSON |

```bash
# الحصول على المزود الافتراضي
prx config get providers.default

# الحصول على منفذ البوابة
prx config get gateway.port

# الحصول على قسم كامل بتنسيق JSON
prx config get providers --json
```

### `prx config set`

تعيين قيمة إعداد.

```bash
prx config set <KEY> <VALUE> [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--config` | `-c` | `~/.config/prx/config.toml` | مسار ملف الإعدادات |

```bash
# تغيير المزود الافتراضي
prx config set providers.default "anthropic"

# تغيير منفذ البوابة
prx config set gateway.port 8080

# تعيين قيمة منطقية
prx config set evolution.l1.enabled true

# تعيين قيمة متداخلة
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

طباعة مخطط JSON الكامل للإعدادات. مفيد للإكمال التلقائي في المحرر والتحقق من الصحة.

```bash
prx config schema [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--output` | `-o` | stdout | كتابة المخطط في ملف |
| `--format` | | `json` | تنسيق المخرج: `json` أو `yaml` |

```bash
# طباعة المخطط في المخرج القياسي
prx config schema

# حفظ المخطط لتكامل المحرر
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

تقسيم ملف إعدادات موحد إلى ملفات منفصلة لكل قسم. ينشئ مجلد إعدادات بملفات منفصلة للمزودين والقنوات والمهام الدورية وغيرها.

```bash
prx config split [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--config` | `-c` | `~/.config/prx/config.toml` | ملف الإعدادات المصدر |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | مجلد المخرج |

```bash
prx config split

# النتيجة:
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

دمج مجلد إعدادات مقسّم في ملف واحد.

```bash
prx config merge [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | المجلد المصدر |
| `--output` | `-o` | `~/.config/prx/config.toml` | ملف المخرج |
| `--force` | `-f` | `false` | الكتابة فوق ملف المخرج الحالي |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## أمثلة

```bash
# فحص سريع للإعدادات
prx config get .  # طباعة الإعدادات بالكامل

# تحديث مفتاح المزود
prx config set providers.anthropic.api_key "sk-ant-..."

# توليد المخطط لـ VS Code
prx config schema --output ~/.config/prx/schema.json
# ثم في settings.json الخاص بـ VS Code:
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# نسخ احتياطي وتقسيم للتحكم بالإصدارات
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## ذو صلة

- [نظرة عامة على الإعدادات](/ar/prx/config/) -- تنسيق وهيكل ملف الإعدادات
- [المرجع الكامل](/ar/prx/config/reference) -- جميع خيارات الإعدادات
- [إعادة التحميل الفوري](/ar/prx/config/hot-reload) -- إعادة تحميل الإعدادات أثناء التشغيل
- [متغيرات البيئة](/ar/prx/config/environment) -- تجاوزات متغيرات البيئة

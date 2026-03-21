---
title: prx skills
description: إدارة المهارات القابلة للتثبيت التي توسّع قدرات وكيل PRX.
---

# prx skills

إدارة المهارات -- حزم قدرات معيارية توسّع ما يمكن لوكيل PRX فعله. تجمع المهارات المطالبات وإعدادات الأدوات وإضافات WASM في وحدات قابلة للتثبيت.

## الاستخدام

```bash
prx skills <SUBCOMMAND> [OPTIONS]
```

## الأوامر الفرعية

### `prx skills list`

عرض المهارات المثبتة والمهارات المتاحة من السجل.

```bash
prx skills list [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--installed` | | `false` | عرض المهارات المثبتة فقط |
| `--available` | | `false` | عرض المهارات المتاحة (غير المثبتة) فقط |
| `--json` | `-j` | `false` | المخرج بتنسيق JSON |

**مثال على المخرج:**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

تثبيت مهارة من السجل أو من مسار محلي.

```bash
prx skills install <NAME|PATH> [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--version` | `-v` | الأحدث | إصدار محدد للتثبيت |
| `--force` | `-f` | `false` | إعادة التثبيت حتى لو كانت مثبتة بالفعل |

```bash
# التثبيت من السجل
prx skills install code-review

# تثبيت إصدار محدد
prx skills install web-research --version 1.0.2

# التثبيت من مسار محلي
prx skills install ./my-custom-skill/

# فرض إعادة التثبيت
prx skills install code-review --force
```

### `prx skills remove`

إلغاء تثبيت مهارة.

```bash
prx skills remove <NAME> [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--force` | `-f` | `false` | تجاوز طلب التأكيد |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## هيكل المهارة

تحتوي حزمة المهارة على:

```
my-skill/
  skill.toml          # بيانات وصفية وإعدادات المهارة
  system_prompt.md    # تعليمات مطالبة النظام الإضافية
  tools.toml          # تعريفات الأدوات والصلاحيات
  plugin.wasm         # ملف إضافة WASM ثنائي اختياري
```

ملف بيان `skill.toml`:

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## مجلد المهارات

تُخزّن المهارات المثبتة في:

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## ذو صلة

- [نظرة عامة على الإضافات](/ar/prx/plugins/) -- نظام إضافات WASM
- [نظرة عامة على الأدوات](/ar/prx/tools/) -- الأدوات المدمجة
- [دليل المطور](/ar/prx/plugins/developer-guide) -- بناء إضافات مخصصة

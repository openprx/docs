---
title: واجهة ذاكرة Markdown
description: تخزين ذاكرة قائم على الملفات باستخدام ملفات Markdown، مثالي للتحكم بالإصدارات وإعدادات المستخدم الواحد.
---

# واجهة ذاكرة Markdown

تخزن واجهة Markdown الذكريات كملفات Markdown منظَّمة على القرص. هذه أبسط واجهة وتعمل جيدًا لإعدادات CLI لمستخدم واحد عندما تريد أن تكون الذكريات مقروءة للبشر وقابلة للتحكم بالإصدارات.

## نظرة عامة

تُنظَّم الذكريات كملفات Markdown داخل مجلد قابل للتهيئة. كل إدخال ذاكرة هو قسم داخل ملف، مجمّع حسب الموضوع أو التاريخ. صُمم التنسيق ليكون قابلًا للقراءة البشرية وقابلًا للتحليل آليًا.

## بنية الملفات

```
~/.local/share/openprx/memory/
  ├── facts.md          # Extracted key facts
  ├── preferences.md    # User preferences
  ├── projects/
  │   ├── project-a.md  # Project-specific memories
  │   └── project-b.md
  └── archive/
      └── 2026-02.md    # Archived older memories
```

## الإعدادات

```toml
[memory]
backend = "markdown"

[memory.markdown]
directory = "~/.local/share/openprx/memory"
max_file_size_kb = 512
auto_archive_days = 30
```

## البحث

تستخدم واجهة Markdown بحث full-text grep بسيطًا للاسترجاع. ورغم أنه ليس متقدمًا مثل البحث الدلالي، فهو سريع ولا يتطلب تبعيات إضافية.

## القيود

- لا يوجد بحث تشابه دلالي
- فحص خطي عند الاسترجاع (أبطأ مع مخازن ذاكرة كبيرة)
- الكتابة المتزامنة غير آمنة دون قفل الملفات

## صفحات ذات صلة

- [نظرة عامة على نظام الذاكرة](./)
- [واجهة SQLite](./sqlite) -- لتخزين أكثر تنظيمًا
- [نظافة الذاكرة](./hygiene)

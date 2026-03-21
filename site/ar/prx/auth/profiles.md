---
title: ملفات تعريف المزوّد
description: ملفات تعريف مصادقة مسماة لإدارة حسابات مزوّد متعددة في PRX.
---

# ملفات تعريف المزوّد

تسمح لك ملفات تعريف المزوّد بإعداد سياقات مصادقة متعددة للمزوّد نفسه. يفيد هذا عندما تكون لديك حسابات منفصلة للاستخدام الشخصي والعمل، أو عند التبديل بين مفاتيح API الخاصة بالتطوير والإنتاج.

## نظرة عامة

ملف التعريف هو إعداد مسمّى يتضمن:

- معرّف المزوّد
- بيانات اعتماد المصادقة (API key أو OAuth2 tokens)
- تفضيلات النموذج
- تجاوزات حدود المعدّل

## الإعدادات

```toml
[[auth.profiles]]
name = "personal"
provider = "anthropic"
api_key = "sk-ant-personal-..."
default_model = "claude-haiku"

[[auth.profiles]]
name = "work"
provider = "anthropic"
api_key = "sk-ant-work-..."
default_model = "claude-sonnet-4-6"
```

## التبديل بين الملفات

```bash
# Use a specific profile
prx chat --profile work

# Set default profile
prx auth set-default work

# List profiles
prx auth profiles
```

## متغيرات البيئة

يمكن لملفات التعريف الإشارة إلى متغيرات البيئة للاعتمادات:

```toml
[[auth.profiles]]
name = "ci"
provider = "anthropic"
api_key = "${ANTHROPIC_API_KEY}"
```

## صفحات ذات صلة

- [نظرة عامة على المصادقة](./)
- [تدفقات OAuth2](./oauth2)
- [إدارة الأسرار](/ar/prx/security/secrets)

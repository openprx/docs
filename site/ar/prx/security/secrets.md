---
title: إدارة الأسرار
description: تخزين آمن والتحكم بالوصول إلى مفاتيح API وبيانات الاعتماد في PRX.
---

# إدارة الأسرار

يوفّر PRX تخزينًا آمنًا للبيانات الحساسة مثل مفاتيح API والرموز المميزة وبيانات الاعتماد. تُشفّر الأسرار أثناء السكون ويتم الوصول إليها عبر API مضبوط.

## نظرة عامة

نظام الأسرار:

- يشفّر الأسرار أثناء السكون باستخدام AES-256-GCM
- يشتق مفاتيح التشفير من كلمة مرور رئيسية أو keyring النظام
- يوفّر حقن متغيرات البيئة أثناء تنفيذ الأدوات
- يدعم تدوير الأسرار وانتهاء صلاحيتها

## التخزين

تُخزَّن الأسرار في ملف مشفر عند `~/.local/share/openprx/secrets.enc`. يُشتق مفتاح التشفير من:

1. keyring النظام (مفضل عند توفره)
2. كلمة المرور الرئيسية (مطالبة تفاعلية)
3. متغير البيئة `PRX_MASTER_KEY` (للأتمتة)

## الإعداد

```toml
[security.secrets]
store_path = "~/.local/share/openprx/secrets.enc"
key_derivation = "argon2id"
auto_rotate_days = 90
```

## أوامر CLI

```bash
prx secret set OPENAI_API_KEY      # Set a secret (prompts for value)
prx secret get OPENAI_API_KEY      # Retrieve a secret
prx secret list                    # List secret names (not values)
prx secret delete OPENAI_API_KEY   # Delete a secret
prx secret rotate                  # Rotate the master key
```

## صفحات ذات صلة

- [نظرة عامة على الأمان](./)
- [Auth](/ar/prx/auth/)

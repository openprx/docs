---
title: prx auth
description: إدارة ملفات مصادقة OAuth لمزودي النماذج اللغوية والخدمات.
---

# prx auth

إدارة ملفات مصادقة OAuth. يستخدم PRX تدفقات OAuth2 للمزودين والخدمات التي تدعمها (GitHub Copilot، Google Gemini، إلخ.). تخزّن ملفات المصادقة الرموز بأمان في مخزن أسرار PRX.

## الاستخدام

```bash
prx auth <SUBCOMMAND> [OPTIONS]
```

## الأوامر الفرعية

### `prx auth login`

المصادقة مع مزود أو خدمة.

```bash
prx auth login [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--provider` | `-P` | | المزود للمصادقة معه (مثل `github-copilot`، `google-gemini`) |
| `--profile` | | `default` | ملف تعريف مسمّى لحسابات متعددة |
| `--browser` | | `true` | فتح المتصفح لتدفق OAuth |
| `--device-code` | | `false` | استخدام تدفق رمز الجهاز (للبيئات بدون واجهة رسومية) |

```bash
# تسجيل الدخول إلى GitHub Copilot
prx auth login --provider github-copilot

# تدفق رمز الجهاز (بدون متصفح)
prx auth login --provider github-copilot --device-code

# تسجيل الدخول بملف تعريف مسمّى
prx auth login --provider google-gemini --profile work
```

تدفق تسجيل الدخول:

1. يفتح PRX متصفحًا (أو يعرض رمز جهاز) لصفحة موافقة OAuth الخاصة بالمزود
2. تقوم بتفويض PRX في المتصفح
3. يستقبل PRX رموز الوصول والتحديث ويخزّنها بأمان
4. يُستخدم الرمز تلقائيًا في استدعاءات API اللاحقة

### `prx auth refresh`

تحديث رمز وصول منتهي الصلاحية يدويًا.

```bash
prx auth refresh [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--provider` | `-P` | الكل | المزود المراد تحديثه (يحدّث الكل إذا لم يُحدد) |
| `--profile` | | `default` | ملف التعريف المسمّى للتحديث |

```bash
# تحديث رموز جميع المزودين
prx auth refresh

# تحديث مزود محدد
prx auth refresh --provider github-copilot
```

::: tip
يحدث تحديث الرمز تلقائيًا أثناء التشغيل العادي. استخدم هذا الأمر فقط عند استكشاف مشاكل المصادقة.
:::

### `prx auth logout`

إزالة بيانات الاعتماد المخزّنة لمزود.

```bash
prx auth logout [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--provider` | `-P` | | المزود لتسجيل الخروج منه (مطلوب) |
| `--profile` | | `default` | ملف التعريف المسمّى لتسجيل الخروج |
| `--all` | | `false` | تسجيل الخروج من جميع المزودين والملفات |

```bash
# تسجيل الخروج من GitHub Copilot
prx auth logout --provider github-copilot

# تسجيل الخروج من كل شيء
prx auth logout --all
```

## ملفات تعريف المصادقة

تسمح ملفات التعريف بحسابات متعددة لنفس المزود. هذا مفيد عندما يكون لديك حسابات عمل وشخصية منفصلة.

```bash
# تسجيل الدخول بحسابين مختلفين لـ Google
prx auth login --provider google-gemini --profile personal
prx auth login --provider google-gemini --profile work

# استخدام ملف تعريف محدد في المحادثة
prx chat --provider google-gemini  # يستخدم ملف التعريف "default"
```

عيّن ملف التعريف النشط لكل مزود في ملف الإعدادات:

```toml
[providers.google-gemini]
auth_profile = "work"
```

## تخزين الرموز

تُشفَّر الرموز باستخدام خوارزمية ChaCha20-Poly1305 وتُخزّن في مخزن أسرار PRX في `~/.local/share/prx/secrets/`. يُشتق مفتاح التشفير من هوية الجهاز.

## ذو صلة

- [نظرة عامة على المصادقة](/ar/prx/auth/) -- بنية المصادقة
- [تدفق OAuth2](/ar/prx/auth/oauth2) -- توثيق تدفق OAuth2 التفصيلي
- [ملفات تعريف المصادقة](/ar/prx/auth/profiles) -- إدارة ملفات التعريف
- [مخزن الأسرار](/ar/prx/security/secrets) -- كيفية تخزين الرموز بأمان

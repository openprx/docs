---
title: Google Gemini
description: تهيئة Google Gemini كمزوّد LLM في PRX
---

# Google Gemini

> الوصول إلى نماذج Gemini عبر Google Generative Language API مع دعم مفاتيح API، ورموز Gemini CLI OAuth، ونوافذ سياق طويلة تصل إلى 2M رمز.

## المتطلبات المسبقة

- مفتاح Google AI Studio API من [aistudio.google.com](https://aistudio.google.com/app/apikey)، **أو**
- تثبيت Gemini CLI مع إتمام المصادقة (`gemini` command)، **أو**
- متغير بيئة `GEMINI_API_KEY` أو `GOOGLE_API_KEY`

## إعداد سريع

### 1. الحصول على مفتاح API

**الخيار A: مفتاح API (موصى به لمعظم المستخدمين)**

1. زر [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. انقر **Create API key**
3. انسخ المفتاح

**الخيار B: Gemini CLI (إعداد صفري للمستخدمين الحاليين)**

إذا كنت تستخدم Gemini CLI بالفعل، يكتشف PRX رمز OAuth تلقائيًا من `~/.gemini/oauth_creds.json`. لا حاجة إلى أي إعداد إضافي.

### 2. الإعداد

```toml
[default]
provider = "gemini"
model = "gemini-2.5-flash"

[providers.gemini]
api_key = "${GEMINI_API_KEY}"
```

أو اضبط متغير البيئة:

```bash
export GEMINI_API_KEY="AIza..."
```

### 3. التحقق

```bash
prx doctor models
```

## النماذج المتاحة

| النموذج | السياق | الرؤية | استخدام الأدوات | ملاحظات |
|-------|---------|--------|----------|-------|
| `gemini-2.5-pro` | 1M | نعم | نعم | أقوى نموذج Gemini |
| `gemini-2.5-flash` | 1M | نعم | نعم | سريع وفعّال من ناحية التكلفة |
| `gemini-2.0-flash` | 1M | نعم | نعم | جيل فلاش السابق |
| `gemini-1.5-pro` | 2M | نعم | نعم | أطول نافذة سياق |
| `gemini-1.5-flash` | 1M | نعم | نعم | الجيل السابق |

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `api_key` | string | اختياري | مفتاح Google AI API ‏(`AIza...`) |
| `model` | string | `gemini-2.5-flash` | النموذج الافتراضي للاستخدام |

## الميزات

### طرق مصادقة متعددة

يحل PRX بيانات اعتماد Gemini وفق أولوية الترتيب التالية:

| الأولوية | المصدر | آلية العمل |
|----------|--------|--------------|
| 1 | مفتاح API صريح في الإعداد | يُرسل كمعامل استعلام `?key=` إلى API العامة |
| 2 | متغير البيئة `GEMINI_API_KEY` | كما سبق |
| 3 | متغير البيئة `GOOGLE_API_KEY` | كما سبق |
| 4 | رمز Gemini CLI OAuth | يُرسل كـ `Authorization: Bearer` إلى Code Assist API الداخلي |

### تكامل Gemini CLI OAuth

إذا أجريت المصادقة عبر Gemini CLI (`gemini` command)، يقوم PRX تلقائيًا بما يلي:

1. يقرأ `~/.gemini/oauth_creds.json`
2. يتحقق من انتهاء صلاحية الرمز (ويتخطى الرموز المنتهية مع تحذير)
3. يوجّه الطلبات إلى Code Assist API الداخلي من Google (`cloudcode-pa.googleapis.com`) باستخدام صيغة الغلاف الصحيحة

هذا يعني أن مستخدمي Gemini CLI الحاليين يمكنهم استخدام PRX دون إعداد إضافي.

### نوافذ سياق طويلة

تدعم نماذج Gemini نوافذ سياق طويلة جدًا (حتى 2M رمز في Gemini 1.5 Pro). يضبط PRX قيمة `maxOutputTokens` إلى 8192 افتراضيًا. ويُرسل كامل سجل المحادثة كـ `contents` مع تعيين صحيح للأدوار (`user`/`model`).

### تعليمات النظام

تُرسل مطالبات النظام باستخدام الحقل الأصلي `systemInstruction` في Gemini (وليس كرسالة عادية)، لضمان التعامل معها بالشكل الصحيح من النموذج.

### تنسيق تلقائي لاسم النموذج

يقوم PRX تلقائيًا بإضافة `models/` إلى أسماء النماذج عند الحاجة. يعمل كل من `gemini-2.5-flash` و`models/gemini-2.5-flash` بشكل صحيح.

## الأسماء المستعارة للمزوّد

كل الأسماء التالية تُحل إلى مزود Gemini:

- `gemini`
- `google`
- `google-gemini`

## استكشاف الأخطاء وإصلاحها

### "Gemini API key not found"

تعذر على PRX العثور على مصادقة. الخيارات:

1. اضبط متغير البيئة `GEMINI_API_KEY`
2. شغّل Gemini CLI (`gemini`) لإتمام المصادقة (سيتم إعادة استخدام الرموز تلقائيًا)
3. احصل على مفتاح API من [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
4. شغّل `prx onboard` للإعداد التفاعلي

### "400 Bad Request: API key not valid" مع Gemini CLI

يحدث هذا عندما تُرسل رموز OAuth من Gemini CLI إلى نقطة نهاية API العامة. يتعامل PRX مع هذا بتوجيه رموز OAuth تلقائيًا إلى نقطة النهاية الداخلية `cloudcode-pa.googleapis.com`. إذا ظهر هذا الخطأ، تأكد أنك تستخدم أحدث إصدار من PRX.

### "Gemini CLI OAuth token expired"

أعد تشغيل Gemini CLI (`gemini`) لتحديث الرمز. لا يقوم PRX بتحديث رموز Gemini CLI تلقائيًا (على عكس رموز Anthropic OAuth).

### 403 Forbidden

قد لا يكون مفتاح API لديك مفعّلًا لـ Generative Language API. انتقل إلى [Google Cloud Console](https://console.cloud.google.com/) وفعّل **Generative Language API** لمشروعك.

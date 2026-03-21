---
title: OpenAI Codex
description: تهيئة OpenAI Codex (تدفق OAuth2 الخاص بـ GitHub Copilot) كمزوّد LLM في PRX
---

# OpenAI Codex

> الوصول إلى نماذج Codex من OpenAI عبر ChatGPT Responses API باستخدام تدفق مصادقة OAuth2 الخاص بـ GitHub Copilot. يوفّر الوصول إلى نماذج GPT-5.x Codex مع قدرات الاستدلال واستدعاء الأدوات الأصلي.

## المتطلبات المسبقة

- اشتراك ChatGPT Plus أو Team أو Enterprise
- رمز OAuth2 موجود من Codex CLI أو GitHub Copilot، **أو** الاستعداد لتشغيل تدفق `prx auth login`

## إعداد سريع

### 1. المصادقة

```bash
prx auth login --provider openai-codex
```

يبدأ هذا تدفق جهاز GitHub OAuth ويخزن الرموز في `~/.openprx/`.

### 2. الإعداد

```toml
[default]
provider = "openai-codex"
model = "gpt-5.3-codex"
```

### 3. التحقق

```bash
prx doctor models
```

## النماذج المتاحة

| النموذج | السياق | الرؤية | استخدام الأدوات | ملاحظات |
|-------|---------|--------|----------|-------|
| `gpt-5.3-codex` | 128K | نعم | نعم | أحدث نموذج Codex، أعلى قدرة |
| `gpt-5.2-codex` | 128K | نعم | نعم | جيل Codex السابق |
| `gpt-5.1-codex` | 128K | نعم | نعم | إصدار Codex مستقر |
| `gpt-5.1-codex-mini` | 128K | نعم | نعم | نسخة Codex أصغر وأسرع |
| `gpt-5-codex` | 128K | نعم | نعم | أول جيل Codex 5 |
| `o3` | 128K | نعم | نعم | نموذج OpenAI للاستدلال |
| `o4-mini` | 128K | نعم | نعم | نموذج استدلال أصغر |

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `model` | string | `gpt-5.3-codex` | نموذج Codex الافتراضي للاستخدام |

لا حاجة إلى مفتاح API في الإعداد. تتم المصادقة عبر تدفق OAuth المخزّن في `~/.openprx/`.

## الميزات

### Responses API

بخلاف مزوّد OpenAI القياسي الذي يستخدم Chat Completions API، يستخدم مزوّد Codex واجهة Responses API الأحدث (`/codex/responses`) مع:

- بث SSE بأحداث نص delta آنية
- عناصر خرج `function_call` مهيكلة لاستخدام الأدوات
- التحكم في جهد الاستدلال (`minimal` / `low` / `medium` / `high` / `xhigh`)
- ملخصات الاستدلال في بيانات الاستجابة الوصفية

### ضبط تلقائي لجهد الاستدلال

يضبط PRX جهد الاستدلال تلقائيًا حسب النموذج:

| Model | `minimal` | `xhigh` |
|-------|-----------|---------|
| `gpt-5.2-codex` / `gpt-5.3-codex` | Clamped to `low` | Allowed |
| `gpt-5.1` | Allowed | Clamped to `high` |
| `gpt-5.1-codex-mini` | Clamped to `medium` | Clamped to `high` |

يمكنك التجاوز عبر متغير البيئة `ZEROCLAW_CODEX_REASONING_EFFORT`.

### الاستدعاء الأصلي للأدوات

تُرسل تعريفات الأدوات بصيغة Responses API مع `type: "function"` و`name` و`description` و`parameters`. أسماء الأدوات التي تحتوي على نقاط (مثل `email.execute`) تُحوَّل تلقائيًا إلى شرطات سفلية (`email_execute`) مع خريطة عكسية لاستعادة الأسماء الأصلية في النتائج.

### إدارة رموز OAuth2

يدير PRX دورة حياة OAuth2 كاملة:

1. **تسجيل الدخول**: `prx auth login --provider openai-codex` يبدأ تدفق رمز الجهاز
2. **تخزين الرموز**: تُخزن الرموز مشفّرة في `~/.openprx/`
3. **تحديث تلقائي**: يتم تحديث رموز الوصول المنتهية تلقائيًا باستخدام رمز التحديث المخزّن
4. **استيراد Codex CLI**: إذا كان لديك تثبيت Codex CLI موجود، يستطيع PRX استيراد رموزه تلقائيًا

### معالجة البث

يتعامل المزوّد مع بث SSE عبر:
- مهلة خمول (45 ثانية افتراضيًا، قابلة للضبط عبر `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS`)
- حجم استجابة أقصى (4 MB)
- تعامل سلس مع علامة `[DONE]` وأحداث النهاية
- اكتشاف تلقائي لنوع المحتوى (SSE مقابل JSON)

## متغيرات البيئة

| المتغير | الوصف |
|----------|-------------|
| `ZEROCLAW_CODEX_REASONING_EFFORT` | تجاوز جهد الاستدلال (`minimal` / `low` / `medium` / `high` / `xhigh`) |
| `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS` | مهلة خمول البث بالثواني (الافتراضي: 45، الحد الأدنى: 5) |

## استكشاف الأخطاء وإصلاحها

### "OpenAI Codex auth profile not found"

شغّل `prx auth login --provider openai-codex` لإتمام المصادقة. يتطلب هذا اشتراك ChatGPT.

### "OpenAI Codex account id not found"

رمز JWT لا يحتوي على معرّف حساب. أعد المصادقة عبر `prx auth login --provider openai-codex`.

### أخطاء مهلة البث

إذا ظهر `provider_response_timeout kind=stream_idle_timeout` فهذا يعني أن النموذج يستغرق وقتًا أطول من المتوقع للرد. الخيارات:
- زد المهلة: `export ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS=120`
- استخدم نموذجًا أسرع مثل `gpt-5.1-codex-mini`

### خطأ "payload_too_large"

تجاوزت الاستجابة 4 MB. يشير هذا عادةً إلى استجابة نموذج كبيرة بشكل غير معتاد. جرّب تقسيم الطلب إلى أجزاء أصغر.

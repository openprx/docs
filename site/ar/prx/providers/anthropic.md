---
title: Anthropic
description: تهيئة Anthropic Claude كمزوّد LLM في PRX
---

# Anthropic

> يمكنك الوصول إلى نماذج Claude ‏(Opus، Sonnet، Haiku) عبر Anthropic Messages API مع استخدام الأدوات بشكل أصلي، ودعم الرؤية، وتخزين المطالبات مؤقتًا، والتجديد التلقائي لرموز OAuth.

## المتطلبات المسبقة

- مفتاح Anthropic API من [console.anthropic.com](https://console.anthropic.com/)، **أو**
- رمز OAuth لـ Claude Code (يتم اكتشافه تلقائيًا من `~/.claude/.credentials.json`)

## إعداد سريع

### 1. الحصول على مفتاح API

1. سجّل في [console.anthropic.com](https://console.anthropic.com/)
2. انتقل إلى **API Keys** في لوحة التحكم
3. انقر **Create Key** ثم انسخ المفتاح (يبدأ بـ `sk-ant-`)

### 2. الإعداد

```toml
[default]
provider = "anthropic"
model = "claude-sonnet-4-20250514"

[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

أو اضبط متغير البيئة:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. التحقق

```bash
prx doctor models
```

## النماذج المتاحة

| النموذج | السياق | الرؤية | استخدام الأدوات | ملاحظات |
|-------|---------|--------|----------|-------|
| `claude-opus-4-20250514` | 200K | نعم | نعم | الأعلى قدرة، الأفضل للاستدلال المعقّد |
| `claude-sonnet-4-20250514` | 200K | نعم | نعم | أفضل توازن بين السرعة والقدرة |
| `claude-haiku-3-5-20241022` | 200K | نعم | نعم | الأسرع والأكثر كفاءة من حيث التكلفة |
| `claude-sonnet-4-6` | 200K | نعم | نعم | أحدث إصدار Sonnet |
| `claude-opus-4-6` | 200K | نعم | نعم | أحدث إصدار Opus |

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `api_key` | string | مطلوب | مفتاح Anthropic API ‏(`sk-ant-...`) أو رمز OAuth |
| `api_url` | string | `https://api.anthropic.com` | عنوان API أساسي مخصص (للوكيل) |
| `model` | string | `claude-sonnet-4-20250514` | النموذج الافتراضي للاستخدام |

## الميزات

### الاستدعاء الأصلي للأدوات

يرسل PRX تعريفات الأدوات بصيغة Anthropic الأصلية باستخدام `input_schema`، ما يتجنب التحويل غير الدقيق من صيغة OpenAI إلى Anthropic. يتم تغليف نتائج الأدوات بشكل صحيح ككتل محتوى `tool_result`.

### الرؤية (تحليل الصور)

الصور المضمّنة في الرسائل بعلامات `[IMAGE:data:image/png;base64,...]` تُحوَّل تلقائيًا إلى كتل محتوى `image` الأصلية في Anthropic مع حقول `media_type` و`source_type` الصحيحة. يتم دعم الصور حتى 20 MB (ويتم تسجيل تحذير للحمولات التي تتجاوز هذا الحجم).

### التخزين المؤقت للمطالبات

يطبّق PRX تلقائيًا التخزين المؤقت الفوري (ephemeral) الخاص بـ Anthropic لتقليل التكلفة وزمن الاستجابة:

- **مطالبات النظام** الأكبر من ~1024 رمزًا (3 KB) تحصل على كتلة `cache_control`
- **المحادثات** التي تحتوي على أكثر من 4 رسائل غير نظامية يتم فيها تخزين آخر رسالة مؤقتًا
- **تعريفات الأدوات** يتم وضع علامة `cache_control: ephemeral` على آخر أداة

لا يلزم أي إعداد؛ يتم تطبيق التخزين المؤقت بشكل شفاف.

### التجديد التلقائي لرمز OAuth

عند استخدام بيانات اعتماد Claude Code، يقوم PRX تلقائيًا بما يلي:

1. يكتشف رموز OAuth المخزنة مؤقتًا من `~/.claude/.credentials.json`
2. يجدّد الرموز استباقيًا قبل انتهاء الصلاحية بـ 90 ثانية
3. يعيد المحاولة عند استجابات 401 باستخدام رمز جديد
4. يحفظ بيانات الاعتماد المحدَّثة مرة أخرى على القرص

وهذا يعني أن `prx` يمكنه الاستفادة من تسجيل دخول Claude Code الحالي دون أي إعداد إضافي.

### تكامل Claude Code

يتعرف PRX على المصادر التالية لمصادقة Anthropic:

| المصدر | الاكتشاف |
|--------|-----------|
| مفتاح API مباشر | بادئة `sk-ant-api-...`، يُرسل عبر ترويسة `x-api-key` |
| رمز إعداد OAuth | بادئة `sk-ant-oat01-...`، يُرسل عبر `Authorization: Bearer` مع ترويسة `anthropic-beta` |
| بيانات اعتماد Claude Code المخزنة | `~/.claude/.credentials.json` مع `access_token` + `refresh_token` |
| متغير بيئة | `ANTHROPIC_API_KEY` |

### عنوان أساسي مخصص

للتوجيه عبر وكيل أو نقطة نهاية بديلة:

```toml
[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
api_url = "https://my-proxy.example.com"
```

## الأسماء المستعارة للمزوّد

كل الأسماء التالية تُحل إلى مزوّد Anthropic:

- `anthropic`
- `claude-code`
- `claude-cli`

## استكشاف الأخطاء وإصلاحها

### "Anthropic credentials not set"

لم يتمكن PRX من العثور على أي مصادقة. تأكد من ضبط أحد الخيارات التالية:

1. متغير البيئة `ANTHROPIC_API_KEY`
2. `api_key` في `config.toml` تحت `[providers.anthropic]`
3. ملف `~/.claude/.credentials.json` صالح من Claude Code

### 401 Unauthorized

- **مفتاح API**: تحقق أنه يبدأ بـ `sk-ant-api-` ولم تنتهِ صلاحيته
- **رمز OAuth**: شغّل `prx auth login --provider anthropic` لإعادة المصادقة، أو أعد تشغيل Claude Code لتحديث الرمز
- **مشكلة وكيل**: إذا كنت تستخدم `api_url` مخصصًا، تأكد أن الوكيل يمرر ترويسة `x-api-key` أو `Authorization` بشكل صحيح

### حمولة الصورة كبيرة جدًا

توصي Anthropic بأن تكون الصور أقل من 20 MB بصيغة base64. غيّر حجم الصور الكبيرة أو اضغطها قبل الإرسال.

### التخزين المؤقت للمطالبات لا يعمل

التخزين المؤقت تلقائي لكنه يتطلب:
- مطالبة نظام أكبر من 3 KB لتفعيل التخزين المؤقت على مستوى النظام
- أكثر من 4 رسائل غير نظامية لتفعيل التخزين المؤقت للمحادثة
- إصدار API `2023-06-01` (يضبطه PRX تلقائيًا)

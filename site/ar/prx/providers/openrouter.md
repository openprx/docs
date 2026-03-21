---
title: OpenRouter
description: تهيئة OpenRouter كمزوّد LLM في PRX
---

# OpenRouter

> الوصول إلى أكثر من 200 نموذج من عدة مزوّدين (OpenAI وAnthropic وGoogle وMeta وMistral وغيرهم) عبر مفتاح API واحد وواجهة موحّدة.

## المتطلبات المسبقة

- مفتاح OpenRouter API من [openrouter.ai](https://openrouter.ai/)

## إعداد سريع

### 1. الحصول على مفتاح API

1. سجّل في [openrouter.ai](https://openrouter.ai/)
2. اذهب إلى **Keys** في لوحة التحكم
3. انقر **Create Key** ثم انسخه (يبدأ بـ `sk-or-`)

### 2. الإعداد

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[providers.openrouter]
api_key = "${OPENROUTER_API_KEY}"
```

أو اضبط متغير البيئة:

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. التحقق

```bash
prx doctor models
```

## النماذج المتاحة

يوفر OpenRouter الوصول إلى مئات النماذج. بعض الخيارات الشائعة:

| Model | Provider | Context | Vision | Tool Use | Notes |
|-------|----------|---------|--------|----------|-------|
| `anthropic/claude-sonnet-4` | Anthropic | 200K | Yes | Yes | Claude Sonnet 4 |
| `anthropic/claude-opus-4` | Anthropic | 200K | Yes | Yes | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | Yes | Yes | GPT-4o |
| `openai/o3` | OpenAI | 128K | Yes | Yes | Reasoning model |
| `google/gemini-2.5-pro` | Google | 1M | Yes | Yes | Gemini Pro |
| `google/gemini-2.5-flash` | Google | 1M | Yes | Yes | Gemini Flash |
| `meta-llama/llama-3.1-405b-instruct` | Meta | 128K | No | Yes | Largest open model |
| `deepseek/deepseek-chat` | DeepSeek | 128K | No | Yes | DeepSeek V3 |
| `mistralai/mistral-large` | Mistral | 128K | No | Yes | Mistral Large |
| `x-ai/grok-2` | xAI | 128K | No | Yes | Grok 2 |

تصفّح قائمة النماذج الكاملة على [openrouter.ai/models](https://openrouter.ai/models).

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `api_key` | string | مطلوب | مفتاح OpenRouter API ‏(`sk-or-...`) |
| `model` | string | مطلوب | معرّف النموذج بصيغة `provider/model` |

## الميزات

### وصول موحّد لمزوّدين متعددين

باستخدام مفتاح OpenRouter API واحد، يمكنك الوصول إلى نماذج من OpenAI وAnthropic وGoogle وMeta وMistral وCohere وغيرهم. هذا يلغي الحاجة إلى إدارة مفاتيح API متعددة.

### API متوافق مع OpenAI

يوفّر OpenRouter واجهة Chat Completions API متوافقة مع OpenAI على `https://openrouter.ai/api/v1/chat/completions`. يرسل PRX الطلبات مع:

- `Authorization: Bearer <key>` للمصادقة
- `HTTP-Referer: https://github.com/theonlyhennygod/openprx` لتعريف التطبيق
- `X-Title: OpenPRX` لإسناد اسم التطبيق

### الاستدعاء الأصلي للأدوات

تُرسل الأدوات بصيغة استدعاء الدوال الأصلية في OpenAI. يدعم المزوّد `tool_choice: "auto"` ويتعامل بشكل صحيح مع استجابات استدعاء الأدوات المهيكلة بما فيها ربط `tool_call_id` في تفاعلات الأدوات متعددة الأدوار.

### سجل محادثة متعدد الأدوار

يُحفَظ سجل المحادثة كاملًا بصيغة مهيكلة صحيحة:
- رسائل المساعد مع استدعاءات الأدوات تُسلسل بمصفوفات `tool_calls`
- رسائل نتائج الأدوات تتضمن مراجع `tool_call_id`
- رسائل النظام والمستخدم والمساعد تُمرَّر مباشرة

### تدفئة الاتصال

عند البدء، يرسل PRX طلبًا خفيفًا إلى `https://openrouter.ai/api/v1/auth/key` للتحقق من مفتاح API وإنشاء تجمعات اتصال TLS/HTTP2.

### توجيه النماذج

يدعم OpenRouter توجيه النماذج والرجوع على مستوى API. يمكنك أيضًا استخدام `fallback_providers` المدمجة في PRX للرجوع من جهة العميل:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[reliability]
fallback_providers = ["openai"]
```

## المزوّد الافتراضي

OpenRouter هو المزوّد الافتراضي في PRX. إذا لم يتم تحديد `provider` في إعدادك، يستخدم PRX OpenRouter تلقائيًا.

## استكشاف الأخطاء وإصلاحها

### "OpenRouter API key not set"

اضبط متغير البيئة `OPENROUTER_API_KEY` أو أضف `api_key` تحت `[providers.openrouter]` في `config.toml`. يمكنك أيضًا تشغيل `prx onboard` للإعداد التفاعلي.

### 402 Payment Required

لا يحتوي حساب OpenRouter على رصيد كافٍ. أضف رصيدًا من [openrouter.ai/credits](https://openrouter.ai/credits).

### أخطاء خاصة بالنموذج

للنماذج المختلفة على OpenRouter قدرات وحدود معدل مختلفة. إذا أرجع نموذج معيّن أخطاء:
- تحقق من أن النموذج يدعم استدعاء الأدوات (ليس جميعها يدعم)
- تأكد أن النموذج غير موقوف على OpenRouter
- جرّب متغيرًا آخر للنموذج

### استجابات بطيئة

يقوم OpenRouter بالتوجيه إلى المزوّد الأساسي. يعتمد وقت الاستجابة على:
- الحمل الحالي لدى مزوّد النموذج
- بُعد موقعك الجغرافي عن المزوّد
- حجم النموذج وطول السياق

فكّر في استخدام `fallback_providers` للتحويل إلى اتصال مباشر مع مزوّد آخر إذا كان OpenRouter بطيئًا.

### تحديد المعدل

لدى OpenRouter حدود معدل خاصة به إضافةً إلى حدود المزوّد الأساسي. عند مواجهة تحديد معدل:
- راقب الاستخدام على [openrouter.ai/usage](https://openrouter.ai/usage)
- رقِّ خطتك لحدود أعلى
- استخدم غلاف المزوّد الموثوق في PRX لإعادة المحاولة تلقائيًا مع التراجع

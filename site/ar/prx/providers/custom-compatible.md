---
title: توافق مخصص
description: تهيئة أي نقطة نهاية API متوافقة مع OpenAI كمزوّد LLM في PRX
---

# توافق مخصص

> صِل PRX بأي واجهة LLM API تتبع صيغة OpenAI Chat Completions. يعمل مع LiteLLM وvLLM وGroq وMistral وxAI وVenice وVercel AI وCloudflare AI وHuggingFace Inference وأي خدمة أخرى متوافقة مع OpenAI.

## المتطلبات المسبقة

- واجهة LLM API قيد التشغيل وتنفذ صيغة OpenAI Chat Completions ‏(`/v1/chat/completions` أو `/chat/completions`)
- مفتاح API (إذا كانت الخدمة تتطلبه)

## إعداد سريع

### 1. تحديد نقطة النهاية

حدّد عنوان URL الأساسي وطريقة المصادقة لواجهة API لديك. على سبيل المثال:

- Groq: `https://api.groq.com/openai/v1`
- Mistral: `https://api.mistral.ai/v1`
- xAI: `https://api.x.ai/v1`
- Local vLLM: `http://localhost:8000/v1`
- LiteLLM proxy: `http://localhost:4000`

### 2. الإعداد

```toml
[default]
provider = "compatible"
model = "your-model-name"

[providers.compatible]
api_key = "${YOUR_API_KEY}"
api_url = "https://api.your-provider.com/v1"
```

### 3. التحقق

```bash
prx doctor models
```

## مزوّدات التوافق المدمجة

يتضمن PRX أسماء مستعارة مُعدّة مسبقًا لخدمات شائعة متوافقة مع OpenAI:

| Provider Name | Aliases | Base URL | Auth Style |
|--------------|---------|----------|------------|
| Venice | `venice` | `https://api.venice.ai` | Bearer |
| Vercel AI | `vercel`, `vercel-ai` | `https://api.vercel.ai` | Bearer |
| Cloudflare AI | `cloudflare`, `cloudflare-ai` | `https://gateway.ai.cloudflare.com/v1` | Bearer |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Bearer |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Bearer |
| xAI | `xai`, `grok` | `https://api.x.ai/v1` | Bearer |
| Qianfan | `qianfan`, `baidu` | `https://aip.baidubce.com` | Bearer |
| Synthetic | `synthetic` | `https://api.synthetic.com` | Bearer |
| OpenCode Zen | `opencode`, `opencode-zen` | `https://opencode.ai/zen/v1` | Bearer |
| LiteLLM | `litellm`, `lite-llm` | configurable | Bearer |
| vLLM | `vllm`, `v-llm` | configurable | Bearer |
| HuggingFace | `huggingface`, `hf` | configurable | Bearer |

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `api_key` | string | اختياري | مفتاح مصادقة API |
| `api_url` | string | مطلوب | عنوان URL الأساسي لنقطة نهاية API |
| `model` | string | مطلوب | اسم/معرّف النموذج للاستخدام |
| `auth_style` | string | `"bearer"` | نمط ترويسة المصادقة (انظر أدناه) |

### أنماط المصادقة

| النمط | صيغة الترويسة | الاستخدام |
|-------|---------------|-------|
| `bearer` | `Authorization: Bearer <key>` | أغلب المزوّدين (الافتراضي) |
| `x-api-key` | `x-api-key: <key>` | بعض المزوّدين الصينيين |
| `custom` | اسم ترويسة مخصص | حالات خاصة |

## الميزات

### اكتشاف تلقائي لنقطة النهاية

يقوم PRX تلقائيًا بإضافة `/chat/completions` إلى عنوان URL الأساسي. لا تحتاج إلى تضمين مسار نقطة النهاية:

```toml
# Correct - PRX appends /chat/completions
api_url = "https://api.groq.com/openai/v1"

# Also correct - explicit path works too
api_url = "https://api.groq.com/openai/v1/chat/completions"
```

### الرجوع إلى Responses API

بالنسبة للمزوّدين الذين يدعمون Responses API الأحدث من OpenAI، يمكن لـ PRX الرجوع إلى `/v1/responses` عندما يُرجع `/v1/chat/completions` خطأ 404. هذا مفعّل افتراضيًا، ويمكن تعطيله للمزوّدين الذين لا يدعمونه (مثل GLM/Zhipu).

### الاستدعاء الأصلي للأدوات

تُرسل الأدوات بصيغة استدعاء الدوال القياسية في OpenAI:

```json
{
  "type": "function",
  "function": {
    "name": "tool_name",
    "description": "Tool description",
    "parameters": { "type": "object", "properties": {...} }
  }
}
```

يدعم المزوّد `tool_choice: "auto"` ويقوم بإلغاء تسلسل استجابات `tool_calls` المهيكلة بشكل صحيح.

### دعم الرؤية

للنماذج القادرة على الرؤية، تُحوَّل الصور المضمّنة في الرسائل بعلامات `[IMAGE:data:image/png;base64,...]` تلقائيًا إلى صيغة الرؤية الخاصة بـ OpenAI مع كتل محتوى `image_url`.

### دعم البث

يدعم مزود التوافق بث SSE لإرسال الرموز في الزمن الحقيقي. يتم تحليل أحداث البث تدريجيًا مع دعم:
- مقاطع النص `delta.content`
- `delta.tool_calls` للبناء التدريجي لاستدعاءات الأدوات
- اكتشاف علامة `[DONE]`
- التعامل السلس مع انتهاء المهلة

### دمج رسالة النظام

بعض المزوّدين (مثل MiniMax) يرفضون رسائل `role: system`. يمكن لـ PRX دمج محتوى رسالة النظام تلقائيًا داخل أول رسالة مستخدم. هذا مفعّل افتراضيًا للمزوّدين المعروفين بعدم التوافق.

### فرض وضع HTTP/1.1

بعض المزوّدين (خصوصًا DashScope/Qwen) يتطلبون HTTP/1.1 بدلًا من HTTP/2. يكتشف PRX هذه النقاط تلقائيًا ويجبر استخدام HTTP/1.1 لتحسين موثوقية الاتصال.

### الرجوع إلى محتوى الاستدلال

للنماذج الاستدلالية التي تُرجع المخرجات في `reasoning_content` بدلًا من `content`، يرجع PRX تلقائيًا لاستخراج نص الاستدلال.

## إعدادات متقدمة

### خادم LLM محلي (vLLM، llama.cpp، إلخ)

```toml
[default]
provider = "compatible"
model = "meta-llama/Llama-3.1-8B-Instruct"

[providers.compatible]
api_url = "http://localhost:8000/v1"
# No api_key needed for local servers
```

### LiteLLM Proxy

```toml
[default]
provider = "litellm"
model = "gpt-4o"

[providers.litellm]
api_key = "${LITELLM_API_KEY}"
api_url = "http://localhost:4000"
```

### عدة مزوّدين مخصصين

استخدم موجّه النماذج لإعداد عدة مزوّدين متوافقين:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[[model_routes]]
pattern = "groq/*"
provider = "compatible"
api_url = "https://api.groq.com/openai/v1"
api_key = "${GROQ_API_KEY}"

[[model_routes]]
pattern = "mistral/*"
provider = "compatible"
api_url = "https://api.mistral.ai/v1"
api_key = "${MISTRAL_API_KEY}"
```

## استكشاف الأخطاء وإصلاحها

### Connection refused

تأكد أن نقطة نهاية API قابلة للوصول:
```bash
curl -v https://api.your-provider.com/v1/models
```

### 401 Unauthorized

- تحقق من صحة مفتاح API
- تأكد أن نمط المصادقة يطابق مزوّدك (Bearer مقابل x-api-key)
- بعض المزوّدين يتطلبون ترويسات إضافية؛ استخدم اسمًا مستعارًا معروفًا للمزوّد إذا كان متاحًا

### تم رفض "role: system"

إذا كان مزوّدك لا يدعم رسائل النظام، يفترض أن PRX يعالج ذلك تلقائيًا للمزوّدين المعروفين. بالنسبة لنقاط النهاية المخصصة، فهذا قيد في المزوّد. الحل المؤقت: ضمّن تعليمات النظام في أول رسالة مستخدم.

### البث لا يعمل

ليست كل واجهات OpenAI المتوافقة تدعم البث. إذا فشل البث، يرجع PRX تلقائيًا إلى وضع غير البث.

### لم يتم العثور على النموذج

تحقق من اسم/معرّف النموذج الدقيق الذي يتوقعه مزودك. تختلف اصطلاحات التسمية بين المزوّدين:
- Groq: `llama-3.3-70b-versatile`
- Mistral: `mistral-large-latest`
- xAI: `grok-2`

راجع توثيق مزوّدك لمعرفة معرّفات النماذج الصحيحة.

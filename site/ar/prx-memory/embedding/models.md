---
title: نماذج التضمين المدعومة
description: "نماذج التضمين المدعومة في PRX-Memory، بما فيها مزودو OpenAI-compatible وJina وGemini مع تفاصيل الإعداد."
---

# نماذج التضمين المدعومة

يدعم PRX-Memory ثلاث عائلات من مزودي التضمين. يتصل كل مزوّد من خلال واجهة المحوّل الموحدة لحزمة `prx-memory-embed`.

## متوافق مع OpenAI

يمكن استخدام أي واجهة برمجة تتبع تنسيق نقطة نهاية تضمين OpenAI (`/v1/embeddings`). يشمل ذلك OpenAI نفسها وAzure OpenAI وخوادم الاستنتاج المحلية.

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_openai_key
PRX_EMBED_MODEL=text-embedding-3-small
PRX_EMBED_BASE_URL=https://api.openai.com  # optional
```

| النموذج | الأبعاد | ملاحظات |
|---------|---------|---------|
| `text-embedding-3-small` | 1536 | توازن جيد بين الجودة والتكلفة |
| `text-embedding-3-large` | 3072 | أعلى جودة، تكلفة أعلى |
| `text-embedding-ada-002` | 1536 | نموذج قديم |

::: tip الاستنتاج المحلي
للنشر الحساس للخصوصية، وجّه `PRX_EMBED_BASE_URL` إلى خادم استنتاج محلي يشغّل نموذج تضمين مفتوح المصدر (مثلاً عبر Ollama أو vLLM أو text-embeddings-inference).
:::

## Jina AI

توفر Jina نماذج تضمين متعددة اللغات عالية الجودة ومُحسَّنة لمهام الاسترجاع.

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| النموذج | الأبعاد | ملاحظات |
|---------|---------|---------|
| `jina-embeddings-v3` | 1024 | أحدث نموذج متعدد اللغات |
| `jina-embeddings-v2-base-en` | 768 | مُحسَّن للإنجليزية |
| `jina-embeddings-v2-base-code` | 768 | مُحسَّن للكود |

::: info مفتاح احتياطي
إذا لم يكن `PRX_EMBED_API_KEY` مضبوطاً، يتحقق النظام من `JINA_API_KEY` كمفتاح احتياطي.
:::

## Google Gemini

نماذج التضمين من Gemini متاحة عبر Google AI API.

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| النموذج | الأبعاد | ملاحظات |
|---------|---------|---------|
| `text-embedding-004` | 768 | النموذج الموصى به حالياً |
| `embedding-001` | 768 | نموذج قديم |

::: info مفتاح احتياطي
إذا لم يكن `PRX_EMBED_API_KEY` مضبوطاً، يتحقق النظام من `GEMINI_API_KEY` كمفتاح احتياطي.
:::

## اختيار نموذج

| الأولوية | النموذج الموصى به | المزوّد |
|---------|-----------------|---------|
| أفضل جودة | `text-embedding-3-large` | متوافق مع OpenAI |
| الأفضل للكود | `jina-embeddings-v2-base-code` | Jina |
| متعدد اللغات | `jina-embeddings-v3` | Jina |
| الخصوصية / محلي | أي نموذج محلي عبر `openai-compatible` | مستضاف ذاتياً |
| فعّال التكلفة | `text-embedding-3-small` | متوافق مع OpenAI |

## تبديل النماذج

عند تبديل نماذج التضمين، تصبح المتجهات الموجودة غير متوافقة مع فضاء المتجه للنموذج الجديد. استخدم أداة `memory_reembed` لإعادة تضمين جميع الذكريات المخزّنة بالنموذج الجديد:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_reembed",
    "arguments": {}
  }
}
```

::: warning
إعادة التضمين تتطلب طلبات API لكل ذاكرة مخزّنة. بالنسبة لقواعد البيانات الكبيرة، قد يستغرق هذا وقتاً كبيراً ويتكبد تكاليف API. خطط لإعادة التضمين خلال فترات انخفاض الاستخدام.
:::

## الخطوات التالية

- [معالجة الدفعات](./batch-processing) -- التضمين المجمع الفعّال
- [نماذج إعادة الترتيب](../reranking/models) -- خيارات نموذج إعادة الترتيب في المرحلة الثانية
- [مرجع الإعداد](../configuration/) -- جميع متغيرات البيئة

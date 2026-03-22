---
title: نماذج إعادة الترتيب
description: "نماذج إعادة الترتيب المدعومة في PRX-Memory، بما فيها مزودو Jina وCohere وPinecone."
---

# نماذج إعادة الترتيب

يدعم PRX-Memory مزودي إعادة ترتيب متعددين من خلال حزمة `prx-memory-rerank`. كل مزوّد ينفّذ نفس سمة المحوّل، مما يتيح التبديل السلس.

## Jina AI

توفر Jina نماذج ترميز متقاطع لإعادة الترتيب مع دعم متعدد اللغات.

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| النموذج | ملاحظات |
|---------|---------|
| `jina-reranker-v2-base-multilingual` | ترميز متقاطع متعدد اللغات |
| `jina-reranker-v1-base-en` | مُحسَّن للإنجليزية |

::: info
يمكن لإعادة الترتيب في Jina استخدام نفس مفتاح API الخاص بالتضمين من Jina. اضبط `JINA_API_KEY` مرة واحدة لتغطية الاثنين.
:::

## Cohere

توفر Cohere إعادة ترتيب عالية الجودة من خلال Rerank API الخاصة بهم.

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| النموذج | ملاحظات |
|---------|---------|
| `rerank-v3.5` | أحدث نموذج، أفضل جودة |
| `rerank-english-v3.0` | مُحسَّن للإنجليزية |
| `rerank-multilingual-v3.0` | دعم متعدد اللغات |

## Pinecone

توفر Pinecone إعادة الترتيب كجزء من واجهة برمجة الاستنتاج الخاصة بهم.

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

لنقاط النهاية المخصصة المتوافقة مع Pinecone:

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## اختيار معيد الترتيب

| الأولوية | المزوّد الموصى به | النموذج |
|---------|----------------|---------|
| أفضل جودة | Cohere | `rerank-v3.5` |
| متعدد اللغات | Jina | `jina-reranker-v2-base-multilingual` |
| متكامل مع Pinecone | Pinecone | `bge-reranker-v2-m3` |
| لا حاجة لإعادة الترتيب | -- | `PRX_RERANK_PROVIDER=none` |

## الجمع بين التضمين وإعادة الترتيب

إعداد شائع عالي الجودة يجمع بين تضمينات Jina وإعادة ترتيب Cohere:

```bash
# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

يستفيد هذا الإعداد من تضمينات Jina متعددة اللغات السريعة للاسترجاع الواسع ومعيد الترتيب عالي الدقة من Cohere للترتيب النهائي.

## الخطوات التالية

- [نماذج التضمين](../embedding/models) -- خيارات نموذج التضمين في المرحلة الأولى
- [مرجع الإعداد](../configuration/) -- جميع متغيرات البيئة

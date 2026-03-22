---
title: مرجع الإعداد
description: "مرجع كامل لجميع متغيرات بيئة PRX-Memory يغطي النقل والتخزين والتضمين وإعادة الترتيب والحوكمة والمراقبة."
---

# مرجع الإعداد

يُعدَّ PRX-Memory بالكامل من خلال متغيرات البيئة. توثّق هذه الصفحة كل متغير مجمّعاً حسب الفئة.

## النقل

| المتغير | القيم | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`، `http` | `stdio` | وضع نقل الخادم |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | عنوان ربط خادم HTTP |

## التخزين

| المتغير | القيم | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `PRX_MEMORY_BACKEND` | `json`، `sqlite`، `lancedb` | `json` | واجهة التخزين |
| `PRX_MEMORY_DB` | مسار ملف/دليل | -- | مسار ملف أو دليل قاعدة البيانات |

## التضمين

| المتغير | القيم | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`، `jina`، `gemini` | -- | مزوّد التضمين |
| `PRX_EMBED_API_KEY` | سلسلة مفتاح API | -- | مفتاح API لمزوّد التضمين |
| `PRX_EMBED_MODEL` | اسم النموذج | خاص بالمزوّد | اسم نموذج التضمين |
| `PRX_EMBED_BASE_URL` | URL | خاص بالمزوّد | URL نقطة نهاية API المخصصة |

### مفاتيح الاحتياطية للمزوّد

إذا لم يكن `PRX_EMBED_API_KEY` مضبوطاً، يتحقق النظام من هذه المفاتيح الخاصة بالمزوّد:

| المزوّد | المفتاح الاحتياطي |
|---------|----------------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## إعادة الترتيب

| المتغير | القيم | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `PRX_RERANK_PROVIDER` | `jina`، `cohere`، `pinecone`، `pinecone-compatible`، `none` | `none` | مزوّد إعادة الترتيب |
| `PRX_RERANK_API_KEY` | سلسلة مفتاح API | -- | مفتاح API لمزوّد إعادة الترتيب |
| `PRX_RERANK_MODEL` | اسم النموذج | خاص بالمزوّد | اسم نموذج إعادة الترتيب |
| `PRX_RERANK_ENDPOINT` | URL | خاص بالمزوّد | نقطة نهاية إعادة ترتيب مخصصة |
| `PRX_RERANK_API_VERSION` | سلسلة الإصدار | -- | إصدار API (خاص بـ pinecone-compatible فقط) |

### مفاتيح الاحتياطية للمزوّد

إذا لم يكن `PRX_RERANK_API_KEY` مضبوطاً، يتحقق النظام من هذه المفاتيح الخاصة بالمزوّد:

| المزوّد | المفتاح الاحتياطي |
|---------|----------------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## التوحيد

| المتغير | القيم | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`، `governed` | `zero-config` | ملف التوحيد الشخصي |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | سلسلة وسم | `prx-memory` | وسم المشروع الافتراضي |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | سلسلة وسم | `mcp` | وسم الأداة الافتراضي |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | سلسلة وسم | `general` | وسم النطاق الافتراضي |

## جلسات البث

| المتغير | القيم | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | مللي ثانية | `300000` | مدة صلاحية جلسة البث |

## المراقبة

### ضوابط الكثافة العددية

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | الحد الأقصى لتسميات النطاق المتميزة في المقاييس |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | الحد الأقصى لتسميات الفئة المتميزة في المقاييس |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | الحد الأقصى لتسميات مزوّد إعادة الترتيب المتميزة |

### عتبات التنبيه

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | عتبة تحذير نسبة خطأ الأداة |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | عتبة حرجة لنسبة خطأ الأداة |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | عتبة تحذير نسبة التحذير البعيد |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | عتبة حرجة لنسبة التحذير البعيد |

## مثال: الإعداد الأدنى

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## مثال: الإعداد الإنتاجي الكامل

```bash
# Transport
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Storage
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Governance
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Sessions
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Observability
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## الخطوات التالية

- [التثبيت](../getting-started/installation) -- بناء وتثبيت PRX-Memory
- [تكامل MCP](../mcp/) -- إعداد عميل MCP الخاص بك
- [استكشاف الأخطاء](../troubleshooting/) -- مشكلات الإعداد الشائعة

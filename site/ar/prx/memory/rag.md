---
title: التوليد المعزّز بالاسترجاع (RAG)
description: كيف يستخدم PRX التضمينات وبحث الذاكرة لحقن سياق ذي صلة في موجهات LLM قبل التوليد.
---

# التوليد المعزّز بالاسترجاع (RAG)

ينفّذ PRX آلية Retrieval-Augmented Generation (RAG) لتعزيز استجابات LLM بسياق ذي صلة من ذاكرة الوكيل ومخازن المعرفة. بدل الاعتماد فقط على المعرفة البارامترية داخل LLM، يقوم RAG باسترجاع المستندات المناسبة وحقنها في الموجّه، مما يقلل الهلوسة ويربط الإجابات بمعلومات واقعية ومحدّثة.

## نظرة عامة

يعمل خط أنابيب RAG قبل كل استدعاء LLM داخل حلقة الوكيل:

```
User Message
    │
    ▼
┌──────────────────────────┐
│  1. Query Formulation     │  Extract search terms from the
│                           │  user message + conversation context
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  2. Embedding Generation  │  Convert query to a vector using
│                           │  the configured embedding provider
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  3. Memory Search         │  Search across memory backends:
│                           │  vector similarity + full-text
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  4. Relevance Filtering   │  Score and filter results above
│                           │  the relevance threshold
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  5. Context Injection     │  Format results and inject into
│                           │  the system prompt / context window
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  6. LLM Generation        │  Model generates response with
│                           │  full context available
└──────────────────────────┘
```

## الإعدادات

فعّل RAG في `config.toml`:

```toml
[memory]
backend = "embeddings"  # RAG requires the embeddings backend

[memory.embeddings]
# Embedding provider: "openai" | "ollama" | "local"
provider = "openai"
model = "text-embedding-3-small"
dimensions = 1536

# Vector store backend
vector_store = "sqlite"  # "sqlite" | "postgres" | "qdrant"

[rag]
enabled = true

# Maximum number of retrieved chunks to inject into context.
max_results = 10

# Minimum relevance score (0.0 to 1.0) for a chunk to be included.
relevance_threshold = 0.3

# Maximum total tokens allocated for RAG context.
# Prevents context window overflow.
max_context_tokens = 4000

# Strategy for selecting which chunks to include when
# max_context_tokens would be exceeded.
# "top_k" -- highest relevance scores first
# "mmr" -- maximal marginal relevance (diversity + relevance)
selection_strategy = "top_k"
```

### مزودو Embedding

يدعم PRX عدة مزودين للتضمينات:

| Provider | Model | Dimensions | Notes |
|----------|-------|------------|-------|
| OpenAI | text-embedding-3-small | 1536 | أفضل نسبة جودة/تكلفة |
| OpenAI | text-embedding-3-large | 3072 | أعلى جودة |
| Ollama | nomic-embed-text | 768 | محلي، بلا تكلفة API |
| Ollama | mxbai-embed-large | 1024 | محلي، جودة أعلى |
| Local | fastembed | 384 | مدمج، دون شبكة |

اضبط مزود embedding:

```toml
# OpenAI embeddings
[memory.embeddings]
provider = "openai"
model = "text-embedding-3-small"
api_key = "${OPENAI_API_KEY}"

# Ollama embeddings (local)
[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
endpoint = "http://localhost:11434"

# Built-in local embeddings (no external service)
[memory.embeddings]
provider = "local"
model = "fastembed"
```

## استراتيجيات التقسيم إلى مقاطع

قبل تضمين المستندات والبحث فيها، يجب تقسيمها إلى مقاطع. يدعم PRX عدة استراتيجيات للتقسيم:

| Strategy | Description | Best For |
|----------|-------------|----------|
| `fixed_size` | التقسيم عند عدد ثابت من التوكنات مع تداخل | المستندات المتجانسة |
| `sentence` | التقسيم عند حدود الجمل | النصوص الطبيعية |
| `paragraph` | التقسيم عند حدود الفقرات | المستندات المهيكلة |
| `semantic` | التقسيم عند حدود الموضوع باستخدام التضمينات | المستندات الطويلة المتنوعة |
| `recursive` | تقسيم هرمي (عنوان > فقرة > جملة) | Markdown/code |

```toml
[rag.chunking]
strategy = "recursive"

# Target chunk size in tokens.
chunk_size = 512

# Overlap between adjacent chunks (prevents losing context at boundaries).
chunk_overlap = 64

# For recursive strategy: separators in priority order.
separators = ["\n## ", "\n### ", "\n\n", "\n", ". "]
```

## خط أنابيب الاسترجاع

### الخطوات 1-3: الاستعلام، التضمين، البحث

تستخرج وحدة RAG استعلام بحث من أحدث رسالة للمستخدم (ويمكن إعادة صياغته عبر LLM عند `query_reformulation = true`)، ثم تحوّله إلى متجه باستخدام مزود التضمين، وتبحث عبر جميع واجهات الذاكرة بالتوازي: تشابه المتجهات (cosine) والبحث النصي الكامل (FTS5/pg_trgm). بعد ذلك تُدمج النتائج وتُزال التكرارات.

### الخطوة 4: تصفية الصلة

يحصل كل نتيجة على درجة صلة بين 0.0 و1.0. تُستبعد النتائج الأدنى من `relevance_threshold`. يأخذ التقييم في الاعتبار:

- تشابه المتجهات cosine (الإشارة الأساسية)
- درجة مطابقة النص الكامل (عامل تعزيز)
- الحداثة (الذكريات الأحدث تحصل على تعزيز طفيف)
- أولوية المصدر (الذكريات الأساسية أعلى من المحادثة)

### الخطوة 5: حقن السياق

تُنسّق النتائج المفلترة بعلامات XML منظمة (`<context><memory source="..." relevance="...">`) وتُحقن في موجّه LLM. يُقيَّد إجمالي السياق المحقون عند `max_context_tokens` لتجنب تجاوز نافذة السياق.

## استراتيجيات الاختيار

### Top-K

الاستراتيجية الافتراضية. تختار أعلى K مقاطع تقييمًا ضمن `max_context_tokens`. بسيطة وقابلة للتوقع، لكنها قد تعيد نتائج متكررة عندما تغطي عدة مقاطع الموضوع نفسه.

### Maximal Marginal Relevance (MMR)

توازن MMR بين الصلة والتنوع. تختار المقاطع تدريجيًا بحيث تكون ذات صلة بالاستعلام ومختلفة عن المقاطع المختارة مسبقًا:

```toml
[rag]
selection_strategy = "mmr"

# Lambda controls the relevance-diversity tradeoff.
# 1.0 = pure relevance (same as top_k)
# 0.0 = pure diversity
mmr_lambda = 0.7
```

يُنصح بـ MMR عندما تحتوي قاعدة المعرفة على معلومات متداخلة أو متكررة.

## فهرسة المستندات

### الفهرسة التلقائية

الذكريات المخزنة عبر أداة `memory_store` تُضمَّن وتُفهرس تلقائيًا. لا حاجة إلى إعداد إضافي.

### إدخال المستندات يدويًا

لإدخال كميات كبيرة من المستندات، استخدم CLI:

```bash
# Index a single file or directory
prx rag index /path/to/document.md
prx rag index /path/to/docs/ --recursive

# Re-index all documents (rebuilds embeddings)
prx rag reindex
```

التنسيقات المدعومة: Markdown (`.md`) ونص عادي (`.txt`) وPDF (`.pdf`) وHTML (`.html`) وشفرة المصدر (`.rs`, `.py`, `.js`).

## تحسين الأداء

| Parameter | Recommendation |
|-----------|----------------|
| `chunk_size` | 256-512 tokens for Q&A, 512-1024 for summarization |
| `chunk_overlap` | 10-20% of chunk_size |
| `max_results` | 5-15 for most use cases |
| `relevance_threshold` | 0.3-0.5 (tune based on quality) |

## ملاحظات الأمان

- يُحقن سياق RAG في موجّه LLM. تأكد من أن المستندات المخزنة لا تحتوي بيانات حساسة ما لم يكن الوكيل مخولًا للوصول إليها.
- عند `memory.acl_enabled = true`، يحترم RAG قوائم التحكم بالوصول. تُسترجع فقط الذكريات المتاحة للهوية الحالية.
- استدعاءات Embedding API تنقل محتوى المستند إلى مزود التضمين. للبيانات الحساسة، استخدم مزود تضمين محلي (`ollama` أو `local`).

## صفحات ذات صلة

- [نظام الذاكرة](/ar/prx/memory/)
- [Embeddings](/ar/prx/memory/embeddings)
- [Vector Search](/ar/prx/memory/vector-search)
- [واجهة SQLite](/ar/prx/memory/sqlite)
- [واجهة PostgreSQL](/ar/prx/memory/postgres)

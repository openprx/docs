---
title: البحث المتجهي ومعالجة النص
description: بحث متجهي قائم على التضمينات، واستراتيجيات تقسيم النص، واستخراج الموضوعات، وتصفية المحتوى في ذاكرة PRX.
---

# البحث المتجهي ومعالجة النص

يتضمن PRX خط أنابيب لمعالجة النص يشغّل الاسترجاع الدلالي للذاكرة. يتعامل هذا الخط مع تقسيم النص والتضمين المتجهي واستخراج الموضوعات وتصفية المحتوى، ليحوّل نص المحادثة الخام إلى إدخالات ذاكرة منظمة وقابلة للبحث.

## البنية

يتكون خط معالجة النص من أربع مراحل، ويمكن تهيئة كل مرحلة بشكل مستقل:

```
Raw Text
  │
  ▼
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│ Chunker  │───►│ Embedder  │───►│  Topic    │───►│ Filter   │
│          │    │           │    │ Extractor │    │          │
└──────────┘    └───────────┘    └───────────┘    └──────────┘
  Split text      Vectorize       Classify         Decide if
  into chunks     each chunk      by topic         worth saving
```

## البحث المتجهي

يتيح البحث المتجهي استرجاعًا قائمًا على التشابه الدلالي، أي العثور على ذكريات مرتبطة مفهوميًا بالاستعلام حتى عند اختلاف الكلمات المستخدمة.

### كيف يعمل

1. **Indexing** -- يُضمَّن كل مقطع ذاكرة في متجه كثيف (مثلًا 768 بعدًا)
2. **Storage** -- تُخزَّن المتجهات في فهرس متجهي (`sqlite-vec` أو `pgvector` أو in-memory)
3. **Query** -- يُضمَّن استعلام البحث باستخدام النموذج نفسه
4. **Retrieval** -- يعيد الفهرس أعلى K متجهات حسب تشابه جيب التمام
5. **Reranking** -- اختياريًا، تُعاد رتبة النتائج باستخدام cross-encoder لدقة أعلى

### الإعدادات

```toml
[memory.vector]
enabled = true
index_type = "sqlite-vec"       # "sqlite-vec", "pgvector", or "memory"
similarity_metric = "cosine"    # "cosine", "dot_product", or "euclidean"
top_k = 10
similarity_threshold = 0.5
rerank = false
rerank_model = "cross-encoder/ms-marco-MiniLM-L-6-v2"
```

### أنواع الفهارس

| Index Type | Storage | Persistence | Best For |
|-----------|---------|-------------|----------|
| `sqlite-vec` | ملف محلي | Yes | مستخدم واحد، نشر محلي |
| `pgvector` | PostgreSQL | Yes | نشر إنتاجي متعدد المستخدمين |
| `memory` | داخل العملية | No (session only) | الاختبار والجلسات المؤقتة |

### مرجع الإعدادات

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | تفعيل أو تعطيل البحث المتجهي |
| `index_type` | `String` | `"sqlite-vec"` | واجهة الفهرس المتجهي |
| `similarity_metric` | `String` | `"cosine"` | مقياس المسافة لمقارنة التشابه |
| `top_k` | `usize` | `10` | عدد النتائج المعادة لكل استعلام |
| `similarity_threshold` | `f64` | `0.5` | الحد الأدنى لدرجة التشابه (0.0--1.0) لإدراج النتيجة |
| `rerank` | `bool` | `false` | تفعيل إعادة الترتيب عبر cross-encoder لتحسين الدقة |
| `rerank_model` | `String` | `""` | اسم نموذج cross-encoder (يُستخدم فقط عند `rerank = true`) |
| `ef_search` | `usize` | `64` | معامل بحث HNSW (الأعلى = أدق وأبطأ) |

## تقسيم النص

قبل التضمين، يجب تقسيم النصوص الطويلة إلى مقاطع أصغر. يوفّر PRX استراتيجيتين للتقسيم: واعية بالتوكنات ودلالية.

### التقسيم الواعي بالتوكنات

يقسم هذا الأسلوب النص عند حدود التوكنات لضمان ملاءمة كل مقطع لنافذة سياق نموذج التضمين. ويحترم حدود الكلمات والجمل لتجنب القطع في منتصف الكلمة.

```toml
[memory.chunker]
strategy = "token"
max_tokens = 512
overlap_tokens = 64
tokenizer = "cl100k_base"     # OpenAI-compatible tokenizer
```

الخوارزمية:

1. توكين النص المدخل باستخدام tokenizer المُعد
2. تقسيمه إلى مقاطع بحجم أقصى `max_tokens` توكن
3. يتداخل كل مقطع مع السابق بعدد `overlap_tokens` للحفاظ على السياق عند الحدود
4. تُضبط حدود المقاطع لتتوافق مع فواصل الجمل أو الفقرات عندما يكون ممكنًا

### التقسيم الدلالي

يستخدم التقسيم الدلالي تشابه التضمينات لاكتشاف حدود الموضوع الطبيعية في النص. بدل التقسيم عند عدد ثابت من التوكنات، يكتشف مواضع انتقال الموضوع.

```toml
[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3
```

الخوارزمية:

1. تقسيم النص إلى جمل
2. حساب التضمينات لكل جملة
3. حساب تشابه جيب التمام بين الجمل المتتالية
4. عند انخفاض التشابه تحت `breakpoint_threshold` تُضاف حدود مقطع جديدة
5. دمج المقاطع الصغيرة (الأقل من `min_tokens`) مع المقاطع المجاورة

### مرجع إعدادات التقسيم

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `strategy` | `String` | `"token"` | استراتيجية التقسيم: `"token"` أو `"semantic"` |
| `max_tokens` | `usize` | `512` | الحد الأقصى للتوكنات لكل مقطع |
| `overlap_tokens` | `usize` | `64` | التداخل بين المقاطع المتتالية (للاستراتيجية token فقط) |
| `tokenizer` | `String` | `"cl100k_base"` | اسم tokenizer لحساب التوكنات |
| `min_tokens` | `usize` | `64` | الحد الأدنى للتوكنات لكل مقطع (للاستراتيجية semantic فقط) |
| `breakpoint_threshold` | `f64` | `0.3` | حد انخفاض التشابه لحدود الموضوع (للاستراتيجية semantic فقط) |

### اختيار الاستراتيجية

| Criterion | Token-Aware | Semantic |
|-----------|-------------|----------|
| السرعة | سريع (لا استدعاءات تضمين أثناء التقسيم) | أبطأ (يتطلب تضمينًا لكل جملة) |
| الجودة | جيد للمحتوى المتجانس | أفضل للمستندات متعددة الموضوعات |
| قابلية التنبؤ | أحجام مقاطع ثابتة | أحجام مقاطع متغيرة |
| حالة الاستخدام | سجلات المحادثة، الرسائل القصيرة | المستندات الطويلة، ملاحظات الاجتماعات |

## استخراج الموضوعات

يستخرج PRX الموضوعات تلقائيًا من إدخالات الذاكرة لتنظيمها ضمن فئات. تساعد الموضوعات في تحسين الاسترجاع عبر تمكين البحث المصفّى داخل نطاقات محددة.

### كيف يعمل

1. بعد التقسيم، يُحلَّل كل مقطع للكلمات المفتاحية والسمات الدلالية
2. يعيّن مستخرج الموضوعات وسم موضوع واحدًا أو أكثر من تصنيف قابل للتهيئة
3. تُخزَّن الموضوعات كبيانات وصفية مع إدخال الذاكرة
4. أثناء الاسترجاع، يمكن تصفية الاستعلامات حسب الموضوع لتضييق النتائج

### الإعدادات

```toml
[memory.topics]
enabled = true
max_topics_per_entry = 3
taxonomy = "auto"               # "auto", "fixed", or "hybrid"
custom_topics = []              # only used when taxonomy = "fixed" or "hybrid"
min_confidence = 0.6
```

### أوضاع التصنيف

| Mode | Description |
|------|-------------|
| `auto` | تُولَّد الموضوعات ديناميكيًا من المحتوى. تُنشأ موضوعات جديدة عند الحاجة. |
| `fixed` | لا تُعيَّن إلا الموضوعات الموجودة في `custom_topics`. المحتوى غير المطابق يظل دون تصنيف. |
| `hybrid` | يفضّل `custom_topics` لكنه ينشئ موضوعات جديدة عندما لا يطابق المحتوى أي وسم موجود. |

### مرجع إعدادات الموضوعات

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | تفعيل أو تعطيل استخراج الموضوعات |
| `max_topics_per_entry` | `usize` | `3` | الحد الأقصى لوسوم الموضوع لكل إدخال ذاكرة |
| `taxonomy` | `String` | `"auto"` | نمط التصنيف: `"auto"` أو `"fixed"` أو `"hybrid"` |
| `custom_topics` | `[String]` | `[]` | وسوم موضوعات مخصصة للتصنيف الثابت/الهجين |
| `min_confidence` | `f64` | `0.6` | الحد الأدنى لدرجة الثقة (0.0--1.0) لتعيين موضوع |

## تصفية المحتوى

ليست كل رسالة تستحق الحفظ في الذاكرة طويلة الأمد. يطبق مرشح المحتوى قواعد autosave لتحديد ما يجب حفظه وما يجب تجاهله.

### قواعد Autosave

يقيّم المرشح كل إدخال ذاكرة مرشح وفق عدة معايير:

| Heuristic | Description | Weight |
|-----------|-------------|--------|
| **Information density** | نسبة التوكنات الفريدة إلى إجمالي التوكنات. النص منخفض الكثافة (مثل "ok" و"thanks") يُستبعد | High |
| **Novelty** | التشابه مع الذكريات الحالية. المحتوى شديد التشابه مع المخزن يُتخطى | High |
| **Relevance** | التشابه الدلالي مع اهتمامات المستخدم المعروفة والموضوعات النشطة | Medium |
| **Actionability** | وجود عناصر تنفيذية أو قرارات أو التزامات (مثل "I will..." و"let's do...") | Medium |
| **Recency bias** | يُعطى السياق الحديث وزنًا أعلى للصلة قصيرة الأمد | Low |

تُحسب درجة مركبة كمجموع مرجّح. الإدخالات التي تقل عن `autosave_threshold` لا تُحفَظ.

### الإعدادات

```toml
[memory.filter]
enabled = true
autosave_threshold = 0.4
novelty_threshold = 0.85        # skip if >85% similar to existing memory
min_length = 20                 # skip entries shorter than 20 characters
max_length = 10000              # truncate entries longer than 10,000 characters
exclude_patterns = [
    "^(ok|thanks|got it|sure)$",
    "^\\s*$",
]
```

### مرجع إعدادات المرشح

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | تفعيل أو تعطيل تصفية المحتوى |
| `autosave_threshold` | `f64` | `0.4` | الحد الأدنى للدرجة المركبة (0.0--1.0) لحفظ الذاكرة |
| `novelty_threshold` | `f64` | `0.85` | الحد الأقصى للتشابه مع الذكريات الحالية قبل إزالة التكرار |
| `min_length` | `usize` | `20` | الحد الأدنى لطول الأحرف لإدخال الذاكرة |
| `max_length` | `usize` | `10000` | الحد الأقصى لطول الأحرف (الأطول تُقص) |
| `exclude_patterns` | `[String]` | `[]` | أنماط Regex لمحتوى يجب ألا يُحفظ مطلقًا |

## مثال كامل لخط الأنابيب

إعداد كامل يجمع المراحل الأربع:

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768

[memory.vector]
enabled = true
index_type = "sqlite-vec"
top_k = 10
similarity_threshold = 0.5

[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3

[memory.topics]
enabled = true
taxonomy = "hybrid"
custom_topics = ["coding", "architecture", "debugging", "planning"]

[memory.filter]
enabled = true
autosave_threshold = 0.4
novelty_threshold = 0.85
```

## صفحات ذات صلة

- [نظرة عامة على نظام الذاكرة](./)
- [واجهة Embeddings](./embeddings) -- إعداد مزودات التضمين
- [واجهة SQLite](./sqlite) -- تخزين محلي لفهرس sqlite-vec
- [واجهة PostgreSQL](./postgres) -- تخزين لفهرس pgvector
- [نظافة الذاكرة](./hygiene) -- استراتيجيات الضغط والتنظيف

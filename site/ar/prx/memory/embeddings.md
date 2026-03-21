---
title: واجهة ذاكرة Embeddings
description: ذاكرة دلالية قائمة على المتجهات باستخدام embeddings للاسترجاع بأسلوب RAG.
---

# واجهة ذاكرة Embeddings

تخزن واجهة embeddings الذكريات على شكل متجهات embeddings، مما يتيح البحث بالتشابه الدلالي. هذه أقوى آلية للاسترجاع، إذ تسمح للوكلاء بإيجاد ذكريات ذات صلة سياقية حتى عندما لا تتطابق الكلمات المفتاحية حرفيًا.

## نظرة عامة

واجهة embeddings:

- تحوّل نص الذاكرة إلى تمثيلات متجهية كثيفة
- تخزن المتجهات في قاعدة بيانات متجهات محلية أو بعيدة
- تسترجع الذكريات عبر تشابه جيب التمام مع الاستعلام الحالي
- تدعم عدة مزودين للتضمينات (Ollama وOpenAI وغيرهما)

## كيف تعمل

1. عند تخزين ذاكرة، يُرسل نصها إلى نموذج embedding
2. يُخزَّن المتجه الناتج مع النص الأصلي
3. أثناء الاسترجاع، يُضمَّن السياق الحالي ويُقارَن مع المتجهات المخزنة
4. تُعاد أعلى K ذكريات من حيث التشابه

## الإعدادات

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
top_k = 10
similarity_threshold = 0.5

[memory.embeddings.store]
type = "sqlite-vec"  # or "pgvector"
path = "~/.local/share/openprx/embeddings.db"
```

## مزودو Embedding المدعومون

| Provider | Model | Dimensions |
|----------|-------|-----------|
| Ollama | nomic-embed-text | 768 |
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |

## صفحات ذات صلة

- [نظرة عامة على نظام الذاكرة](./)
- [واجهة SQLite](./sqlite)
- [نظافة الذاكرة](./hygiene)

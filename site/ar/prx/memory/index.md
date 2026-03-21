---
title: نظام الذاكرة
description: نظرة عامة على نظام ذاكرة PRX مع 5 واجهات تخزين لحفظ سياق الوكيل بشكل دائم.
---

# نظام الذاكرة

يوفّر PRX نظام ذاكرة مرنًا يسمح للوكلاء بحفظ السياق واسترجاعه عبر المحادثات. يدعم نظام الذاكرة 5 واجهات تخزين، كل واحدة منها محسّنة لسيناريوهات نشر مختلفة.

## نظرة عامة

يخدم نظام الذاكرة ثلاث وظائف أساسية:

- **Recall** -- استرجاع التفاعلات والحقائق السابقة ذات الصلة قبل كل استدعاء LLM
- **Store** -- حفظ المعلومات المهمة المستخرجة من المحادثات
- **Compact** -- تلخيص وضغط الذكريات القديمة لتناسب حدود السياق

## واجهات التخزين

| Backend | Persistence | Search | Best For |
|---------|------------|--------|----------|
| [Markdown](./markdown) | قائم على الملفات | Full-text grep | CLI لمستخدم واحد، وذاكرة تحت التحكم بالإصدارات |
| [SQLite](./sqlite) | قاعدة بيانات محلية | FTS5 full-text | نشر محلي، فرق صغيرة |
| [PostgreSQL](./postgres) | قاعدة بيانات بعيدة | pg_trgm + FTS | نشر خوادم متعدد المستخدمين |
| [Embeddings](./embeddings) | مخزن متجهات | Semantic similarity | استرجاع بأسلوب RAG، قواعد معرفة كبيرة |
| In-memory | لا يوجد (الجلسة فقط) | Linear scan | جلسات مؤقتة، الاختبار |

## الإعدادات

اختر واجهة الذاكرة واضبطها في `config.toml`:

```toml
[memory]
backend = "sqlite"  # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
max_recall_items = 20
recall_relevance_threshold = 0.3

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"

[memory.postgres]
url = "postgresql://user:pass@localhost/prx"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
```

## دورة حياة الذاكرة

1. **Extraction** -- بعد كل دور في المحادثة، يستخرج النظام الحقائق الأساسية
2. **Deduplication** -- تُقارَن الحقائق الجديدة بالذكريات الموجودة
3. **Storage** -- تُحفَظ الحقائق الفريدة في الواجهة المُعدّة
4. **Recall** -- قبل كل استدعاء LLM، تُسترجَع الذكريات ذات الصلة
5. **Hygiene** -- صيانة دورية لضغط الإدخالات القديمة وتشذيبها

## صفحات ذات صلة

- [واجهة Markdown](./markdown)
- [واجهة SQLite](./sqlite)
- [واجهة PostgreSQL](./postgres)
- [واجهة Embeddings](./embeddings)
- [نظافة الذاكرة](./hygiene)

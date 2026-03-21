---
title: أدوات الذاكرة
description: خمس أدوات لتخزين واسترجاع والبحث وإدارة ذاكرة الوكيل طويلة الأمد مع دعم الفئات وتطبيق ACL.
---

# أدوات الذاكرة

يوفّر PRX خمس أدوات للذاكرة تمنح الوكيل القدرة على الاحتفاظ بالمعرفة عبر المحادثات، واسترجاع السياق ذي الصلة، وإدارة مخزن ذاكرة طويل الأمد. تسد هذه الأدوات الفجوة بين نافذة سياق LLM المؤقتة والمعرفة المستمرة للوكيل.

يدعم نظام الذاكرة ثلاث فئات مدمجة: `core` (حقائق دائمة)، و`daily` (ملاحظات على مستوى الجلسة)، و`conversation` (سياق المحادثة)، بالإضافة إلى فئات مخصصة يحددها المستخدم. جميع الأدوات واعية بـ ACL: عند تفعيل التحكم في الوصول للذاكرة، تُقيَّد العمليات وفق قواعد الوصول لكل principal.

تُسجَّل أدوات الذاكرة ضمن سجل `all_tools()` وتكون متاحة دائمًا عند تشغيل مجموعة الأدوات الكاملة. وهي تعمل مع أي من خمس واجهات تخزين: Markdown أو SQLite أو PostgreSQL أو Embeddings أو الذاكرة داخلية.

## الإعداد

تُضبط أدوات الذاكرة عبر قسم `[memory]`:

```toml
[memory]
enabled = true

# Storage backend: markdown | sqlite | postgres | embeddings | in_memory
backend = "markdown"

# Base directory for markdown backend
path = "~/.local/share/openprx/memory"

# Hygiene / retention
hygiene_enabled = true
archive_after_days = 30
conversation_retention_days = 7

# Access control
acl_enabled = false

# Search tuning (for memory_search)
vector_weight = 0.6
keyword_weight = 0.4
min_relevance_score = 0.2
```

## مرجع الأدوات

### memory_store

تُخزّن حقيقة أو تفضيلًا أو ملاحظة أو معرفة في الذاكرة طويلة الأمد.

```json
{
  "name": "memory_store",
  "arguments": {
    "key": "user_timezone",
    "value": "Asia/Shanghai",
    "category": "core"
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `key` | `string` | نعم | -- | معرّف فريد لإدخال الذاكرة |
| `value` | `string` | نعم | -- | المحتوى المراد تخزينه |
| `category` | `string` | لا | `"core"` | الفئة: `"core"` أو `"daily"` أو `"conversation"` أو فئة مخصصة |

**الفئات:**

| الفئة | الاحتفاظ | الغرض |
|----------|-----------|---------|
| `core` | دائم (حتى يتم نسيانه صراحةً) | حقائق أساسية، تفضيلات المستخدم، إعدادات النظام |
| `daily` | على مستوى الجلسة، ويُؤرشف بعد `archive_after_days` | مهام اليوم، سياق العمل، ملاحظات الجلسة |
| `conversation` | قصير العمر، ويُقلَّم بعد `conversation_retention_days` | سياق الدردشة الحالي، المراجع |
| مخصص | يتبع قواعد احتفاظ `daily` | فئات يعرّفها المستخدم لمعارف مجال محدد |

### memory_forget

تحذف إدخالًا محددًا من الذاكرة طويلة الأمد باستخدام المفتاح.

```json
{
  "name": "memory_forget",
  "arguments": {
    "key": "temporary_project_note"
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `key` | `string` | نعم | -- | مفتاح إدخال الذاكرة المراد حذفه |

### memory_get

تسترجع إدخال ذاكرة محددًا بالمفتاح المطابق تمامًا. تراعي ACL عند التفعيل.

```json
{
  "name": "memory_get",
  "arguments": {
    "key": "user_timezone"
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `key` | `string` | نعم | -- | المفتاح الدقيق المراد البحث عنه |

تعيد القيمة المخزنة إذا وُجدت، أو خطأ إذا لم يوجد المفتاح أو رُفض الوصول بسبب ACL.

### memory_recall

تسترجع الذكريات بالكلمات المفتاحية أو التشابه الدلالي، وتعيد أكثر الإدخالات صلة بالاستعلام. هذه الأداة **معطلة بالكامل** عندما `memory.acl_enabled = true` إذ تُزال من سجل الأدوات.

```json
{
  "name": "memory_recall",
  "arguments": {
    "query": "user preferences for report format",
    "max_results": 10
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `query` | `string` | نعم | -- | استعلام البحث (كلمات مفتاحية أو لغة طبيعية) |
| `max_results` | `integer` | لا | `20` | الحد الأقصى لعدد الإدخالات المعادة |

### memory_search

بحث نصي كامل ومتجهي عبر جميع إدخالات الذاكرة. بخلاف `memory_recall`، تبقى هذه الأداة متاحة عند تفعيل ACL لكنها تفرض قيود الوصول لكل principal على النتائج.

```json
{
  "name": "memory_search",
  "arguments": {
    "query": "deployment checklist",
    "category": "daily",
    "max_results": 15
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `query` | `string` | نعم | -- | استعلام البحث |
| `category` | `string` | لا | -- | تصفية النتائج إلى فئة محددة |
| `max_results` | `integer` | لا | `20` | الحد الأقصى لعدد الإدخالات المعادة |

عند إعداد البحث بالتضمينات، ينفذ `memory_search` بحثًا هجينًا يجمع بين:

- **تشابه المتجهات** (بوزن `vector_weight`) للمطابقة الدلالية.
- **بحث كلمات BM25** (بوزن `keyword_weight`) للمطابقة النصية التقليدية.

تتم تصفية النتائج الأقل من `min_relevance_score`.

## الاستخدام

### سير عمل الذاكرة المعتاد

أثناء المحادثة يستخدم الوكيل أدوات الذاكرة ضمن دورة طبيعية:

1. **استرجاع عند البداية**: قبل الرد، يسترجع النظام الذكريات ذات الصلة لحقن السياق.
2. **تخزين أثناء المحادثة**: عند مشاركة المستخدم معلومات مهمة، يخزنها الوكيل.
3. **بحث عند الحاجة**: عندما يحتاج الوكيل معرفة سابقة محددة، يبحث في الذاكرة.
4. **نسيان عند الطلب**: عند طلب المستخدم حذف معلومات، يقوم الوكيل بنسيانها.

### التفاعل عبر CLI

يمكن فحص حالة الذاكرة من سطر الأوامر:

```bash
# List all memory entries
prx memory list

# Search memory
prx memory search "deployment checklist"

# Show a specific key
prx memory get user_timezone

# Forget an entry
prx memory forget temporary_project_note
```

### مثال استخدام داخل الوكيل

في محادثة متعددة الأدوار:

```
User: I prefer reports in Markdown with bullet points.
Agent:
  1. [memory_store] key="report_format", value="Markdown with bullet points", category="core"
  2. "Understood. I'll format future reports in Markdown bullets."

... later ...

User: Generate today's summary.
Agent:
  1. [memory_get] key="report_format"
  2. [formats response in Markdown with bullet points]
```

## الأمان

### تطبيق ACL

عندما `memory.acl_enabled = true` يطبق نظام الذاكرة التحكم في الوصول:

| الأداة | سلوك ACL |
|------|---------------|
| `memory_store` | يخزن الإدخالات بملكية principal الحالي |
| `memory_forget` | يسمح بحذف الإدخالات المملوكة للـ principal الحالي فقط |
| `memory_get` | يعيد فقط الإدخالات التي يملك principal الحالي صلاحية الوصول إليها |
| `memory_recall` | **معطلة بالكامل** (تزال من سجل الأدوات) |
| `memory_search` | يعيد فقط الإدخالات التي يملك principal الحالي صلاحية الوصول إليها |

تُعطل أداة `memory_recall` تحت ACL لأن مطابقتها الواسعة بالكلمات المفتاحية قد تُسرّب معلومات عبر حدود الـ principal. أما `memory_get` و`memory_search` فيطبّقان فحوص وصول لكل إدخال.

### التفاعل مع file_read

عند تفعيل ACL، تمنع أداة `file_read` أيضًا الوصول إلى ملفات تخزين الذاكرة (ملفات markdown داخل دليل الذاكرة). هذا يمنع الوكيل من تجاوز ACL عبر قراءة ملفات الذاكرة الخام مباشرة من القرص.

### التعامل مع البيانات الحساسة

قد تحتوي إدخالات الذاكرة على معلومات مستخدم حساسة. يُنصح بالممارسات التالية:

- استخدم فئة `core` بحذر للمعرفة الدائمة فعلًا.
- فعّل `hygiene_enabled` لتنظيف الإدخالات القديمة تلقائيًا.
- فعّل `acl_enabled` في النشرات متعددة المستخدمين.
- راجع محتوى الذاكرة دوريًا عبر `prx memory list`.
- استخدم `memory_forget` لحذف الإدخالات الحساسة عند عدم الحاجة.

### سجل التدقيق

تُسجل جميع عمليات الذاكرة في سجل التدقيق عند `security.audit.enabled = true`، بما في ذلك اسم الأداة والمفتاح والفئة وحالة النجاح/الفشل.

## مرتبط

- [نظام الذاكرة](/ar/prx/memory/) -- المعمارية وواجهات التخزين
- [واجهة Markdown](/ar/prx/memory/markdown) -- تخزين ذاكرة قائم على الملفات
- [واجهة SQLite](/ar/prx/memory/sqlite) -- تخزين قاعدة بيانات محلية
- [واجهة PostgreSQL](/ar/prx/memory/postgres) -- تخزين قاعدة بيانات بعيدة
- [Embeddings](/ar/prx/memory/embeddings) -- إعداد البحث المتجهي
- [Memory Hygiene](/ar/prx/memory/hygiene) -- التنظيف والأرشفة التلقائية
- [عمليات الملفات](/ar/prx/tools/file-operations) -- تفاعل ACL مع `file_read`
- [نظرة عامة على الأدوات](/ar/prx/tools/) -- جميع الأدوات ونظام التسجيل

---
title: عمليات الملفات
description: توفّر أداتا file_read وfile_write وصولًا لنظام الملفات مع التحقق من المسارات، وتطبيق ACL للذاكرة، والتكامل مع سياسات الأمان.
---

# عمليات الملفات

يوفّر PRX أداتي عمليات ملفات أساسيتين: `file_read` و`file_write` ضمن مجموعة `default_tools()` الدنيا. هاتان الأداتان متاحتان دائمًا، ولا تتطلبان إعدادًا إضافيًا، وتمثلان أساس قدرة الوكيل على التفاعل مع نظام الملفات المحلي.

تخضع الأداتان لمحرك سياسات الأمان. ويضمن التحقق من المسار أن الوكيل لا يصل إلا إلى الملفات داخل الأدلة المسموح بها. وعند تفعيل ACL للذاكرة، تمنع `file_read` أيضًا الوصول إلى ملفات markdown الخاصة بالذاكرة لمنع تجاوز التحكم بالوصول عبر قراءة تخزين الذاكرة مباشرة.

وعلى عكس أداة `shell`، لا تُنشئ عمليات الملفات عمليات خارجية. إذ تُنفَّذ كعمليات Rust I/O مباشرة داخل عملية PRX، ما يجعلها أسرع وأسهل تدقيقًا من أوامر shell المكافئة مثل `cat` أو `echo >`.

## الإعداد

لا تمتلك عمليات الملفات قسم إعدادات مخصصًا. ويتحكم في سلوكها محرك سياسات الأمان وإعدادات ACL للذاكرة:

```toml
# Memory ACL affects file_read behavior
[memory]
acl_enabled = false    # When true, file_read blocks access to memory files

# Security policy can restrict file access paths
[security.tool_policy.tools]
file_read = "allow"    # "allow" | "deny" | "supervised"
file_write = "allow"

# Path-based policy rules
[[security.policy.rules]]
name = "allow-workspace-read"
action = "allow"
tools = ["file_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "allow-workspace-write"
action = "allow"
tools = ["file_write"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-paths"
action = "deny"
tools = ["file_read", "file_write"]
paths = ["/etc/shadow", "/root/**", "**/.ssh/**", "**/.env"]
```

## الاستخدام

### file_read

تقرأ أداة `file_read` محتوى الملف وتعيده كسلسلة نصية. وهي الطريقة الأساسية التي يستخدمها الوكيل لفحص الملفات أثناء حلقة الاستدلال.

```json
{
  "name": "file_read",
  "arguments": {
    "path": "/home/user/project/src/main.rs"
  }
}
```

يستخدم الوكيل `file_read` عادةً من أجل:

- فحص الشيفرة المصدرية قبل إجراء تعديلات
- قراءة ملفات الإعداد لفهم حالة النظام
- التحقق من ملفات السجل للبحث عن رسائل الأخطاء
- مراجعة ملفات التوثيق أو README

### file_write

تكتب أداة `file_write` محتوى في ملف، مع إنشائه إذا لم يكن موجودًا أو استبدال محتواه إن كان موجودًا.

```json
{
  "name": "file_write",
  "arguments": {
    "path": "/home/user/project/src/config.toml",
    "content": "[server]\nport = 8080\nhost = \"0.0.0.0\"\n"
  }
}
```

يستخدم الوكيل `file_write` عادةً من أجل:

- إنشاء ملفات مصدر جديدة أو ملفات إعداد
- تعديل الملفات الموجودة (بعد قراءتها بـ `file_read`)
- كتابة تقارير أو ملخصات مولّدة
- حفظ البيانات المعالجة على القرص

## المعاملات

### معاملات file_read

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | -- | مسار مطلق أو نسبي للملف المراد قراءته |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` إذا تمت قراءة الملف بنجاح |
| `output` | `string` | محتوى الملف كسلسلة UTF-8 |
| `error` | `string?` | رسالة خطأ إذا فشلت القراءة (الملف غير موجود، رفض صلاحية، حظر ACL، إلخ) |

### معاملات file_write

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | -- | مسار مطلق أو نسبي للملف المراد الكتابة إليه |
| `content` | `string` | Yes | -- | المحتوى المراد كتابته في الملف |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` إذا تمت كتابة الملف بنجاح |
| `output` | `string` | رسالة تأكيد (مثل: `"File written: /path/to/file"`) |
| `error` | `string?` | رسالة خطأ إذا فشلت الكتابة (رفض صلاحية، حظر مسار، إلخ) |

## التحقق من المسارات

تُجري الأداتان التحقق من المسار قبل تنفيذ عملية I/O:

1. **تطبيع المسار**: تُحل المسارات النسبية مقابل دليل العمل الحالي. وتُحل الروابط الرمزية لاكتشاف اجتياز المسار.
2. **فحص السياسة**: يُفحص المسار المحلول مقابل قواعد سياسة الأمان. إذا لم تسمح أي قاعدة بالمسار صراحة وكان الإجراء الافتراضي `deny`، تُحظر العملية.
3. **حظر مسارات خاصة**: بعض المسارات محظورة دائمًا بغض النظر عن السياسة:
   - `/proc/`, `/sys/` (واجهات نواة Linux)
   - ملفات الأجهزة في `/dev/` (باستثناء `/dev/null`, `/dev/urandom`)
   - ملفات تخزين الذاكرة عندما `memory.acl_enabled = true`

### منع اجتياز المسار

تقوم الأدوات بحل الروابط الرمزية وتطبيع مكونات `..` قبل فحص السياسات. وهذا يمنع المهاجم من استخدام حيل الروابط الرمزية أو المسارات النسبية للهروب من الأدلة المسموح بها:

```
# These are all resolved and checked:
/home/user/workspace/../../../etc/passwd  →  /etc/passwd  →  DENIED
/home/user/workspace/link-to-etc          →  /etc/        →  DENIED (if symlink)
```

## تطبيق ACL للذاكرة

عند ضبط `memory.acl_enabled = true` في الإعدادات، تطبّق أداة `file_read` قيودًا إضافية:

- **حظر ملفات الذاكرة**: ترفض `file_read` قراءة ملفات markdown المخزنة في دليل الذاكرة (عادةً `~/.local/share/openprx/memory/`). هذا يمنع الوكيل من تجاوز التحكم بالوصول إلى الذاكرة عبر قراءة ملفات التخزين الخام.
- **تعطيل memory_recall**: تُزال أداة `memory_recall` بالكامل من سجل الأدوات عند تفعيل ACL.
- **وصول موجّه فقط**: يجب على الوكيل استخدام `memory_get` أو `memory_search` مع فحوص ACL الصحيحة للوصول إلى محتوى الذاكرة.

```toml
[memory]
acl_enabled = true    # Activates file_read restrictions on memory paths
```

يضمن هذا الفصل أنه حتى لو عرف الوكيل الموقع الفعلي لملفات الذاكرة، فلن يتمكن من قراءتها خارج واجهة API المضبوطة للذاكرة.

## الأمان

### التكامل مع محرك السياسات

تمر كل استدعاءات `file_read` و`file_write` عبر محرك سياسات الأمان قبل التنفيذ. ويقيّم محرك السياسات القواعد بالترتيب:

1. سياسة خاصة بالأداة (`security.tool_policy.tools.file_read`)
2. قواعد قائمة على المسار (`security.policy.rules` مع أنماط `paths` المطابقة)
3. الإجراء الافتراضي (`security.policy.default_action`)

### سجلات التدقيق

عند تفعيل تسجيل التدقيق، تُسجَّل كل عملية ملفات مع:

- الطابع الزمني
- اسم الأداة (`file_read` أو `file_write`)
- مسار الملف بعد الحل
- حالة النجاح/الفشل
- سبب الخطأ (إذا تم الرفض أو الفشل)

```toml
[security.audit]
enabled = true
log_path = "audit.log"
```

### حماية الملفات الحساسة

تحظر سياسة الأمان الافتراضية الوصول إلى مسارات حساسة شائعة:

- مفاتيح SSH (`~/.ssh/`)
- ملفات البيئة (`.env`, `.env.local`)
- بيانات اعتماد Git (`.git-credentials`)
- سجل shell (`.bash_history`, `.zsh_history`)
- ملفات كلمات مرور النظام (`/etc/shadow`)

يمكن تجاوز هذه الافتراضيات بقواعد سماح صريحة، لكن يُنصح بشدة بعدم ذلك في بيئات الإنتاج.

### التعامل مع الملفات الثنائية

تقرأ أداة `file_read` الملفات كسلاسل UTF-8. وقد تنتج الملفات الثنائية مخرجات مشوهة أو أخطاء ترميز. ومن المتوقع أن يستخدم الوكيل أداة `shell` مع أوامر مناسبة (مثل `xxd`, `file`, `hexdump`) لفحص الملفات الثنائية.

## مرتبط

- [Shell Execution](/ar/prx/tools/shell) -- أداة تنفيذ الأوامر (بديل لفحص الملفات الثنائية)
- [Memory Tools](/ar/prx/tools/memory) -- وصول مضبوط إلى الذاكرة مع ACL
- [Policy Engine](/ar/prx/security/policy-engine) -- قواعد التحكم بالوصول المعتمدة على المسار
- [Configuration Reference](/ar/prx/config/reference) -- إعدادات الذاكرة والأمان
- [Tools Overview](/ar/prx/tools/) -- جميع الأدوات ونظام السجل

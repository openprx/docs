---
title: عمليات Git
description: أداة تحكم بالإصدارات تدعم عمليات status وdiff وcommit وpush وpull وlog وbranch على مستودعات مساحة العمل.
---

# عمليات Git

توفّر أداة `git_operations` لوكلاء PRX قدرات التحكم بالإصدارات عبر واجهة موحّدة. بدلًا من مطالبة الوكيل باستدعاء أوامر `git` عبر أداة shell (والتي تخضع لقيود sandbox)، تقدّم `git_operations` واجهة API منظّمة وآمنة لأكثر تدفقات Git شيوعًا: فحص الحالة، وعرض الفروقات، وإنشاء commits، وpush، وpull، وعرض السجل، وإدارة الفروع.

تعمل الأداة على مستودع مساحة العمل، والذي يكون عادة دليل المشروع الذي يعمل فيه الوكيل. وهي مسجّلة في سجل `all_tools()` ومتاحة دائمًا عندما يعمل الوكيل بمجموعة الأدوات الكاملة.

من خلال تقديم Git كأداة من الدرجة الأولى بدلًا من أمر shell، يستطيع PRX تطبيق سياسات أمان دقيقة، والتحقق من المعاملات، وإنتاج مخرجات منظّمة يمكن لنموذج LLM تحليلها بثبات.

## الإعداد

لا تمتلك أداة `git_operations` قسم إعدادات مخصصًا. ويتحكم في سلوكها مسار مساحة العمل وسياسة الأمان:

```toml
# Tool policy for git operations
[security.tool_policy.tools]
git_operations = "allow"    # "allow" | "deny" | "supervised"
```

يُحدَّد مستودع مساحة العمل بواسطة دليل العمل الحالي لجلسة الوكيل. إذا أُطلق الوكيل من داخل مستودع Git فسيُستخدم هذا المستودع. وإلا تُعيد الأداة خطأ يفيد بعدم العثور على مستودع.

## الاستخدام

تقبل أداة `git_operations` معامل `operation` الذي يحدد إجراء Git المطلوب:

### status

التحقق من حالة المستودع الحالية (ملفات staged وunstaged وuntracked):

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "status"
  }
}
```

تعيد مخرجات منظّمة توضح:
- اسم الفرع الحالي
- الملفات المضافة للـ commit
- الملفات المعدلة غير المضافة
- الملفات غير المتتبعة
- حالة التتبع مع upstream

### diff

عرض التغييرات في شجرة العمل أو بين commits:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["--staged"]
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "diff",
    "args": ["HEAD~3..HEAD"]
  }
}
```

### commit

إنشاء commit مع رسالة:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "fix: resolve race condition in session cleanup"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "commit",
    "message": "feat: add web search provider selection",
    "args": ["--all"]
  }
}
```

### push

دفع commits إلى المستودع البعيد:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "push",
    "args": ["origin", "feature/web-search"]
  }
}
```

### pull

سحب التغييرات من المستودع البعيد:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "pull"
  }
}
```

### log

عرض سجل commits:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "log",
    "args": ["--oneline", "-20"]
  }
}
```

### branch

سرد الفروع أو إنشاؤها أو التبديل بينها:

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch"
  }
}
```

```json
{
  "name": "git_operations",
  "arguments": {
    "operation": "branch",
    "args": ["feature/new-tool"]
  }
}
```

## المعاملات

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation` | `string` | Yes | -- | عملية Git: `"status"`, `"diff"`, `"commit"`, `"push"`, `"pull"`, `"log"`, `"branch"` |
| `message` | `string` | Conditional | -- | رسالة commit (مطلوبة لعملية `"commit"`) |
| `args` | `array` | No | `[]` | معاملات إضافية تُمرّر إلى أمر Git |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` إذا اكتملت عملية Git بنجاح |
| `output` | `string` | مخرجات أمر Git (نص الحالة، محتوى diff، عناصر log، إلخ) |
| `error` | `string?` | رسالة خطأ إذا فشلت العملية |

## تدفقات شائعة

### تدفق فرع ميزة

تدفق نموذجي لفرع ميزة يقوده الوكيل:

```
1. [git_operations] operation="branch", args=["feature/add-search"]
2. [file_write] write new files
3. [git_operations] operation="status"  -- verify changes
4. [git_operations] operation="diff"    -- review changes
5. [git_operations] operation="commit", message="feat: add search functionality", args=["--all"]
6. [git_operations] operation="push", args=["-u", "origin", "feature/add-search"]
```

### التحضير لمراجعة الكود

فحص التغييرات قبل عمل commit:

```
1. [git_operations] operation="status"
2. [git_operations] operation="diff", args=["--staged"]
3. [git_operations] operation="log", args=["--oneline", "-5"]
4. Agent reviews the diff and suggests improvements
```

### حل التعارضات

التحقق من تعارضات الدمج وحلها:

```
1. [git_operations] operation="pull"
2. If conflicts: [git_operations] operation="status"
3. [file_read] read conflicted files
4. [file_write] resolve conflicts
5. [git_operations] operation="commit", message="merge: resolve conflicts in config.toml"
```

## الأمان

### مقارنةً بـ Shell

يوفر استخدام `git_operations` بدل تشغيل `git` عبر أداة `shell` عدة مزايا أمنية:

- **التحقق من المعاملات**: يتم التحقق من المعاملات قبل التنفيذ لمنع هجمات الحقن
- **مخرجات منظّمة**: تُحلل النتائج وتُعاد بصيغة متوقعة
- **بدون توسيع shell**: تُمرّر المعاملات مباشرة إلى Git دون تفسير shell
- **سياسات دقيقة**: يمكن السماح لـ `git_operations` مع رفض `shell` أو جعله تحت إشراف

### الحماية من العمليات المدمرة

تتضمن الأداة وسائل حماية ضد العمليات المدمرة الشائعة:

- **Force push**: يتم تسجيل معاملات `--force` و`--force-with-lease` مع تحذيرات
- **حذف الفروع**: تُعلَّم عمليات `-D` (حذف إجباري) في سجل التدقيق
- **عمليات reset**: إعادة الضبط الصلبة غير مكشوفة مباشرة عبر الأداة

لأقصى درجات الأمان، اجعل `git_operations` تحت الإشراف:

```toml
[security.tool_policy.tools]
git_operations = "supervised"
```

### التعامل مع بيانات الاعتماد

تستخدم أداة `git_operations` تخزين بيانات الاعتماد الخاص بـ Git في النظام (credential helper، مفاتيح SSH، إلخ). ولا تقوم بكشف بيانات الاعتماد أو تسجيلها. تعتمد العمليات البعيدة (push, pull) على بيانات اعتماد Git المهيأة مسبقًا على المضيف.

### سجلات التدقيق

تُسجَّل جميع عمليات Git في سجل التدقيق عند التفعيل:

- نوع العملية (status، commit، push، إلخ)
- المعاملات
- حالة النجاح/الفشل
- SHA الخاص بالـ commit (لعمليات commit)

## مرتبط

- [Shell Execution](/ar/prx/tools/shell) -- بديل لأوامر Git المتقدمة
- [File Operations](/ar/prx/tools/file-operations) -- قراءة/كتابة ملفات داخل المستودع
- [Sessions & Agents](/ar/prx/tools/sessions) -- تفويض مهام Git إلى وكلاء متخصصين
- [Policy Engine](/ar/prx/security/policy-engine) -- التحكم بالوصول لعمليات Git
- [Tools Overview](/ar/prx/tools/) -- جميع الأدوات ونظام السجل

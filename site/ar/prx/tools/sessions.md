---
title: الجلسات والوكلاء
description: أدوات تنسيق متعددة الوكلاء لإنشاء وكلاء فرعيين، وتفويض المهام، وإدارة الجلسات المتزامنة في PRX.
---

# الجلسات والوكلاء

يوفّر PRX ثماني أدوات لتنسيق العمل متعدد الوكلاء، بما يسمح للوكيل الأب بإنشاء وكلاء أبناء، وتفويض المهام إلى وكلاء متخصصين، وإدارة جلسات متزامنة. هذا هو أساس معمارية تفكيك المهام المتوازية في PRX، حيث تُقسَّم المهام المعقدة إلى مهام فرعية تتولاها مثيلات مستقلة من الوكلاء.

أدوات الجلسات (`sessions_spawn` و`sessions_send` و`sessions_list` و`sessions_history` و`session_status` و`subagents`) تدير دورة حياة جلسات الوكلاء الفرعيين. أمّا أدوات التفويض (`delegate` و`agents_list`) فتمكّن من توجيه المهام إلى وكلاء مُسمّين لديهم مزوّد ونموذج وإعداد أدوات خاص.

تُسجَّل أدوات الجلسات ضمن سجل `all_tools()` وتكون متاحة دائمًا. بينما تُسجَّل أداتا `delegate` و`agents_list` بشكل شرطي فقط عند وجود تعريفات وكلاء في الإعداد.

## الإعداد

### تزامن الوكلاء الفرعيين

```toml
[agent.subagents]
max_concurrent = 4          # Maximum simultaneous sub-agents
max_depth = 3               # Maximum nesting depth (sub-agents spawning sub-agents)
max_total_spawns = 20       # Total spawn budget per root session
child_timeout_secs = 300    # Timeout for individual child execution
```

### تعريفات وكلاء التفويض

يتم تعريف الوكلاء المُسمّين ضمن أقسام `[agents.*]`:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant. Find accurate, up-to-date information."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]

[agents.coder]
provider = "openai"
model = "gpt-4o"
system_prompt = "You are a code generation specialist. Write clean, well-tested code."
agentic = true
max_iterations = 15
allowed_tools = ["shell", "file_read", "file_write", "git_operations"]

[agents.reviewer]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a code reviewer. Focus on correctness, security, and style."
agentic = true
max_iterations = 5
allowed_tools = ["file_read", "shell"]
```

## مرجع الأدوات

### sessions_spawn

ينشئ وكيلًا فرعيًا غير متزامن يعمل في الخلفية. يعيد فورًا معرّف تشغيل (run ID)، ويُخطر الوكيل الأب تلقائيًا عند اكتمال التنفيذ.

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Research the latest Rust async runtime benchmarks and summarize the findings.",
    "action": "spawn"
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `task` | `string` | نعم | -- | وصف المهمة / موجه النظام للوكيل الفرعي |
| `action` | `string` | لا | `"spawn"` | الإجراء: `"spawn"` أو `"history"` (عرض السجل) أو `"steer"` (إعادة التوجيه) |
| `allowed_tools` | `array` | لا | أدوات الأب | مجموعة فرعية من الأدوات المتاحة للوكيل الفرعي |

### sessions_send

يرسل رسالة إلى جلسة وكيل فرعي قيد التشغيل، مما يتيح التواصل التفاعلي بين الأب والابن.

```json
{
  "name": "sessions_send",
  "arguments": {
    "session_id": "run_abc123",
    "message": "Focus on performance comparisons, not API differences."
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | نعم | -- | معرّف التشغيل للجلسة الهدف |
| `message` | `string` | نعم | -- | الرسالة المراد إرسالها للوكيل الفرعي |

### sessions_list

تعرض جميع جلسات الوكلاء الفرعيين النشطة مع الحالة ووصف المهمة والزمن المنقضي.

```json
{
  "name": "sessions_list",
  "arguments": {}
}
```

لا توجد معاملات مطلوبة. تعيد قائمة الجلسات النشطة.

### sessions_history

تعرض سجل محادثة تشغيل وكيل فرعي، بما في ذلك جميع استدعاءات الأدوات واستجابات LLM.

```json
{
  "name": "sessions_history",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | نعم | -- | معرّف التشغيل المراد جلب تاريخه |

### session_status

تفحص حالة جلسة محددة (قيد التشغيل، مكتملة، فاشلة، تجاوزت المهلة).

```json
{
  "name": "session_status",
  "arguments": {
    "session_id": "run_abc123"
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `session_id` | `string` | نعم | -- | معرّف التشغيل المراد فحصه |

### subagents

تدير مجموعة الوكلاء الفرعيين: عرض، إيقاف، أو فحص الوكلاء الجاري تشغيلهم.

```json
{
  "name": "subagents",
  "arguments": {
    "action": "list"
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `action` | `string` | نعم | -- | الإجراء: `"list"` أو `"stop"` أو `"inspect"` |
| `session_id` | `string` | مشروط | -- | مطلوب لإجرائي `"stop"` و`"inspect"` |

### agents_list

تعرض جميع وكلاء التفويض المُهيّئين مع نماذجهم وقدراتهم وأدواتهم المسموح بها. تُسجّل فقط عندما تكون أقسام `[agents.*]` معرفة.

```json
{
  "name": "agents_list",
  "arguments": {}
}
```

لا توجد معاملات مطلوبة. تعيد تعريفات الوكلاء من الإعداد.

### delegate

تفوض مهمة إلى وكيل مُسمّى يمتلك مزودًا ونموذجًا ومجموعة أدوات خاصة به. يعمل وكيل التفويض ضمن حلقة وكيلية معزولة ويعيد النتيجة.

```json
{
  "name": "delegate",
  "arguments": {
    "agent": "researcher",
    "task": "Find the top 5 Rust web frameworks by GitHub stars in 2026."
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `agent` | `string` | نعم | -- | اسم الوكيل المُهيأ (من `[agents.*]`) |
| `task` | `string` | نعم | -- | وصف المهمة لوكيل التفويض |

## أنماط الاستخدام

### بحث متوازي

أنشئ عدة وكلاء فرعيين للبحث في موضوعات مختلفة بالتزامن:

```
Parent: I need a comparison of 3 database engines for our project.

  [sessions_spawn] task="Research PostgreSQL strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research SQLite strengths, weaknesses, and use cases"
  [sessions_spawn] task="Research DuckDB strengths, weaknesses, and use cases"

  [waits for all three to complete]
  [synthesizes results into a comparison table]
```

### مراجعة كود مفوضة

استخدم وكلاء تفويض متخصصين لمهام محددة:

```
Parent: Review this pull request for security issues.

  [delegate] agent="reviewer", task="Review the diff in /tmp/pr-42.patch for security vulnerabilities"

  [reviewer agent runs with file_read and shell tools]
  [returns detailed security review]
```

### تفكيك هرمي للمهام

يمكن للوكلاء الفرعيين إنشاء وكلاء فرعيين آخرين (حتى `max_depth`):

```
Parent Agent
  ├── Research Agent
  │     ├── Web Search Sub-agent
  │     └── Document Analysis Sub-agent
  ├── Code Generation Agent
  └── Testing Agent
```

## الأمان

### حدود العمق والتزامن

يفرض PRX حدودًا صارمة على إنشاء الوكلاء الفرعيين لمنع استنزاف الموارد:

- **max_concurrent**: يحد عدد الوكلاء الفرعيين العاملين بالتوازي (الافتراضي: 4).
- **max_depth**: يحد عمق التداخل (الافتراضي: 3). عند بلوغ الحد الأقصى، تُزال أداة `sessions_spawn` من الأدوات المتاحة للطفل.
- **max_total_spawns**: يحد العدد الكلي لعمليات الإنشاء لكل جلسة جذر (الافتراضي: 20).
- **child_timeout_secs**: ينهي الوكلاء الفرعيين الذين يتجاوزون المهلة (الافتراضي: 300 ثانية).

### قيود الأدوات

يرث الوكلاء الفرعيون سياسة العزل الخاصة بالأب، ويمكن تقييدهم بمجموعة أدوات أصغر:

```json
{
  "name": "sessions_spawn",
  "arguments": {
    "task": "Search the web for information",
    "allowed_tools": ["web_search_tool", "web_fetch"]
  }
}
```

أدوات وكلاء التفويض تُعرَّف صراحةً في الإعداد، ولا يمكنهم الوصول إلى أدوات خارج قائمة `allowed_tools`.

### عزل بيانات الاعتماد

يمكن لوكلاء التفويض استخدام مزودين ومفاتيح API مختلفة عن الوكيل الأب:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
# Uses the provider's configured API key
```

يسمح ذلك بتوجيه المهام إلى مزودات LLM مختلفة حسب متطلبات المهمة، مع بقاء بيانات اعتماد كل مزود معزولة.

### محرك السياسات

تخضع أدوات الجلسات والوكلاء لمحرك السياسات:

```toml
[security.tool_policy.groups]
sessions = "allow"

[security.tool_policy.tools]
delegate = "supervised"    # Require approval for delegation
```

## مرتبط

- [الوكلاء الفرعيون](/ar/prx/agent/subagents) -- معمارية الوكلاء الفرعيين ونموذج الإنشاء
- [بيئة تشغيل الوكيل](/ar/prx/agent/runtime) -- معمارية تنفيذ الوكيل
- [حلقة الوكيل](/ar/prx/agent/loop) -- دورة التنفيذ الأساسية
- [عامل الجلسة](/ar/prx/agent/session-worker) -- عزل العمليات للجلسات
- [مرجع الإعداد](/ar/prx/config/reference) -- إعدادات الوكلاء والوكلاء الفرعيين
- [نظرة عامة على الأدوات](/ar/prx/tools/) -- جميع الأدوات ونظام التسجيل

---
title: سير عمل الموافقة
description: كيف يتعامل PRX مع استدعاءات الأدوات الخاضعة للإشراف التي تتطلب موافقة بشرية قبل التنفيذ.
---

# سير عمل الموافقة

عندما تُضبط سياسة أمان الأداة على `"supervised"`، يوقف PRX التنفيذ مؤقتًا وينتظر موافقة بشرية قبل تشغيل استدعاء الأداة. يوفّر ذلك طبقة أمان حرجة للعمليات عالية الخطورة، مثل أوامر shell، وعمليات كتابة الملفات، وطلبات الشبكة، أو أي إجراء قد تكون له عواقب غير قابلة للعكس.

## نظرة عامة

يقع سير عمل الموافقة بين حلقة الوكيل وتنفيذ الأدوات:

```
Agent Loop
    │
    ├── LLM emits tool call: shell("rm -rf /tmp/data")
    │
    ▼
┌───────────────────────────────────┐
│        Policy Engine              │
│                                   │
│  Tool: "shell"                    │
│  Policy: "supervised"             │
│  Action: REQUIRE APPROVAL         │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│      Approval Request             │
│                                   │
│  Pending...                       │
│  ├── Notify supervisor            │
│  ├── Wait for response            │
│  └── Timeout after N seconds      │
└───────────────┬───────────────────┘
                │
         ┌──────┴──────┐
         │             │
    ┌────▼────┐   ┌────▼────┐
    │ Approved│   │ Denied  │
    │         │   │         │
    │ Execute │   │ Return  │
    │ tool    │   │ error   │
    └─────────┘   └─────────┘
```

## الإعداد

### ضبط سياسات الأدوات

اضبط الأدوات التي تتطلب موافقة في `config.toml`:

```toml
[security.tool_policy]
# Default policy for all tools.
# "allow" -- execute immediately
# "deny" -- block execution entirely
# "supervised" -- require approval before execution
default = "allow"

# Per-tool policy overrides.
[security.tool_policy.tools]
shell = "supervised"
file_write = "supervised"
http_request = "supervised"
git_operations = "allow"
memory_store = "allow"
browser = "deny"

# Group-level policies.
[security.tool_policy.groups]
sessions = "allow"
automation = "supervised"
```

### إعدادات الموافقة

```toml
[security.approval]
# How long to wait for a response before timing out (seconds).
timeout_secs = 300

# Action when approval times out: "deny" or "allow".
# "deny" is the safe default -- unanswered requests are rejected.
on_timeout = "deny"

# Notification channel for approval requests.
# The supervisor is notified through this channel.
notify_channel = "telegram"

# Supervisor user ID or identifier.
# Only this user can approve or deny requests.
supervisor_id = "admin"

# Auto-approve patterns: tool calls matching these patterns
# are approved automatically without human intervention.
# Use with caution.
[[security.approval.auto_approve]]
tool = "shell"
command_pattern = "^(ls|cat|head|tail|wc|grep|find|echo) "

[[security.approval.auto_approve]]
tool = "file_write"
path_pattern = "^/tmp/"
```

## تدفق الموافقة

### الخطوة 1: التحقق من السياسة

عندما يصدر الوكيل استدعاء أداة، تقوم محرك السياسات بتقييمه:

1. فحص سياسة الأداة المحددة (`security.tool_policy.tools.<name>`)
2. إذا لم توجد سياسة للأداة، فحص سياسة المجموعة (`security.tool_policy.groups.<group>`)
3. إذا لم توجد سياسة للمجموعة، استخدام السياسة الافتراضية (`security.tool_policy.default`)

إذا كانت السياسة النهائية هي `"supervised"`، يتم تشغيل تدفق الموافقة.

### الخطوة 2: التحقق من الموافقة التلقائية

قبل إخطار المشرف، يتحقق PRX مما إذا كان الطلب يطابق أي نمط `auto_approve`. تستخدم قواعد الموافقة التلقائية أنماط regex لمطابقة وسيطات الأداة:

| الحقل | الوصف |
|-------|-------|
| `tool` | اسم الأداة التي تنطبق عليها القاعدة |
| `command_pattern` | نمط Regex يُطابق أمر shell (لأداة `shell`) |
| `path_pattern` | نمط Regex يُطابق مسارات الملفات (لأداتي `file_write`, `file_read`) |
| `url_pattern` | نمط Regex يُطابق عناوين URL (لأداة `http_request`) |
| `args_pattern` | نمط Regex يُطابق وسيطات JSON كاملة |

إذا تم العثور على تطابق، يُوافق على الطلب تلقائيًا ويستمر التنفيذ فورًا. يفيد هذا مع الأوامر الآمنة للقراءة فقط التي قد تسبب إرهاقًا من كثرة طلبات الموافقة.

### الخطوة 3: الإشعار

إذا لم تُطابق أي قاعدة موافقة تلقائية، ينشئ PRX طلب موافقة ويخطر المشرف:

```
[APPROVAL REQUIRED]

Tool: shell
Arguments: {"command": "rm -rf /tmp/data"}
Session: abc-123
Agent: default
Time: 2026-03-21 14:30:22 UTC

Reply with:
  /approve -- execute the tool call
  /deny -- reject the tool call
  /deny reason: <explanation> -- reject with reason
```

يتم إرسال الإشعار عبر `notify_channel` المضبوطة. القنوات المدعومة:

| القناة | طريقة الإشعار |
|--------|---------------|
| Telegram | رسالة إلى دردشة المشرف |
| Discord | رسالة خاصة إلى المشرف |
| Slack | رسالة خاصة إلى المشرف |
| CLI | مطالبة في الطرفية (stdin) |
| Email | بريد إلكتروني إلى العنوان المضبوط |
| Webhook | طلب HTTP POST إلى عنوان URL المضبوط |

### الخطوة 4: الانتظار

تتوقف حلقة الوكيل مؤقتًا أثناء انتظار رد المشرف. خلال هذه الفترة:

- لا يمكن للوكيل تنفيذ أي أدوات (استدعاء الأداة الحالي يحجب التنفيذ)
- تستمر الجلسات الأخرى بالعمل بشكل مستقل
- يمتلك طلب الموافقة معرفًا فريدًا للتتبع

### الخطوة 5: الحسم

يرد المشرف بأحد الخيارات التالية:

| الاستجابة | التأثير |
|-----------|---------|
| **Approve** | يُنفذ استدعاء الأداة بشكل طبيعي وتُعاد النتيجة إلى الوكيل |
| **Deny** | يُرفض استدعاء الأداة وتُعاد رسالة خطأ إلى الوكيل |
| **Deny with reason** | مثل الرفض، لكن يُضمَّن السبب في رسالة الخطأ ليتمكن الوكيل من التكيف |
| **Timeout** | يُطبَّق إجراء `on_timeout` (الافتراضي: deny) |

## دورة حياة الطلب

ينتقل كل طلب موافقة عبر هذه الحالات:

```
PENDING → APPROVED → EXECUTED
       → DENIED
       → TIMED_OUT
       → CANCELLED (if the session ends before resolution)
```

| الحالة | الوصف |
|--------|-------|
| `PENDING` | انتظار رد المشرف |
| `APPROVED` | وافق المشرف، وجارٍ تنفيذ الأداة |
| `EXECUTED` | اكتمل تنفيذ الأداة بعد الموافقة |
| `DENIED` | رفض المشرف الطلب صراحةً |
| `TIMED_OUT` | لا يوجد رد خلال `timeout_secs` |
| `CANCELLED` | انتهت الجلسة قبل الحسم |

## واجهات الموافقة

في وضع CLI، تظهر طلبات الموافقة كمطالبات طرفية تفاعلية تتضمن اسم الأداة والوسيطات ومستوى المخاطر. وللوصول البرمجي، يوفّر PRX واجهة REST API:

```bash
# List pending requests / approve / deny
curl http://localhost:8080/api/approvals?status=pending
curl -X POST http://localhost:8080/api/approvals/{id}/approve
curl -X POST http://localhost:8080/api/approvals/{id}/deny \
  -d '{"reason": "Not permitted"}'
```

## مسار التدقيق

تُسجَّل جميع قرارات الموافقة في سجل النشاط مع الحقول: `request_id`, `tool`, `arguments`, `session_id`, `decision`, `decided_by`, `decided_at`, `reason`, و`execution_result`. يمكن الوصول إليها عبر `prx audit approvals --last 50` أو تصديرها باستخدام `--format json`.

## ملاحظات أمنية

- **الرفض الافتراضي عند انتهاء المهلة** -- اضبط دائمًا `on_timeout = "deny"` في الإنتاج. السماح للطلبات غير المُجاب عليها بالاستمرار يلغي هدف الإشراف.
- **استخدم الموافقة التلقائية بحذر** -- أنماط الموافقة التلقائية الواسعة بشكل مفرط قد تتجاوز سير عمل الموافقة. استخدم أنماط regex محددة وراجعها دوريًا.
- **مصادقة المشرف** -- تأكد من أن `notify_channel` تتحقق من هوية المشرف. قد تسمح قناة إشعارات مخترَقة بموافقات غير مصرح بها.
- **تحديد المعدل** -- إذا كان الوكيل يثير طلبات موافقة متكررة للعملية نفسها، ففكّر في تحديث السياسة إلى `"deny"` لتلك الأداة أو إضافة قاعدة موافقة تلقائية أكثر تحديدًا.
- **تعدد المشرفين** -- في بيئات الفرق، فكّر في ضبط عدة مشرفين. يمكن لأيٍّ منهم الموافقة أو الرفض.

## صفحات ذات صلة

- [نظرة عامة على الأمان](/ar/prx/security/)
- [محرك السياسات](/ar/prx/security/policy-engine)
- [Sandbox](/ar/prx/security/sandbox)
- [تسجيل التدقيق](/ar/prx/security/audit)
- [نظرة عامة على الأدوات](/ar/prx/tools/)

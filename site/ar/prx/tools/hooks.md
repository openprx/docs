---
title: Hooks
description: نظام توسعة قائم على الأحداث مع 8 أحداث دورة حياة، وتنفيذ shell hooks، واستدعاءات إضافات WASM، وإدارة عبر HTTP API، وتكامل event bus للملاحظة والأتمتة.
---

# Hooks

توفّر Hooks في PRX نظام توسعة قائمًا على الأحداث يتيح لك التفاعل مع أحداث دورة الحياة أثناء تنفيذ الوكيل. كل لحظة مهمة في حلقة الوكيل، مثل بدء الدور، أو استدعاء LLM، أو استدعاء أداة، أو حدوث خطأ، تُنتج حدث hook. ويمكنك إرفاق إجراءات بهذه الأحداث عبر ملف إعداد `hooks.json`، أو ملفات manifest لإضافات WASM، أو HTTP API.

صُممت Hooks بأسلوب **fire-and-forget**. فهي لا تحجب حلقة الوكيل، ولا تعدّل تدفق التنفيذ، ولا تعيد حقن بيانات إلى المحادثة. وهذا يجعلها مناسبة جدًا لسجلات التدقيق، وجمع المقاييس، والإشعارات الخارجية، وأتمتة الآثار الجانبية دون إدخال زمن انتظار أو أنماط فشل في خط الوكيل الأساسي.

هناك ثلاث واجهات خلفية لتنفيذ hooks:

- **Shell hooks** -- تشغيل أمر خارجي مع تمرير payload الحدث عبر متغير بيئة، أو ملف مؤقت، أو stdin. تُضبط في `hooks.json`.
- **WASM plugin hooks** -- استدعاء الدالة `on-event` المصدّرة من إضافة WASM. تُعرّف في manifest الإضافة `plugin.toml`.
- **Event bus hooks** -- نشر إلى ناقل الأحداث الداخلي على الموضوع `prx.lifecycle.<event>`. فعّالة دائمًا ولا تحتاج إعدادًا.

## أحداث Hook

يصدر PRX عدد 8 أحداث لدورة الحياة. ويحمل كل حدث payload بصيغة JSON مع حقول خاصة بالسياق.

| Event | When Emitted | Payload Fields |
|-------|-------------|----------------|
| `agent_start` | عندما تبدأ حلقة الوكيل دورًا جديدًا | `agent` (string), `session` (string) |
| `agent_end` | عندما تكمل حلقة الوكيل دورًا | `success` (bool), `messages_count` (number) |
| `llm_request` | قبل إرسال طلب إلى مزود LLM | `provider` (string), `model` (string), `messages_count` (number) |
| `llm_response` | بعد استلام استجابة LLM | `provider` (string), `model` (string), `duration_ms` (number), `success` (bool) |
| `tool_call_start` | قبل أن تبدأ الأداة التنفيذ | `tool` (string), `arguments` (object) |
| `tool_call` | بعد اكتمال تنفيذ الأداة | `tool` (string), `success` (bool), `output` (string) |
| `turn_complete` | عند اكتمال الدور بالكامل (بعد حل كل الأدوات) | _(empty object)_ |
| `error` | عند أي خطأ أثناء التنفيذ | `component` (string), `message` (string) |

### مخططات Payload

جميع الـ payloads هي كائنات JSON. البنية العليا تغلف الحقول الخاصة بالحدث:

```json
{
  "event": "llm_response",
  "timestamp": "2026-03-21T08:15:30.123Z",
  "session_id": "sess_abc123",
  "payload": {
    "provider": "openai",
    "model": "gpt-4o",
    "duration_ms": 1842,
    "success": true
  }
}
```

توجد الحقول `event` و`timestamp` و`session_id` في كل حدث hook. بينما يتغير كائن `payload` حسب نوع الحدث كما في الجدول أعلاه.

## الإعداد

تُضبط Shell hooks في ملف `hooks.json` يوضع في دليل مساحة العمل (نفس دليل `config.toml`). ويراقب PRX هذا الملف ويعيد تحميل الإعدادات **hot-reload** دون حاجة لإعادة التشغيل.

### البنية الأساسية

```json
{
  "hooks": {
    "<event_name>": [
      {
        "command": "/path/to/script",
        "args": ["--flag", "value"],
        "env": {
          "CUSTOM_VAR": "value"
        },
        "cwd": "/working/directory",
        "timeout_ms": 5000,
        "stdin_json": true
      }
    ]
  }
}
```

يرتبط كل اسم حدث بمصفوفة من إجراءات hook. ويمكن إرفاق عدة إجراءات بالحدث نفسه؛ وتُنفَّذ بشكل متزامن ومستقل.

### مثال كامل

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/usr/local/bin/notify",
        "args": ["--channel", "ops", "--title", "Agent Started"],
        "timeout_ms": 3000
      }
    ],
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/log_latency.py"],
        "stdin_json": true,
        "timeout_ms": 2000
      }
    ],
    "tool_call": [
      {
        "command": "/opt/hooks/audit_tool_usage.sh",
        "env": {
          "LOG_DIR": "/var/log/prx/audit"
        },
        "timeout_ms": 5000
      }
    ],
    "error": [
      {
        "command": "curl",
        "args": [
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

## حقول إجراء Hook

يدعم كل كائن إجراء hook الحقول التالية:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `command` | string | Yes | -- | مسار مطلق للملف التنفيذي أو اسم أمر موجود في PATH المنقّى |
| `args` | string[] | No | `[]` | المعاملات الممررة إلى الأمر |
| `env` | object | No | `{}` | متغيرات بيئة إضافية تُدمج في بيئة تنفيذ منقّاة |
| `cwd` | string | No | workspace dir | دليل العمل للعملية المُشغّلة |
| `timeout_ms` | number | No | `30000` | أقصى زمن تنفيذ بالميلي ثانية. تُقتل العملية (SIGKILL) عند تجاوز الحد |
| `stdin_json` | bool | No | `false` | عند `true` يُمرَّر payload JSON الكامل إلى العملية عبر stdin |

### ملاحظات حول `command`

يخضع حقل `command` لتحقق أمني قبل التنفيذ. ويجب ألا يحتوي محارف shell الوصفية (`;`, `|`, `&`, `` ` ``, `$()`) إذ تُرفض لمنع حقن shell. إذا احتجت ميزات shell، ضعها داخل ملف script واجعل `command` يشير إلى ذلك الملف.

تُحل المسارات النسبية مقابل دليل مساحة العمل. ومع ذلك يُنصح باستخدام المسارات المطلقة لثبات السلوك.

## تسليم Payload

تتلقى إجراءات hook الـ payload عبر ثلاث قنوات بالتزامن. يضمن هذا التكرار أن تتمكن scripts بأي لغة من الوصول للبيانات بالطريقة الأنسب.

### 1. متغير البيئة (`ZERO_HOOK_PAYLOAD`)

تُضبط سلسلة JSON الخاصة بالـ payload في متغير البيئة `ZERO_HOOK_PAYLOAD`. وهذه أبسط طريقة وصول لسكربتات shell:

```bash
#!/bin/bash
# Read payload from environment variable
echo "$ZERO_HOOK_PAYLOAD" | jq '.payload.tool'
```

**حد الحجم**: 8 KB. إذا تجاوز الـ payload المُسلسل 8 KB، **لن يُضبط** متغير البيئة ويصبح payload متاحًا فقط عبر الملف المؤقت وقنوات stdin.

### 2. ملف مؤقت (`ZERO_HOOK_PAYLOAD_FILE`)

يُكتب payload في ملف مؤقت، ويُضبط مسار الملف في متغير البيئة `ZERO_HOOK_PAYLOAD_FILE`. ويُحذف الملف المؤقت تلقائيًا بعد خروج عملية hook.

```python
import os, json

payload_file = os.environ["ZERO_HOOK_PAYLOAD_FILE"]
with open(payload_file) as f:
    data = json.load(f)
print(f"Tool: {data['payload']['tool']}, Success: {data['payload']['success']}")
```

لا يوجد حد حجم لهذه القناة، وهي الطريقة الموصى بها عندما يحتمل أن يكون payload كبيرًا (مثل `tool_call` مع مخرجات مطولة).

### 3. الإدخال القياسي (stdin)

عندما يُضبط `stdin_json` إلى `true` في إجراء hook، يُمرَّر payload JSON إلى العملية عبر stdin. وهذا مفيد للأوامر التي تقرأ stdin أصلًا مثل `curl -d @-` أو `jq`.

```bash
#!/bin/bash
# Read from stdin (requires stdin_json: true in hook config)
read -r payload
echo "$payload" | jq -r '.payload.message'
```

## متغيرات البيئة

تتلقى كل عملية hook متغيرات البيئة التالية، إضافةً إلى `ZERO_HOOK_PAYLOAD` و`ZERO_HOOK_PAYLOAD_FILE`:

| Variable | Description | Example |
|----------|-------------|---------|
| `ZERO_HOOK_EVENT` | اسم الحدث الذي فعّل هذا hook | `tool_call` |
| `ZERO_HOOK_SESSION` | معرّف الجلسة الحالي | `sess_abc123` |
| `ZERO_HOOK_TIMESTAMP` | طابع زمني ISO 8601 للحدث | `2026-03-21T08:15:30.123Z` |
| `ZERO_HOOK_PAYLOAD` | payload الكامل كسلسلة JSON (يُحذف إذا >8 KB) | `{"event":"tool_call",...}` |
| `ZERO_HOOK_PAYLOAD_FILE` | مسار ملف مؤقت يحتوي payload | `/tmp/prx-hook-a1b2c3.json` |

تُمنقّى بيئة التنفيذ **sanitized** قبل بدء عملية hook. وتُزال متغيرات البيئة الحساسة والخطرة (انظر [Security](#security) أدناه)، ولا تتاح إلا المتغيرات المذكورة أعلاه مع أي تجاوزات `env` من إجراء hook.

## WASM Plugin Hooks

يمكن لإضافات WASM الاشتراك في أحداث hook عبر تصدير الدالة `on-event` المعرفة في واجهة PRX WIT (WebAssembly Interface Types).

### واجهة WIT

```wit
interface hooks {
    /// Called when a subscribed event fires.
    /// Returns Ok(()) on success, Err(message) on failure.
    on-event: func(event: string, payload-json: string) -> result<_, string>;
}
```

معامل `event` هو اسم الحدث (مثلًا `"tool_call"`)، و`payload-json` هو payload الكامل مُسلسلًا كسلسلة JSON، ومطابق لما تستلمه shell hooks.

### أنماط الاشتراك بالأحداث

تصرّح الإضافات بالأحداث المراد استقبالها داخل manifest `plugin.toml` باستخدام مطابقة الأنماط:

| Pattern | Matches | Example |
|---------|---------|---------|
| Exact match | حدث محدد واحد | `"tool_call"` |
| Wildcard suffix | كل الأحداث المطابقة لبادئة | `"prx.lifecycle.*"` |
| Universal | كل الأحداث | `"*"` |

### مثال Plugin Manifest

```toml
[plugin]
name = "audit-logger"
version = "0.1.0"
description = "Logs all lifecycle events to an audit trail"

[[capabilities]]
type = "hook"
events = ["agent_start", "agent_end", "error"]

[[capabilities]]
type = "hook"
events = ["prx.lifecycle.*"]
```

يمكن لإضافة واحدة التصريح بعدة كتل `[[capabilities]]` بأنماط أحداث مختلفة. ويحدد اتحاد كل الأحداث المطابقة مجموعة الأحداث التي تستلمها الإضافة.

### نموذج التنفيذ

تعمل WASM plugin hooks داخل sandbox الخاص بـ WASM مع نفس حدود الموارد لباقي وظائف الإضافات. وتخضع إلى:

- **حد الذاكرة**: محدد في إعدادات موارد الإضافة (الافتراضي 64 MB)
- **مهلة التنفيذ**: نفس `timeout_ms` الخاص بـ shell hooks (الافتراضي 30 ثانية)
- **بدون وصول لنظام الملفات**: إلا إذا مُنح صراحة عبر قدرات WASI
- **بدون وصول للشبكة**: إلا إذا مُنح صراحة عبر capability flags

إذا أعاد WASM hook القيمة `Err(message)`، يُسجّل الخطأ لكنه لا يؤثر على حلقة الوكيل. فالـ hooks دائمًا fire-and-forget.

## تكامل Event Bus

يُنشر كل حدث hook تلقائيًا إلى ناقل الأحداث الداخلي على الموضوع `prx.lifecycle.<event>`. يحدث ذلك سواء وُجدت shell hooks أو WASM hooks أم لا.

### صيغة الموضوع

```
prx.lifecycle.agent_start
prx.lifecycle.agent_end
prx.lifecycle.llm_request
prx.lifecycle.llm_response
prx.lifecycle.tool_call_start
prx.lifecycle.tool_call
prx.lifecycle.turn_complete
prx.lifecycle.error
```

### أنواع الاشتراك

يمكن للمكونات الداخلية والإضافات الاشتراك في مواضيع event bus باستخدام ثلاثة أنماط:

- **Exact**: `prx.lifecycle.tool_call` -- يستقبل أحداث `tool_call` فقط
- **Wildcard**: `prx.lifecycle.*` -- يستقبل جميع أحداث دورة الحياة
- **Hierarchical**: `prx.*` -- يستقبل كل أحداث نطاق PRX (lifecycle, metrics, ...)

### حدود Payload

| Constraint | Value |
|------------|-------|
| Maximum payload size | 64 KB |
| Maximum recursion depth | 8 levels |
| Dispatch model | Fire-and-forget (async) |
| Delivery guarantee | At-most-once |

إذا أدى حدث hook إلى تفعيل حدث hook آخر (مثلًا script hook يستدعي أداة تنتج `tool_call`)، يزيد عداد التكرار. وعند عمق 8 مستويات، يتم إسقاط أي أحداث إضافية بصمت لمنع الحلقات اللانهائية.

## HTTP API

يمكن إدارة Hooks برمجيًا عبر HTTP API. جميع المسارات تتطلب مصادقة وتُرجع استجابات JSON.

### عرض كل Hooks

```
GET /api/hooks
```

Response:

```json
{
  "hooks": [
    {
      "id": "hook_01",
      "event": "error",
      "action": {
        "command": "/opt/hooks/notify_error.sh",
        "args": [],
        "timeout_ms": 5000,
        "stdin_json": false
      },
      "enabled": true,
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  ]
}
```

### إنشاء Hook

```
POST /api/hooks
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true
}
```

Response (201 Created):

```json
{
  "id": "hook_02",
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true,
  "created_at": "2026-03-21T08:00:00Z",
  "updated_at": "2026-03-21T08:00:00Z"
}
```

### تحديث Hook

```
PUT /api/hooks/hook_02
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency_v2.py"],
    "stdin_json": true,
    "timeout_ms": 5000
  },
  "enabled": true
}
```

Response (200 OK): يعيد كائن hook بعد التحديث.

### حذف Hook

```
DELETE /api/hooks/hook_02
```

Response (204 No Content): جسم فارغ عند النجاح.

### تبديل حالة Hook

```
PATCH /api/hooks/hook_01/toggle
```

Response (200 OK):

```json
{
  "id": "hook_01",
  "enabled": false
}
```

هذا المسار يبدّل قيمة `enabled`. وتبقى hooks المعطلة موجودة في الإعداد لكنها لا تُنفّذ عند تفعيل الحدث.

## الأمان

يخضع تنفيذ hooks لعدة إجراءات أمان لمنع تصعيد الصلاحيات، وتسريب البيانات، وهجمات حجب الخدمة.

### متغيرات بيئة محظورة

تُزال متغيرات البيئة التالية من بيئة تنفيذ hook ولا يمكن تجاوزها عبر حقل `env` في إجراءات hook:

| Variable | Reason |
|----------|--------|
| `LD_PRELOAD` | متجه هجوم لحقن المكتبات |
| `LD_LIBRARY_PATH` | التلاعب بمسار البحث عن المكتبات |
| `DYLD_INSERT_LIBRARIES` | حقن مكتبات في macOS |
| `DYLD_LIBRARY_PATH` | التلاعب بمسار المكتبات في macOS |
| `PATH` | منع اختطاف PATH؛ يتم توفير PATH آمن ومصغّر |
| `HOME` | منع انتحال دليل المنزل |

### التحقق من المدخلات

- **رفض null byte**: أي `command` أو `args` أو مفتاح `env` أو قيمة `env` تحتوي null byte (`\0`) تُرفض. هذا يمنع هجمات حقن null byte التي قد تقطع السلاسل على مستوى نظام التشغيل.
- **رفض محارف shell الوصفية**: يجب ألا يحتوي حقل `command` على `;`, `|`, `&`, `` ` ``, `$(` أو غيرها من محارف shell الوصفية. هذا يمنع حقن shell حتى لو مُرّر الأمر بالخطأ عبر shell.
- **اجتياز المسار**: يُتحقق من حقل `cwd` لضمان عدم الخروج من دليل مساحة العمل عبر مكونات `..`.

### فرض المهلة

كل عملية hook تخضع لـ `timeout_ms` المُعدّة (الافتراضي 30 ثانية). إذا تجاوزت العملية هذا الحد:

1. يُرسل `SIGTERM` إلى العملية
2. بعد مهلة سماح 5 ثوانٍ، يُرسل `SIGKILL`
3. يُوسم hook كمنتهي مهلة في المقاييس الداخلية
4. **لا** تتأثر حلقة الوكيل

### عزل الموارد

ترث عمليات hook نفس قيود cgroup وnamespace الخاصة بتنفيذ أداة shell عند تفعيل واجهة sandbox خلفية. وفي وضع Docker sandbox، تعمل hooks داخل حاوية منفصلة وبدون وصول للشبكة افتراضيًا.

## أمثلة

### Hook لتسجيل التدقيق

تسجيل كل استدعاء أداة في ملف لتدقيق الامتثال:

```json
{
  "hooks": {
    "tool_call": [
      {
        "command": "/opt/hooks/audit_log.sh",
        "env": {
          "AUDIT_LOG": "/var/log/prx/tool_audit.jsonl"
        },
        "timeout_ms": 2000
      }
    ]
  }
}
```

`/opt/hooks/audit_log.sh`:

```bash
#!/bin/bash
echo "$ZERO_HOOK_PAYLOAD" >> "$AUDIT_LOG"
```

### Hook لإشعارات الأخطاء

إرسال أحداث الخطأ إلى قناة Slack:

```json
{
  "hooks": {
    "error": [
      {
        "command": "curl",
        "args": [
          "-s", "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

### Hook لمقاييس زمن استجابة LLM

تتبع أزمنة استجابة LLM للوحات المراقبة:

```json
{
  "hooks": {
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/metrics.py"],
        "stdin_json": true,
        "timeout_ms": 3000
      }
    ]
  }
}
```

`/opt/hooks/metrics.py`:

```python
import sys, json

data = json.load(sys.stdin)
payload = data["payload"]
provider = payload["provider"]
model = payload["model"]
duration = payload["duration_ms"]
success = payload["success"]

# Push to StatsD, Prometheus pushgateway, or any metrics backend
print(f"prx.llm.duration,provider={provider},model={model} {duration}")
print(f"prx.llm.success,provider={provider},model={model} {1 if success else 0}")
```

### تتبع دورة حياة الجلسة

تتبع بداية ونهاية جلسات الوكيل لتحليلات الاستخدام:

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["start"],
        "timeout_ms": 2000
      }
    ],
    "agent_end": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["end"],
        "timeout_ms": 2000
      }
    ]
  }
}
```

## مرتبط

- [Shell Execution](/ar/prx/tools/shell) -- أداة shell التي تُغلّفها hooks غالبًا
- [MCP Integration](/ar/prx/tools/mcp) -- بروتوكول أدوات خارجي يُنتج أحداث `tool_call`
- [Plugins](/ar/prx/plugins/) -- نظام إضافات WASM بما في ذلك قدرات hooks
- [Observability](/ar/prx/observability/) -- المقاييس والتتبع المكملان لـ hooks
- [Security](/ar/prx/security/) -- sandbox ومحرك السياسات اللذان يحكمان تنفيذ hooks

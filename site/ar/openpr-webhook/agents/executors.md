---
title: مرجع المنفذ
description: "مرجع تفصيلي لجميع أنواع المنفذ الـ 5: openclaw وopenprx وwebhook وcustom وcli مع الإعداد والسلوك والأمثلة."
---

# مرجع المنفذ

توثّق هذه الصفحة جميع أنواع المنفذ الـ 5 بالتفصيل، بما في ذلك حقول إعداداتها وسلوكها وأمثلتها.

## openclaw

يرسل الإشعارات عبر منصات المراسلة (Signal، Telegram) من خلال أداة OpenClaw CLI.

**كيف يعمل:** يبني أمر shell يستدعي ثنائي OpenClaw بوسيطات `--channel` و`--target` و`--message`.

**الإعداد:**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # Path to the OpenClaw binary
channel = "signal"                     # Channel: "signal" or "telegram"
target = "+1234567890"                 # Phone number, group ID, or channel name
```

**الحقول:**

| الحقل | مطلوب | الوصف |
|-------|-------|-------|
| `command` | نعم | مسار ثنائي OpenClaw CLI |
| `channel` | نعم | قناة المراسلة (`signal`، `telegram`) |
| `target` | نعم | معرف المستلم (رقم الهاتف، معرف المجموعة، الخ) |

---

## openprx

يرسل رسائل عبر البنية التحتية للمراسلة في OpenPRX. يدعم وضعين: HTTP API (خادم Signal) أو أمر CLI.

**الوضع 1: Signal API (مفضل)**

يرسل JSON POST إلى خادم REST API لـ signal-cli:

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # signal-cli REST API base URL
account = "+1234567890"                 # Sender phone number
target = "+0987654321"                  # Recipient phone number or UUID
channel = "signal"                      # Default: "signal"
```

طلب HTTP المُرسَل إلى Signal API:

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**الوضع 2: أمر CLI**

يعود إلى تنفيذ أمر shell إذا لم يكن `signal_api` مضبوطاً:

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**الحقول:**

| الحقل | مطلوب | الوصف |
|-------|-------|-------|
| `signal_api` | لا | رابط أساس HTTP API لخادم Signal |
| `account` | لا | رقم هاتف الحساب (يُستخدم مع `signal_api`) |
| `target` | نعم | رقم هاتف المستلم أو UUID |
| `channel` | لا | اسم القناة (الافتراضي: `signal`) |
| `command` | لا | أمر CLI (احتياطي عندما لا يكون `signal_api` مضبوطاً) |

يجب توفير واحد على الأقل من `signal_api` أو `command`.

---

## webhook

يعيد توجيه حمولة webhook الكاملة كما هي إلى نقطة نهاية HTTP. مفيد للتكامل مع Slack وDiscord وواجهات API مخصصة أو التسلسل إلى خدمة webhook أخرى.

**كيف يعمل:** يرسل JSON POST إلى URL المُعيَّن مع الحمولة الأصلية. اختياريًا يوقّع الطلبات الصادرة بـ HMAC-SHA256.

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Optional: sign outbound requests
```

**الحقول:**

| الحقل | مطلوب | الوصف |
|-------|-------|-------|
| `url` | نعم | URL الوجهة |
| `secret` | لا | سر HMAC-SHA256 للتوقيع الصادر (يُرسَل كرأس `X-Webhook-Signature`) |

عند ضبط `secret`، يتضمن الطلب الصادر رأس `X-Webhook-Signature: sha256=...` محسوباً على جسم JSON، مما يتيح للمستقبل التحقق من الأصالة.

---

## custom

ينفذ أمر shell اعتباطياً، ممرراً الرسالة المنسقة كوسيطة. مفيد للتكاملات المخصصة والتسجيل أو تشغيل النصوص الخارجية.

**كيف يعمل:** يشغل `sh -c '{command} "{message}"'` حيث `{message}` هو القالب المعروض مع الأحرف الخاصة المُهرَّبة.

```toml
[[agents]]
id = "custom-logger"
name = "Log to File"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # Optional additional arguments
```

**الحقول:**

| الحقل | مطلوب | الوصف |
|-------|-------|-------|
| `command` | نعم | مسار الملف التنفيذي أو أمر shell |
| `args` | لا | وسيطات إضافية لسطر الأوامر |

**ملاحظة أمنية:** يشغّل المنفذ المخصص أوامر shell. تأكد من أن مسار الأمر موثوق وغير خاضع لتحكم المستخدم.

---

## cli

ينفذ وكلاء ترميز الذكاء الاصطناعي لمعالجة المهام. هذا هو النوع الأقوى من المنفذ، مصمم لتوليد الكود الآلي وحل المهام.

**يتطلب:** `features.cli_enabled = true` في الإعداد. محجوب عندما `OPENPR_WEBHOOK_SAFE_MODE=1`.

**المنفذون المدعومون (قائمة بيضاء):**

| المنفذ | الثنائي | نمط الأمر |
|--------|--------|----------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions [--mcp-config path] "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

أي منفذ غير موجود في هذه القائمة البيضاء يُرفض.

**الإعداد:**

```toml
[features]
cli_enabled = true
callback_enabled = true  # Required for state transitions

[[agents]]
id = "my-coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # One of: codex, claude-code, opencode
workdir = "/opt/projects/backend"      # Working directory for the CLI tool
timeout_secs = 900                     # Timeout in seconds (default: 900)
max_output_chars = 12000               # Max chars to capture from stdout/stderr (default: 12000)
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"

# State transitions (requires callback_enabled)
update_state_on_start = "in_progress"  # Set issue state when task starts
update_state_on_success = "done"       # Set issue state on success
update_state_on_fail = "todo"          # Set issue state on failure/timeout

# Callback configuration
callback = "mcp"                       # Callback mode: "mcp" or "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # Optional Bearer token for callback

# MCP closed-loop (v0.3.0+)
skip_callback_state = true             # تخطي تحديثات حالة استدعاء الرجوع (يُدير الذكاء الاصطناعي الحالة عبر MCP)
# mcp_instructions = "..."            # تعليمات أداة MCP مخصصة (تتجاوز الافتراضي)
# mcp_config_path = "/path/to/mcp.json"  # مسار --mcp-config لـ claude-code

# متغيرات بيئة لكل وكيل
[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
OPENPR_WORKSPACE_ID = "e5166fd1-..."
```

**الحقول:**

| الحقل | مطلوب | الافتراضي | الوصف |
|-------|-------|----------|-------|
| `executor` | نعم | -- | اسم أداة CLI (`codex`، `claude-code`، `opencode`) |
| `workdir` | لا | -- | دليل العمل |
| `timeout_secs` | لا | 900 | مهلة العملية |
| `max_output_chars` | لا | 12000 | حد التقاط ذيل المخرجات |
| `prompt_template` | لا | `Fix issue {issue_id}: {title}\nContext: {reason}` | المطالبة المُرسَلة لأداة CLI |
| `update_state_on_start` | لا | -- | حالة المهمة عند بدء المهمة |
| `update_state_on_success` | لا | -- | حالة المهمة عند النجاح |
| `update_state_on_fail` | لا | -- | حالة المهمة عند الفشل أو انتهاء المهلة |
| `callback` | لا | `mcp` | بروتوكول استدعاء الرجوع (`mcp` أو `api`) |
| `callback_url` | لا | -- | URL لإرسال استدعاءات الرجوع إليه |
| `callback_token` | لا | -- | رمز Bearer لمصادقة استدعاء الرجوع |
| `skip_callback_state` | لا | `false` | تخطي تحديثات الحالة في استدعاءات الرجوع (عندما يُدير الذكاء الاصطناعي الحالة عبر MCP) |
| `mcp_instructions` | لا | مدمج | تعليمات أداة MCP مخصصة تُلحق بالمطالبة |
| `mcp_config_path` | لا | -- | مسار ملف إعداد MCP (يُمرَّر إلى claude-code عبر `--mcp-config`) |
| `env_vars` | لا | `{}` | متغيرات بيئة إضافية تُحقن في عملية المنفذ الفرعية |

**placeholders قالب المطالبة (خاص بـ cli):**

| المُعلّم | المصدر |
|---------|--------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**حمولة استدعاء الرجوع (وضع MCP):**

عندما `callback = "mcp"`، ترسل الخدمة POST بأسلوب JSON-RPC إلى `callback_url`:

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**دورة حياة انتقال الحالة:**

```
Event received
    |
    v
[update_state_on_start] --> issue state = "in_progress"
    |
    v
CLI tool runs (up to timeout_secs)
    |
    +-- success --> [update_state_on_success] --> issue state = "done"
    |
    +-- failure --> [update_state_on_fail] --> issue state = "todo"
    |
    +-- timeout --> [update_state_on_fail] --> issue state = "todo"
```

عند `skip_callback_state = true`، تُكبَت جميع انتقالات الحالة أعلاه -- يُتوقع من وكيل الذكاء الاصطناعي إدارة حالة المهمة مباشرة عبر أدوات MCP.

---

### أتمتة الحلقة المغلقة عبر MCP

عندما يمتلك وكيل الذكاء الاصطناعي أدوات OpenPR MCP، يمكنه بشكل مستقل قراءة السياق الكامل للمهمة وإصلاح المشكلة وكتابة النتائج مباشرة -- مشكّلاً حلقة مغلقة كاملة.

**كيف يعمل:**

1. يستقبل openpr-webhook حدث webhook مهمة بوت
2. يبني مطالبة من `prompt_template` ويُلحق تعليمات MCP (الافتراضية أو المخصصة)
3. يعمل منفذ CLI مع `env_vars` المُحقنة (مثل `OPENPR_BOT_TOKEN`)
4. يستخدم وكيل الذكاء الاصطناعي أدوات MCP لقراءة تفاصيل المهمة وإصلاح الكود ونشر التعليقات وتحديث الحالة
5. يُبلّغ استدعاء الرجوع عن بيانات وصفية للتنفيذ (المدة، رمز الخروج) لكنه يتخطى تحديثات الحالة

**تعليمات MCP الافتراضية** (تُلحق تلقائياً عند إعداد `mcp_instructions` أو `mcp_config_path` أو `env_vars`):

```
1. Call work_items.get with work_item_id="{issue_id}" to read full issue details
2. Call comments.list with work_item_id="{issue_id}" to read all comments
3. Call work_items.list_labels with work_item_id="{issue_id}" to read labels
4. After completing the fix, call comments.create to post a summary
5. Call work_items.update to set state to "done" if successful
```

يمكنك تجاوز هذه بحقل `mcp_instructions` مخصص.

**متغيرات البيئة** (`env_vars`):

تُحقن متغيرات بيئة لكل وكيل في عملية المنفذ الفرعية. مفيدة لتوفير عناوين URL مختلفة للـ API أو رموز أو معرفات مساحات عمل لوكلاء مختلفين:

```toml
[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_bot_token_here"
OPENPR_WORKSPACE_ID = "e5166fd1-..."
```

**مسار إعداد MCP** (`mcp_config_path`):

بالنسبة لمنفذ `claude-code`، إذا احتاج الوكيل إلى إعداد MCP غير عام، حدد المسار:

```toml
mcp_config_path = "/etc/openpr-webhook/mcp-config.json"
```

يضيف هذا `--mcp-config /etc/openpr-webhook/mcp-config.json` إلى أمر claude.

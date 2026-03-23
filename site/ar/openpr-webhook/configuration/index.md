---
title: مرجع الإعداد
description: "مرجع إعداد TOML الكامل لـ OpenPR-Webhook. قسم الخادم والأمان وعلامات الميزات والنفق والوكلاء ومتغيرات البيئة والوضع الآمن."
---

# مرجع الإعداد

يستخدم OpenPR-Webhook ملف إعداد TOML واحد. افتراضياً، يبحث عن `config.toml` في الدليل الحالي. يمكنك تحديد مسار مخصص كأول وسيطة لسطر الأوامر.

## المخطط الكامل

```toml
# ─── Server ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # Bind address and port

# ─── Security ─────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # HMAC-SHA256 secrets (supports rotation)
allow_unsigned = false                     # Allow unsigned webhook requests (default: false)

# ─── Feature Flags ────────────────────────────────────────
[features]
tunnel_enabled = false                 # Enable WSS tunnel subsystem (default: false)
cli_enabled = false                    # Enable CLI agent executor (default: false)
callback_enabled = false               # Enable state-transition callbacks (default: false)

# ─── Runtime Tuning ───────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # Max concurrent CLI tasks (default: 1)
http_timeout_secs = 15                 # HTTP client timeout (default: 15)
tunnel_reconnect_backoff_max_secs = 60 # Max tunnel reconnect backoff (default: 60)

# ─── WSS Tunnel ───────────────────────────────────────────
[tunnel]
enabled = false                        # Enable this tunnel instance (default: false)
url = "wss://control.example.com/ws"   # WebSocket URL
agent_id = "my-agent"                  # Agent identifier
auth_token = "bearer-token"            # Bearer auth token
reconnect_secs = 3                     # Base reconnect interval (default: 3)
heartbeat_secs = 20                    # Heartbeat interval (default: 20, min: 3)
hmac_secret = "envelope-signing-key"   # Envelope HMAC signing secret
require_inbound_sig = false            # Require inbound message signatures (default: false)

# ─── Agents ───────────────────────────────────────────────

# --- OpenClaw Agent ---
[[agents]]
id = "notify-signal"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- OpenPRX Agent (HTTP API mode) ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- OpenPRX Agent (CLI mode) ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Webhook Agent ---
[[agents]]
id = "forward-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # Optional: sign outbound requests

# --- Custom Agent ---
[[agents]]
id = "custom-script"
name = "Custom Script"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- CLI Agent ---
[[agents]]
id = "ai-coder"
name = "AI Coder"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
skip_callback_state = false               # اضبط إلى true عندما يُدير الذكاء الاصطناعي الحالة عبر MCP
# mcp_instructions = "..."               # تعليمات MCP مخصصة (تتجاوز الافتراضي)
# mcp_config_path = "/path/to/mcp.json"  # مسار --mcp-config لـ claude-code

[agents.cli.env_vars]                      # متغيرات بيئة لكل وكيل
# OPENPR_API_URL = "http://localhost:3000"
# OPENPR_BOT_TOKEN = "opr_xxx"
```

## مرجع الأقسام

### `[server]`

| الحقل | النوع | مطلوب | الافتراضي | الوصف |
|-------|-------|-------|----------|-------|
| `listen` | String | نعم | -- | عنوان TCP للربط بتنسيق `host:port` |

### `[security]`

| الحقل | النوع | مطلوب | الافتراضي | الوصف |
|-------|-------|-------|----------|-------|
| `webhook_secrets` | مصفوفة strings | لا | `[]` | قائمة أسرار HMAC-SHA256 الصالحة للتحقق الوارد. الأسرار المتعددة تدعم تدوير المفاتيح. |
| `allow_unsigned` | Boolean | لا | `false` | قبول الطلبات غير الموقعة دون التحقق من التوقيع. **غير موصى به للإنتاج.** |

**التحقق من التوقيع** يفحص رأسين بالترتيب:
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

يجب أن تكون قيمة الرأس بالتنسيق `sha256={hex-digest}`. تجرب الخدمة كل سر في `webhook_secrets` حتى يتطابق أحدها.

### `[features]`

جميع علامات الميزات تعود إلى `false`. نهج الدفاع المتعمق هذا يضمن الاشتراك الصريح في الميزات الخطيرة.

| الحقل | النوع | الافتراضي | الوصف |
|-------|-------|----------|-------|
| `tunnel_enabled` | Boolean | `false` | تفعيل نظام فرعي لنفق WSS |
| `cli_enabled` | Boolean | `false` | تفعيل منفذ وكيل CLI |
| `callback_enabled` | Boolean | `false` | تفعيل استدعاءات انتقال الحالة |

### `[runtime]`

| الحقل | النوع | الافتراضي | الوصف |
|-------|-------|----------|-------|
| `cli_max_concurrency` | Integer | `1` | الحد الأقصى لمهام وكيل CLI المتزامنة |
| `http_timeout_secs` | Integer | `15` | مهلة طلبات HTTP الصادرة (إعادة توجيه webhook، استدعاءات الرجوع، Signal API) |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | أقصى فاصل تراجع لإعادة الاتصال بالنفق |

### `[tunnel]`

راجع [نفق WSS](../tunnel/index.md) للتوثيق التفصيلي.

### `[[agents]]`

راجع [أنواع الوكلاء](../agents/index.md) و[مرجع المنفذ](../agents/executors.md) للتوثيق التفصيلي.

## متغيرات البيئة

| المتغير | الوصف |
|---------|-------|
| `OPENPR_WEBHOOK_SAFE_MODE` | اضبط إلى `1` أو `true` أو `yes` أو `on` لتعطيل ميزات النفق وCLI والاستدعاء بغض النظر عن الإعداد. مفيد للقفل الطارئ. |
| `RUST_LOG` | يتحكم في تفصيل السجل. الافتراضي: `openpr_webhook=info`. أمثلة: `openpr_webhook=debug`، `openpr_webhook=trace` |

### متغيرات البيئة لكل وكيل

تدعم وكلاء CLI حقن متغيرات بيئة مخصصة عبر `[agents.cli.env_vars]`. تُمرَّر هذه إلى عملية المنفذ الفرعية وهي مفيدة لتوفير مصادقة MCP:

| المتغير | الوصف |
|---------|-------|
| `OPENPR_API_URL` | عنوان URL الأساس لـ OpenPR API (يُستخدم من قِبل خادم MCP) |
| `OPENPR_BOT_TOKEN` | رمز مصادقة البوت (بادئة `opr_`) |
| `OPENPR_WORKSPACE_ID` | UUID مساحة العمل الهدف |

## الوضع الآمن

ضبط `OPENPR_WEBHOOK_SAFE_MODE=1` يعطّل:

- تنفيذ وكيل CLI (يُجبَر `cli_enabled` على `false`)
- إرسال استدعاءات الرجوع (يُجبَر `callback_enabled` على `false`)
- نفق WSS (يُجبَر `tunnel_enabled` على `false`)

الوكلاء غير الخطيرة (openclaw وopenprx وwebhook وcustom) تستمر في العمل بشكل طبيعي. يتيح لك هذا قفل الخدمة بسرعة دون تعديل ملف الإعداد.

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## الإعداد الأدنى

أصغر إعداد صالح:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

يبدأ هذا الخدمة بلا وكلاء ولا تحقق من التوقيع. مفيد فقط للتطوير.

## قائمة فحص الإنتاج

- [ ] ضبط إدخال واحد على الأقل في `webhook_secrets`
- [ ] ضبط `allow_unsigned = false`
- [ ] إعداد وكيل واحد على الأقل
- [ ] إذا كنت تستخدم وكلاء CLI: ضبط `cli_enabled = true` ومراجعة القائمة البيضاء للمنفذ
- [ ] إذا كنت تستخدم النفق: استخدم `wss://` (وليس `ws://`)، ضبط `hmac_secret` و`require_inbound_sig = true`
- [ ] ضبط `RUST_LOG=openpr_webhook=info` (تجنب `debug`/`trace` في الإنتاج للأداء)
- [ ] النظر في التشغيل مع `OPENPR_WEBHOOK_SAFE_MODE=1` أولاً للتحقق من الوظائف غير الـ CLI

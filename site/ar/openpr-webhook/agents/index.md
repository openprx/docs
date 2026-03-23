---
title: أنواع الوكلاء
description: "وحدات الإرسال الأساسية في OpenPR-Webhook. خمسة أنواع من الوكلاء: openclaw وopenprx وwebhook وcustom وcli مع قوالب الرسائل ومنطق المطابقة."
---

# أنواع الوكلاء

الوكلاء هم وحدات الإرسال الأساسية في OpenPR-Webhook. يعرّف كل وكيل كيفية التعامل مع حدث webhook مطابق. يمكنك إعداد وكلاء متعددين في نشر واحد، وتُوجَّه الأحداث إلى الوكيل المناسب بناءً على `bot_context` في حمولة webhook.

## نظرة عامة

| النوع | حالة الاستخدام | يتطلب علامة ميزة |
|-------|-------------|----------------|
| `openclaw` | إرسال إشعارات عبر Signal/Telegram باستخدام OpenClaw CLI | لا |
| `openprx` | إرسال رسائل عبر OpenPRX Signal API أو CLI | لا |
| `webhook` | إعادة توجيه الأحداث إلى نقاط نهاية HTTP (Slack، Discord، الخ) | لا |
| `custom` | تشغيل أوامر shell اعتباطية | لا |
| `cli` | تنفيذ وكلاء ترميز الذكاء الاصطناعي (codex، claude-code، opencode) | نعم (`cli_enabled`) |

## هيكل إعداد الوكيل

كل وكيل لديه هذه الحقول المشتركة:

```toml
[[agents]]
id = "unique-id"              # Unique identifier, used for matching
name = "Human-Readable Name"  # Display name, also used for matching
agent_type = "openclaw"       # One of: openclaw, openprx, webhook, custom, cli
message_template = "..."      # Optional: custom message format
```

ثم، بناءً على `agent_type`، تقدم كتلة الإعداد الخاصة بالنوع:

- `[agents.openclaw]` لوكلاء openclaw
- `[agents.openprx]` لوكلاء openprx
- `[agents.webhook]` لوكلاء webhook
- `[agents.custom]` لوكلاء custom
- `[agents.cli]` لوكلاء cli

## قوالب الرسائل

حقل `message_template` يدعم placeholders تُستبدَل بقيم من حمولة webhook:

| المُعلّم | المصدر | مثال |
|---------|--------|------|
| `{event}` | `payload.event` | `issue.updated` |
| `{title}` | `payload.data.issue.title` | `Fix login bug` |
| `{key}` | `payload.data.issue.key` | `PROJ-42` |
| `{issue_id}` | `payload.data.issue.id` | `123` |
| `{reason}` | `payload.bot_context.trigger_reason` | `assigned_to_bot` |
| `{actor}` | `payload.actor.name` | `alice` |
| `{project}` | `payload.project.name` | `backend` |
| `{workspace}` | `payload.workspace.name` | `IM` |
| `{state}` | `payload.data.issue.state` | `in_progress` |
| `{priority}` | `payload.data.issue.priority` | `high` |
| `{url}` | مُشتق | `issue/123` |

القالب الافتراضي (لـ openclaw وopenprx وwebhook وcustom):

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## منطق مطابقة الوكيل

عند وصول حدث webhook مع `bot_context.is_bot_task = true`:

1. تستخرج الخدمة `bot_context.bot_name` و`bot_context.bot_agent_type`
2. تبحث في الوكلاء عن وكيل `id` أو `name` (بدون حساسية لحالة الأحرف) يطابق `bot_name`
3. إذا لم يكن هناك تطابق بالاسم، تعود إلى أول وكيل يكون `agent_type` يطابق `bot_agent_type`
4. إذا لم يتطابق أي وكيل، يُقرّ بالحدث لكن لا يُرسَل

## مثال متعدد الوكلاء

```toml
# Agent 1: Notification via Telegram
[[agents]]
id = "notify-tg"
name = "Telegram Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "telegram"
target = "@my-channel"

# Agent 2: Forward to Slack
[[agents]]
id = "notify-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"

# Agent 3: AI coding agent with MCP closed-loop
[[agents]]
id = "coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
skip_callback_state = true  # يُدير الذكاء الاصطناعي الحالة مباشرة عبر MCP

[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
```

في هذا الإعداد، يمكن لـ OpenPR توجيه الأحداث المختلفة إلى وكلاء مختلفين بضبط حقل `bot_name` في حمولة webhook.

## الخطوات التالية

- [مرجع المنفذ](executors.md) -- توثيق مفصل لكل نوع منفذ
- [مرجع الإعداد](../configuration/index.md) -- مخطط TOML الكامل

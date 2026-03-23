---
title: Agent-ის ტიპები
description: OpenPR-Webhook-ის 5 agent-ის ტიპი -- openclaw, openprx, webhook, custom და cli -- მათი გამოყენების შემთხვევებით, შაბლონებითა და მარშრუტიზაციის ლოგიკით.
---

# Agent-ის ტიპები

Agent-ები OpenPR-Webhook-ის ძირითადი dispatch ერთეულებია. თითოეული agent განსაზღვრავს, თუ როგორ დამუშავდეს შესაბამისი webhook მოვლენა. შეგიძლიათ კონფიგურირება მოახდინოთ მრავალი agent-ის ერთ განასახებაში, და მოვლენები გადაეცემა შესაბამის agent-ს payload-ში `bot_context`-ის საფუძველზე.

## მიმოხილვა

| ტიპი | გამოყენების შემთხვევა | ფუნქციის ნიშანი სჭირდება |
|------|----------------------|--------------------------|
| `openclaw` | Signal/Telegram-ით შეტყობინებების გაგზავნა OpenClaw CLI-ის გამოყენებით | არა |
| `openprx` | შეტყობინებების გაგზავნა OpenPRX Signal API-ით ან CLI-ით | არა |
| `webhook` | მოვლენების გადაგზავნა HTTP endpoint-ებზე (Slack, Discord, და ა.შ.) | არა |
| `custom` | თვითნებური shell ბრძანებების გაშვება | არა |
| `cli` | AI კოდირების agent-ების შესრულება (codex, claude-code, opencode) | დიახ (`cli_enabled`) |

## Agent-ის კონფიგურაციის სტრუქტურა

ყველა agent-ს აქვს ეს საერთო ველები:

```toml
[[agents]]
id = "unique-id"              # Unique identifier, used for matching
name = "Human-Readable Name"  # Display name, also used for matching
agent_type = "openclaw"       # One of: openclaw, openprx, webhook, custom, cli
message_template = "..."      # Optional: custom message format
```

შემდეგ, `agent_type`-ის მიხედვით, მიაწოდებთ ტიპ-სპეციფიკური კონფიგურაციის ბლოკს:

- `[agents.openclaw]` openclaw agent-ებისთვის
- `[agents.openprx]` openprx agent-ებისთვის
- `[agents.webhook]` webhook agent-ებისთვის
- `[agents.custom]` custom agent-ებისთვის
- `[agents.cli]` cli agent-ებისთვის

## შეტყობინებების შაბლონები

`message_template` ველი მხარს უჭერს placeholder-ებს, რომლებიც იცვლება webhook payload-ის მნიშვნელობებით:

| Placeholder | წყარო | მაგალითი |
|-------------|-------|----------|
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
| `{url}` | გამოყვანილი | `issue/123` |

ნაგულისხმევი შაბლონი (openclaw, openprx, webhook, custom-ისთვის):

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## Agent-ის შეწყობის ლოგიკა

როდესაც `bot_context.is_bot_task = true`-ით webhook მოვლენა მოდის:

1. სერვისი ამოიღებს `bot_context.bot_name`-სა და `bot_context.bot_agent_type`-ს
2. ეძებს agent-ებს, რომლის `id` ან `name` (case-insensitive) ემთხვევა `bot_name`-ს
3. სახელით დაუმთხვევლობის შემთხვევაში გადადის პირველ agent-ზე, რომლის `agent_type` ემთხვევა `bot_agent_type`-ს
4. თუ არც ერთი agent არ ემთხვევა, მოვლენა დასტურდება, მაგრამ არ გადაეცემა

## მრავალ-agent-იანი მაგალითი

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

# Agent 3: AI კოდირების agent MCP closed-loop-ით
[[agents]]
id = "coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
skip_callback_state = true  # AI MCP-ის მეშვეობით სტატუსს პირდაპირ განაახლებს

[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
```

ამ კონფიგურაციაში OpenPR-ს შეუძლია სხვადასხვა მოვლენები სხვადასხვა agent-ებზე გადაამისამართოს webhook payload-ში `bot_name` ველის დაყენებით.

## შემდეგი ნაბიჯები

- [Executor-ის ცნობარი](executors.md) -- თითოეული executor ტიპის დეტალური დოკუმენტაცია
- [კონფიგურაციის ცნობარი](../configuration/index.md) -- სრული TOML სქემა

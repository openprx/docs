---
title: Executor-ის ცნობარი
description: OpenPR-Webhook-ის 5 executor ტიპის სრული ცნობარი -- openclaw, openprx, webhook, custom და cli -- კონფიგურაციის ველებით, ქცევებითა და state გადასვლის lifecycle-ით.
---

# Executor-ის ცნობარი

ეს გვერდი დეტალურად აღწერს ყველა 5 executor ტიპს, მათ შორის კონფიგურაციის ველებს, ქცევასა და მაგალითებს.

## openclaw

აგზავნის შეტყობინებებს მესიჯინგ პლატფორმებზე (Signal, Telegram) OpenClaw CLI ინსტრუმენტის მეშვეობით.

**მუშაობის პრინციპი:** აყალიბებს shell ბრძანებას, რომელიც გამოიძახებს OpenClaw binary-ს `--channel`, `--target` და `--message` არგუმენტებით.

**კონფიგურაცია:**

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

**ველები:**

| ველი | სავალდებულო | აღწერა |
|------|-------------|--------|
| `command` | დიახ | OpenClaw CLI binary-ს გზა |
| `channel` | დიახ | მესიჯინგ არხი (`signal`, `telegram`) |
| `target` | დიახ | მიმღების იდენტიფიკატორი (ტელეფონის ნომერი, ჯგუფის ID, და ა.შ.) |

---

## openprx

აგზავნის შეტყობინებებს OpenPRX მესიჯინგ ინფრასტრუქტურის მეშვეობით. მხარს უჭერს ორ რეჟიმს: HTTP API (Signal daemon) ან CLI ბრძანება.

**რეჟიმი 1: Signal API (სასურველი)**

გაგზავნის JSON POST-ს signal-cli REST API daemon-ზე:

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

Signal API-ზე გაგზავნილი HTTP მოთხოვნა:

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**რეჟიმი 2: CLI ბრძანება**

`signal_api`-ის დაუყენებლობის შემთხვევაში shell ბრძანების შესრულებამდე გადადის:

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**ველები:**

| ველი | სავალდებულო | აღწერა |
|------|-------------|--------|
| `signal_api` | არა | Signal daemon HTTP API ბაზის URL |
| `account` | არა | ანგარიშის ტელეფონის ნომერი (`signal_api`-თან ერთად) |
| `target` | დიახ | მიმღების ტელეფონის ნომერი ან UUID |
| `channel` | არა | არხის სახელი (ნაგულისხმევი: `signal`) |
| `command` | არა | CLI ბრძანება (სარეზერვო, `signal_api`-ის არარსებობისას) |

`signal_api`-ს ან `command`-ს მინიმუმ ერთი უნდა იყოს მოწოდებული.

---

## webhook

გადასცემს სრულ webhook payload-ს, როგორც-ასაა, HTTP endpoint-ზე. სასარგებლოა Slack-თან, Discord-თან, პერსონალურ API-ებთან ინტეგრაციისთვის ან სხვა webhook სერვისზე ჯაჭვად მიბმისთვის.

**მუშაობის პრინციპი:** აგზავნის JSON POST-ს კონფიგურირებულ URL-ზე ორიგინალური payload-ით. სურვილისამებრ ხელს აწერს გამავალ მოთხოვნებს HMAC-SHA256-ით.

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Optional: sign outbound requests
```

**ველები:**

| ველი | სავალდებულო | აღწერა |
|------|-------------|--------|
| `url` | დიახ | დანიშნულების URL |
| `secret` | არა | გამავალი სიგნატურისთვის HMAC-SHA256 საიდუმლო (`X-Webhook-Signature` header-ად გაიგზავნება) |

`secret`-ის დაყენებისას გამავალი მოთხოვნა შეიცავს `X-Webhook-Signature: sha256=...` header-ს, JSON სხეულზე გამოთვლილს, რაც საშუალებას აძლევს მიმღებ მხარეს ავთენტურობის შემოწმება.

---

## custom

შესრულებს თვითნებური shell ბრძანებას, გადასცემს ფორმატირებულ შეტყობინებას არგუმენტად. სასარგებლოა პერსონალური ინტეგრაციებისთვის, ლოგირებისთვის ან გარე სკრიპტების გამოძახებისთვის.

**მუშაობის პრინციპი:** გაუშვებს `sh -c '{command} "{message}"'`-ს, სადაც `{message}` არის გარენდერებული შაბლონი სპეციალური სიმბოლოების escaping-ით.

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

**ველები:**

| ველი | სავალდებულო | აღწერა |
|------|-------------|--------|
| `command` | დიახ | შესრულებადი ფაილის ან shell ბრძანების გზა |
| `args` | არა | დამატებითი ბრძანების ხაზის არგუმენტები |

**უსაფრთხოების შენიშვნა:** custom executor-ი shell ბრძანებებს გაუშვებს. დარწმუნდით, რომ ბრძანების გზა სანდოა და არ კონტროლდება მომხმარებლის მიერ.

---

## cli

შესრულებს AI კოდირების agent-ებს issue-ების დასამუშავებლად. ეს ყველაზე ძლიერი executor ტიპია, შექმნილი ავტომატური კოდის გენერაციისა და issue-ების გადასაჭრელად.

**სჭირდება:** `features.cli_enabled = true` კონფიგურაციაში. იბლოკება `OPENPR_WEBHOOK_SAFE_MODE=1`-ის დროს.

**მხარდაჭერილი executor-ები (whitelist):**

| Executor | Binary | ბრძანების შაბლონი |
|----------|--------|-------------------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

ამ whitelist-ის გარეთ არსებული ნებისმიერი executor უარყოფილია.

**კონფიგურაცია:**

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
```

**ველები:**

| ველი | სავალდებულო | ნაგულისხმევი | აღწერა |
|------|-------------|--------------|--------|
| `executor` | დიახ | -- | CLI ინსტრუმენტის სახელი (`codex`, `claude-code`, `opencode`) |
| `workdir` | არა | -- | სამუშაო დირექტორია |
| `timeout_secs` | არა | 900 | პროცესის timeout |
| `max_output_chars` | არა | 12000 | გამოტანის tail-ის აღბეჭდვის ლიმიტი |
| `prompt_template` | არა | `Fix issue {issue_id}: {title}\nContext: {reason}` | CLI ინსტრუმენტზე გაგზავნილი prompt |
| `update_state_on_start` | არა | -- | ამოცანის დაწყებისას issue-ის state |
| `update_state_on_success` | არა | -- | წარმატებისას issue-ის state |
| `update_state_on_fail` | არა | -- | წარუმატებლობის ან timeout-ის დროს issue-ის state |
| `callback` | არა | `mcp` | Callback პროტოკოლი (`mcp` ან `api`) |
| `callback_url` | არა | -- | Callback-ების გასაგზავნი URL |
| `callback_token` | არა | -- | Callback auth-ისთვის Bearer ტოკენი |

**Prompt შაბლონის placeholder-ები (cli-სპეციფიკური):**

| Placeholder | წყარო |
|-------------|-------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**Callback payload (MCP რეჟიმი):**

`callback = "mcp"`-ის შემთხვევაში სერვისი აგზავნის JSON-RPC-სტილის POST-ს `callback_url`-ზე:

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

**State გადასვლის lifecycle:**

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

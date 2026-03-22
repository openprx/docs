---
title: კონფიგურაციის ცნობარი
description: "OpenPR-Webhook-ის სრული TOML სქემა: სერვერი, უსაფრთხოება, ფუნქციების ნიშნები, runtime, tunnel და agent სექციები."
---

# კონფიგურაციის ცნობარი

OpenPR-Webhook იყენებს ერთ TOML კონფიგურაციის ფაილს. ნაგულისხმევად იყურება `config.toml`-ს მიმდინარე დირექტორიაში. პირველი ბრძანების ხაზის არგუმენტად შეგიძლიათ მიუთითოთ პერსონალური გზა.

## სრული სქემა

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
```

## სექციების ცნობარი

### `[server]`

| ველი | ტიპი | სავალდებულო | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------------|--------|
| `listen` | String | დიახ | -- | TCP bind მისამართი `host:port` ფორმატში |

### `[security]`

| ველი | ტიპი | სავალდებულო | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------------|--------|
| `webhook_secrets` | String-ების მასივი | არა | `[]` | შემომავალი ვერიფიკაციისთვის მოქმედი HMAC-SHA256 საიდუმლოების სია. მრავალი საიდუმლო მხარს უჭერს გასაღების rotation-ს. |
| `allow_unsigned` | Boolean | არა | `false` | სიგნატურის ვერიფიკაციის გარეშე ხელმოუწერელი მოთხოვნების მიღება. **წარმოებაში არ არის რეკომენდებული.** |

**სიგნატურის ვერიფიკაცია** ამოწმებს ორ header-ს თანმიმდევრობით:
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

Header-ის მნიშვნელობა უნდა იყოს ფორმატში `sha256={hex-digest}`. სერვისი ცდილობს `webhook_secrets`-ის თითოეულ საიდუმლოს სანამ ერთი არ დაემთხვევა.

### `[features]`

ყველა ფუნქციის ნიშანი ნაგულისხმევად `false`-ია. ეს defense-in-depth მიდგომა უზრუნველყოფს, რომ საშიში ფუნქციები მკაფიოდ ჩართულ იყოს.

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|--------------|--------|
| `tunnel_enabled` | Boolean | `false` | WSS tunnel ქვესისტემის ჩართვა |
| `cli_enabled` | Boolean | `false` | CLI agent executor-ის ჩართვა |
| `callback_enabled` | Boolean | `false` | state-transition callback-ების ჩართვა |

### `[runtime]`

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|--------------|--------|
| `cli_max_concurrency` | Integer | `1` | პარალელური CLI agent ამოცანების მაქსიმალური რაოდენობა |
| `http_timeout_secs` | Integer | `15` | გამავალი HTTP მოთხოვნების timeout (webhook გადაგზავნა, callback-ები, Signal API) |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | tunnel-ის ხელახალი კავშირის მაქსიმალური backoff ინტერვალი |

### `[tunnel]`

იხილეთ [WSS Tunnel](../tunnel/index.md) დეტალური დოკუმენტაციისთვის.

### `[[agents]]`

იხილეთ [Agent-ის ტიპები](../agents/index.md) და [Executor-ის ცნობარი](../agents/executors.md) დეტალური დოკუმენტაციისთვის.

## გარემოს ცვლადები

| ცვლადი | აღწერა |
|--------|--------|
| `OPENPR_WEBHOOK_SAFE_MODE` | დააყენეთ `1`, `true`, `yes`, ან `on` tunnel, CLI და callback ფუნქციების გამორთვისთვის კონფიგურაციის მიუხედავად. სასარგებლოა გადაუდებელი დაბლოკვისთვის. |
| `RUST_LOG` | აკონტროლებს ლოგის დეტალობას. ნაგულისხმევი: `openpr_webhook=info`. მაგალითები: `openpr_webhook=debug`, `openpr_webhook=trace` |

## safe mode

`OPENPR_WEBHOOK_SAFE_MODE=1`-ის დაყენება გამორთავს:

- CLI agent-ის შესრულებას (`cli_enabled` იძულებით `false`)
- Callback-ების გაგზავნას (`callback_enabled` იძულებით `false`)
- WSS tunnel-ს (`tunnel_enabled` იძულებით `false`)

სახიფათო-არარამდენი agent-ები (openclaw, openprx, webhook, custom) განაგრძობენ ჩვეულებრივ ფუნქციონირებას. ეს საშუალებას გაძლევთ სწრაფად დაბლოკოთ სერვისი კონფიგურაციის ფაილის შეცვლის გარეშე.

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## მინიმალური კონფიგურაცია

ყველაზე მცირე მოქმედი კონფიგურაცია:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

ეს იწყებს სერვისს agent-ების და სიგნატურის ვერიფიკაციის გარეშე. გამოსადეგია მხოლოდ განვითარებისთვის.

## წარმოების სია

- [ ] `webhook_secrets`-ში მინიმუმ ერთი ჩანაწერის დაყენება
- [ ] `allow_unsigned = false`-ის დაყენება
- [ ] მინიმუმ ერთი agent-ის კონფიგურირება
- [ ] CLI agent-ების გამოყენების შემთხვევაში: `cli_enabled = true`-ის დაყენება და executor-ის whitelist-ის გადახედვა
- [ ] tunnel-ის გამოყენების შემთხვევაში: `wss://`-ის გამოყენება (არა `ws://`), `hmac_secret`-ისა და `require_inbound_sig = true`-ის დაყენება
- [ ] `RUST_LOG=openpr_webhook=info`-ის დაყენება (წარმოებაში `debug`/`trace` მოერიდეთ პერფორმანსის გამო)
- [ ] `OPENPR_WEBHOOK_SAFE_MODE=1`-ით გაშვების განხილვა თავდაპირველად CLI-ს გარეშე ფუნქციონირების შესამოწმებლად

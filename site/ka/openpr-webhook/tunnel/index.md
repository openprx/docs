---
title: WSS Tunnel
description: "OpenPR-Webhook-ის WSS Tunnel-ის დოკუმენტაცია: ჩართვა, შეტყობინებების კონვერტი, HMAC ხელმოწერა, ხელახალი კავშირის ქცევა და კონკურენტობის კონტროლი."
---

# WSS Tunnel

WSS Tunnel (ფაზა B) უზრუნველყოფს აქტიური WebSocket კავშირს OpenPR-Webhook-დან კონტროლ-პლანის სერვერამდე. HTTP webhook-ების შემოსვლის მოლოდინის ნაცვლად, tunnel-ი კონტროლ-პლანს საშუალებას აძლევს ამოცანები პირდაპირ agent-ზე მიწოდოს მუდმივი კავშირის მეშვეობით.

ეს განსაკუთრებით სასარგებლოა, როდესაც webhook სერვისი NAT-ის ან firewall-ის მიღმა მუშაობს და შემომავალი HTTP მოთხოვნების მიღება არ შეუძლია.

## მუშაობის პრინციპი

```
Control Plane (wss://...)
    ^         |
    |         | task.dispatch
    |         v
+-------------------+
| openpr-webhook    |
|   tunnel client   |
|                   |
| task.ack  ------->|
| heartbeat ------->|
| task.result ----->|
+-------------------+
    |
    v
  CLI agent (codex / claude-code / opencode)
```

1. OpenPR-Webhook ხსნის WebSocket კავშირს კონტროლ-პლანის URL-ზე
2. ავთენტიფიკაცია Bearer ტოკენის მეშვეობით `Authorization` header-ში
3. პერიოდულ heartbeat შეტყობინებებს გზავნის კავშირის ცოცხალი შესანარჩუნებლად
4. `task.dispatch` შეტყობინებებს იღებს კონტროლ-პლანიდან
5. სამუდამოდ ადასტურებს `task.ack`-ით
6. ამოცანას ასინქრონულად ასრულებს CLI agent-ის მეშვეობით
7. სრულდების შემდეგ `task.result`-ს უკან გზავნის

## Tunnel-ის ჩართვა

Tunnel-ს **ორი** ნივთი სჭირდება ჩართვისთვის:

1. ფუნქციის ნიშანი: `features.tunnel_enabled = true`
2. Tunnel სექცია: `tunnel.enabled = true`

ორივე პირობა მართალი უნდა იყოს, და `OPENPR_WEBHOOK_SAFE_MODE` არ უნდა იყოს დაყენებული.

```toml
[features]
tunnel_enabled = true
cli_enabled = true  # Usually needed for task execution

[tunnel]
enabled = true
url = "wss://control.example.com/ws/agent"
agent_id = "my-webhook-agent"
auth_token = "your-bearer-token"
reconnect_secs = 3
heartbeat_secs = 20
```

## შეტყობინებების კონვერტის ფორმატი

ყველა tunnel შეტყობინება იყენებს სტანდარტულ კონვერტს:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "heartbeat",
  "ts": 1711234567,
  "agent_id": "my-webhook-agent",
  "payload": { "alive": true },
  "sig": "sha256=abc123..."
}
```

| ველი | ტიპი | აღწერა |
|------|------|--------|
| `id` | String (UUID) | შეტყობინების უნიკალური იდენტიფიკატორი |
| `type` | String | შეტყობინების ტიპი (იხ. ქვემოთ) |
| `ts` | Integer | Unix timestamp (წამებში) |
| `agent_id` | String | გამგზავნი agent-ის ID |
| `payload` | Object | ტიპ-სპეციფიკური payload |
| `sig` | String (სურვილისამებრ) | კონვერტის HMAC-SHA256 სიგნატურა |

## შეტყობინებების ტიპები

### გამავალი (agent-დან კონტროლ-პლანამდე)

| ტიპი | როდის | Payload |
|------|-------|---------|
| `heartbeat` | ყოველ N წამში | `{"alive": true}` |
| `task.ack` | ამოცანის მიღებისთანავე | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | ამოცანის სრულდების შემდეგ | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | პროტოკოლის შეცდომებისას | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### შემომავალი (კონტროლ-პლანიდან agent-ამდე)

| ტიპი | მიზანი | Payload |
|------|--------|---------|
| `task.dispatch` | ამოცანის ამ agent-ზე მინიჭება | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## ამოცანის dispatch-ის ნაკადი

```
Control Plane                    openpr-webhook
    |                                 |
    |--- task.dispatch ------------->|
    |                                 |--- task.ack (immediate)
    |<--- task.ack ------------------|
    |                                 |
    |                                 |--- run CLI agent
    |                                 |    (async, up to timeout)
    |                                 |
    |<--- task.result ---------------|--- task.result
    |                                 |
```

`task.dispatch` payload-ის ველები:

| ველი | ტიპი | აღწერა |
|------|------|--------|
| `run_id` | String | უნიკალური run-ის იდენტიფიკატორი (არარსებობისას ავტო-გენერირდება) |
| `issue_id` | String | Issue-ის ID, რომელზეც სამუშაოდ |
| `agent` | String (სურვილისამებრ) | სამიზნე agent-ის ID (პირველ `cli` agent-ზე გადადის სარეზერვოდ) |
| `body` | Object | dispatcher-ზე გადასაცემი სრული webhook payload |

## HMAC კონვერტის ხელმოწერა

`tunnel.hmac_secret`-ის კონფიგურირებისას ყველა გამავალი კონვერტი ხელმოეწერება:

1. კონვერტი სერიალიზდება JSON-ად `sig`-ის `null`-ად დაყენებით
2. HMAC-SHA256 გამოითვლება JSON bytes-ზე საიდუმლოს გამოყენებით
3. სიგნატურა დაყენდება `sha256={hex}` ფორმატში `sig` ველში

შემომავალი შეტყობინებებისთვის, თუ `tunnel.require_inbound_sig = true`, მოქმედი სიგნატურის გარეშე ნებისმიერი შეტყობინება `error` კონვერტით უარყოფილია.

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## ხელახალი კავშირის ქცევა

Tunnel კლიენტი ავტომატურად ახდენს ხელახალ კავშირს გაწყვეტისას:

- საწყისი retry დაგვიანება: `reconnect_secs` (ნაგულისხმევი: 3 წამი)
- Backoff: ყოველი თანმიმდევრული წარუმატებლობისას ორმაგდება
- მაქსიმალური backoff: `runtime.tunnel_reconnect_backoff_max_secs` (ნაგულისხმევი: 60 წამი)
- წარმატებული კავშირისას ბაზის დაგვიანებამდე გადააყენებს

## კონკურენტობის კონტროლი

Tunnel-ის მეშვეობით CLI ამოცანის შესრულება შეზღუდულია `runtime.cli_max_concurrency`-ით:

```toml
[runtime]
cli_max_concurrency = 2  # Allow 2 concurrent CLI tasks (default: 1)
```

კონკურენტობის ლიმიტს გადამეტებული ამოცანები semaphore permit-ის მოლოდინში იქნებიან. ეს ხელს უშლის მანქანის გადატვირთვას, როდესაც სწრაფი მიმდევრობით მრავალი ამოცანა dispatch-დება.

## კონფიგურაციის ცნობარი

| ველი | ნაგულისხმევი | აღწერა |
|------|--------------|--------|
| `tunnel.enabled` | `false` | Tunnel-ის ჩართვა/გამორთვა |
| `tunnel.url` | -- | WebSocket URL (`wss://` ან `ws://`) |
| `tunnel.agent_id` | `openpr-webhook` | Agent-ის იდენტიფიკატორი |
| `tunnel.auth_token` | -- | ავთენტიფიკაციისთვის Bearer ტოკენი |
| `tunnel.reconnect_secs` | `3` | ბაზის ხელახალი კავშირის ინტერვალი |
| `tunnel.heartbeat_secs` | `20` | Heartbeat-ის ინტერვალი (მინიმუმ 3 წ.) |
| `tunnel.hmac_secret` | -- | HMAC-SHA256 ხელმოწერის საიდუმლო |
| `tunnel.require_inbound_sig` | `false` | ხელმოუწერელი შემომავალი შეტყობინებების უარყოფა |

## უსაფრთხოების შენიშვნები

- წარმოებაში ყოველთვის გამოიყენეთ `wss://`. სერვისი გამოიტანს გაფრთხილებას `ws://`-ის გამოყენების შემთხვევაში.
- `auth_token` HTTP header-ად გაიგზავნება WebSocket upgrade-ის დროს; დარწმუნდით, რომ TLS გამოიყენება.
- ჩართეთ `require_inbound_sig` `hmac_secret`-ით სყალბი task dispatch-ების თავიდან ასაცილებლად.

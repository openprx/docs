---
title: პრობლემების მოგვარება
description: OpenPR-Webhook-ის გავრცელებული პრობლემების გადაწყვეტა -- 401 Unauthorized, not_bot_task, no_agent, CLI გამორთვა, tunnel-ის ჩავარდნა და callback-ის შეცდომები.
---

# პრობლემების მოგვარება

## გავრცელებული პრობლემები

### 401 Unauthorized Webhook POST-ზე

**სიმპტომი:** ყველა webhook მოთხოვნა HTTP 401-ს აბრუნებს.

**მიზეზები:**

1. **სიგნატურის header-ი არ არის.** მოთხოვნა უნდა შეიცავდეს `X-Webhook-Signature`-ს ან `X-OpenPR-Signature`-ს ფორმატში `sha256={hex-digest}`.

2. **არასწორი საიდუმლო.** HMAC-SHA256 digest-ი უნდა ემთხვეოდეს `security.webhook_secrets`-ის ერთ-ერთ საიდუმლოს. შეამოწმეთ, რომ გამგზავნ და მიმღებ მხარეს ერთი და იგივე საიდუმლო სტრიქონი აქვთ.

3. **სხეულის შეუსაბამობა.** სიგნატურა გამოითვლება raw მოთხოვნის სხეულზე. თუ proxy-ი ან middleware-ი სხეულს ცვლის (მაგ., JSON-ის ხელახალი კოდირება), სიგნატურა არ დაემთხვევა.

**debug:**

```bash
# Enable debug logging
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Temporarily allow unsigned requests for testing
# (config.toml)
[security]
allow_unsigned = true
```

### მოვლენა იგნორირდება (not_bot_task)

**სიმპტომი:** პასუხი არის `{"status": "ignored", "reason": "not_bot_task"}`.

**მიზეზი:** Webhook payload-ი არ შეიცავს `bot_context.is_bot_task = true`-ს. OpenPR-Webhook მხოლოდ ბოტ ამოცანებად მაღალი ნიშნულის მოვლენებს ამუშავებს.

**გადაწყვეტა:** დარწმუნდით, რომ OpenPR პლატფორმა კონფიგურირებულია webhook payload-ებში bot context-ის ჩასართავად:

```json
{
  "event": "issue.updated",
  "bot_context": {
    "is_bot_task": true,
    "bot_name": "my-agent",
    "bot_agent_type": "cli"
  },
  "data": { ... }
}
```

### Agent-ი ვერ მოიძებნა

**სიმპტომი:** პასუხი არის `{"status": "no_agent", "bot_name": "..."}`.

**მიზეზი:** კონფიგურირებული agent-ი არ შეესაბამება payload-ის `bot_name`-ს ან `bot_agent_type`-ს.

**გადაწყვეტა:**

1. შეამოწმეთ, რომ agent-ი კონფიგურირებულია `id`-ით ან `name`-ით, რომელიც ემთხვევა `bot_name`-ის მნიშვნელობას
2. შეამოწმეთ, რომ agent-ის `agent_type` ემთხვევა `bot_agent_type`-ს
3. agent-ის სახელის შეწყობა case-insensitive-ია, მაგრამ `id`-ის შეწყობა ზუსტია

### CLI Agent-ი "disabled"-ს აბრუნებს

**სიმპტომი:** CLI dispatch-ი აბრუნებს `"cli disabled by feature flag or safe mode"`.

**მიზეზები:**

1. `features.cli_enabled` `true`-ზე არ არის დაყენებული
2. `OPENPR_WEBHOOK_SAFE_MODE` გარემოს ცვლადი დაყენებულია

**გადაწყვეტა:**

```toml
[features]
cli_enabled = true
```

და შეამოწმეთ, safe mode არ არის აქტიური:

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Should be empty or unset
```

### CLI Executor "not allowed"

**სიმპტომი:** შეცდომის შეტყობინება `"executor not allowed: {name}"`.

**მიზეზი:** CLI agent-ის კონფიგურაციაში `executor` ველი შეიცავს მნიშვნელობას, რომელიც whitelist-ში არ არის.

**დაშვებული executor-ები:**
- `codex`
- `claude-code`
- `opencode`

სხვა ნებისმიერი მნიშვნელობა უსაფრთხოების მიზეზებით უარყოფილია.

### Tunnel-ი კავშირს ვერ ამყარებს

**სიმპტომი:** ლოგის შეტყობინებები `tunnel connect failed: ...`-ს განმეორებით გვიჩვენებს.

**მიზეზები:**

1. **არასწორი URL.** Tunnel URL-ი `wss://`-ით ან `ws://`-ით უნდა დაიწყებოდეს.
2. **ქსელის პრობლემა.** გადაამოწმეთ კონტროლ-პლანის სერვერი ხელმისაწვდომია.
3. **auth-ის ჩავარდნა.** შეამოწმეთ `tunnel.auth_token` სწორია.
4. **სავალდებულო ველები არ არის.** `tunnel.agent_id`-ც და `tunnel.auth_token`-იც ცარიელი არ უნდა იყოს.

**debug:**

```bash
# Test WebSocket connectivity manually
# (requires wscat or websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### Tunnel-ი ხელახლა მიერთებას განაგრძობს

**სიმპტომი:** ლოგები გვიჩვენებს `tunnel disconnected, reconnecting in Ns`-ს ციკლში.

**ჩვეულებრივი ქცევა:** Tunnel ავტომატურად ახდენს ხელახალ კავშირს ექსპონენციური backoff-ით (მდე `tunnel_reconnect_backoff_max_secs`). კონტროლ-პლანის ლოგები შეამოწმეთ გაწყვეტის მიზეზისთვის.

**მაკონფიგურირებელი:**

```toml
[tunnel]
reconnect_secs = 3        # Base retry interval
heartbeat_secs = 20       # Keep-alive interval

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Max backoff
```

### Callback-ის ჩავარდნები

**სიმპტომი:** ლოგები გვიჩვენებს `start callback failed: ...` ან `final callback failed: ...`.

**მიზეზები:**

1. **callback_enabled არის false.** Callback-ებს `features.callback_enabled = true` სჭირდება.
2. **არასწორი callback_url.** გადაამოწმეთ URL ხელმისაწვდომია.
3. **auth-ის ჩავარდნა.** თუ callback endpoint-ს auth სჭირდება, დააყენეთ `callback_token`.
4. **Timeout.** ნაგულისხმევი HTTP timeout-ი 15 წამია. გაზარდეთ `runtime.http_timeout_secs`-ით.

### OpenClaw/Custom Agent-ის შესრულების შეცდომები

**სიმპტომი:** პასუხი შეიცავს `exec_error: ...`-ს ან `error: ...`-ს.

**მიზეზები:**

1. **Binary ვერ მოიძებნა.** გადაამოწმეთ `command`-ის გზა არსებობს და შესრულებადია.
2. **Permission denied.** openpr-webhook-ის პროცესსს შესრულების ნებართვა უნდა ჰქონდეს.
3. **დეპენდენდენციები არ არის.** CLI ინსტრუმენტს შეიძლება სხვა პროგრამები ან ბიბლიოთეკები სჭირდებოდეს.

**debug:**

```bash
# Test the command manually
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## დიაგნოსტიკის სია

1. **სერვისის ჯანმრთელობის შემოწმება:**
   ```bash
   curl http://localhost:9000/health
   # Should return: ok
   ```

2. **ჩატვირთული agent-ების შემოწმება:**
   გაშვების ლოგში მოძებნეთ `Loaded N agent(s)`.

3. **debug ლოგირების ჩართვა:**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **სიგნატურის ხელით გადამოწმება:**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **ხელმოუწერელი მოთხოვნებით ტესტი (მხოლოდ განვითარებისთვის):**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **Safe mode-ის სტატუსის შემოწმება:**
   ```bash
   # If set, tunnel/cli/callback are force-disabled
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## ლოგის შეტყობინებების ცნობარი

| ლოგის დონე | შეტყობინება | მნიშვნელობა |
|-----------|------------|-------------|
| INFO | `Loaded N agent(s)` | კონფიგურაცია წარმატებით ჩაიტვირთა |
| INFO | `openpr-webhook listening on ...` | სერვერი გაიხსნა |
| INFO | `Received webhook event: ...` | შემომავალი მოვლენა დამუშავდა |
| INFO | `Dispatching to agent: ...` | Agent-ი მოიძებნა, dispatch-ი მიმდინარეობს |
| INFO | `tunnel connected: ...` | WSS tunnel დამყარდა |
| WARN | `Invalid webhook signature` | სიგნატურის ვერიფიკაცია ვერ შესრულდა |
| WARN | `No agent for bot_name=...` | შესაბამისი agent-ი ვერ მოიძებნა |
| WARN | `tunnel disconnected, reconnecting` | Tunnel-ის კავშირი გაწყდა |
| WARN | `tunnel using insecure ws:// transport` | TLS არ გამოიყენება |
| ERROR | `tunnel connect failed: ...` | WebSocket-ის კავშირის შეცდომა |
| ERROR | `openclaw failed: ...` | OpenClaw ბრძანებამ ნულოვანი არ დაბრუნა |

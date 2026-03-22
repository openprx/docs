---
title: OpenPR-Webhook
description: OpenPR-Webhook-ის მიმოხილვა -- HMAC-SHA256 სიგ-ვალ, ბოტ-ამოც-ფილ, 5 აგ/exec-ტიპი, შ-შ, სტ-გ, WSS Tunnel.
---

# OpenPR-Webhook

OpenPR-Webhook [OpenPR](https://github.com/openprx/openpr)-ის webhook-მოვლ-გამომ-სერვ. ის OpenPR-პლ-დან webhook-მოვლ-ებს იღ, ბოტ-კ-ის-ის-ების-ფ-ებ-ად ფ-ილ და ამ-ის-ს ერ-ვ-ე კ-ებ-ად ამ-ად გა-ებ.

## რას აკეთებს

OpenPR-ში მოვლ-ის შ (მ, issue-ი შ-ი ან განახ), პლ-ა ამ სერვ-ს webhook POST-მ-ს გ. OpenPR-Webhook შ:

1. **მ-ს ვ-ებ** HMAC-SHA256 სიგ-ვ-ის-ის გ
2. **მ-ებ-ს ფ** -- მხოლოდ `bot_context.is_bot_task = true`-ის-ის-ი-ები ამ
3. **ა-ებ-ს მ** -- მ-ს ს-ება ს-ა-ი ა-ს სახ-ი ან ტ-ით
4. **გ-ა** -- ა-ის ქ-ბ-ის შ (შ-ა-ა, CLI-ინ-ი, სხვა webhook-ზე გ, და ა.შ.)

## არქიტექტ-მიმოხ

```
OpenPR Platform
    |
    | POST /webhook (HMAC-SHA256 signed)
    v
+-------------------+
| openpr-webhook    |
|                   |
| Signature verify  |
| Event filter      |
| Agent matching    |
+-------------------+
    |           |           |
    v           v           v
 openclaw    webhook     cli agent
 (Signal/    (HTTP       (codex /
  Telegram)  forward)    claude-code)
```

## ძირითადი ფუნქ

- **HMAC-SHA256 სიგ-ვ** მრ-სა-ი rotation-ის მ-ა
- **ბოტ-ამ-ფ** -- ბ-ებ-ის-ა-ა-ი მ-ები ჩ-ით-ი
- **5 ა/exec-ტ** -- openclaw, openprx, webhook, custom, cli
- **შ-შ** ველ-ს-ი-ა-ი ს-ა-ა შ
- **სტ-გ** -- issue-სტ-ი-ის-ს-ის, წ-ი ან ვ-ის-ი ა-ი
- **WSS Tunnel** (ფ. B) -- კ-პლ-ს-ი-ა-ა WebSocket-კ push-ის-ი-ის-ს
- **უ-პ ნ-ხ** -- სახ-ი ფ (tunnel, cli, callback) ნ-ი ა OFF, ფ-ი ს-ი

## მხ-ა-ი ა-ტ

| ტ | მ | პ |
|------|---------|----------|
| `openclaw` | Signal/Telegram-შ-ა OpenClaw CLI-ის გ | Shell-ბ |
| `openprx` | OpenPRX-ის-ა-ი API-ის ან CLI-ის-ა შ | HTTP API / Shell |
| `webhook` | HTTP-endpoint-ზე სრ-ი-ი გ | HTTP POST |
| `custom` | შ-ი Shell-ბ-ის გ | Shell-ბ |
| `cli` | issue-ი-ა AI-კ-ა-ი (codex, claude-code, opencode)-ის გ | Subprocess |

## სწ-ბ

- [ინსტ](getting-started/installation.md)
- [სწ-დ](getting-started/quickstart.md)
- [ა-ტ](agents/index.md)
- [Exec-ცნ](agents/executors.md)
- [WSS Tunnel](tunnel/index.md)
- [კ-ცნ](configuration/index.md)
- [პ-მ](troubleshooting/index.md)

## საცავი

Source-კ: [github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

ლ: MIT OR Apache-2.0

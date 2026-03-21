---
title: المصادقة
description: نظرة عامة على نظام المصادقة في PRX بما يشمل تدفقات OAuth2 وملفات تعريف المزوّدين.
---

# المصادقة

يدعم PRX عدة آليات مصادقة لمزوّدي LLM، والوصول عبر API، والاتصال بين العقد. يتعامل نظام المصادقة مع تدفقات OAuth2، وإدارة مفاتيح API، والمصادقة الخاصة بكل مزوّد.

## نظرة عامة

تعمل المصادقة في PRX على مستويات متعددة:

| Level | Mechanism | Purpose |
|-------|-----------|---------|
| Provider auth | OAuth2 / API keys | Authenticate with LLM providers |
| Gateway auth | Bearer tokens | Authenticate API clients |
| Node auth | Ed25519 pairing | Authenticate distributed nodes |

## مصادقة المزوّد

لكل مزوّد LLM طريقة مصادقة خاصة به:

- **API key** -- مفتاح ثابت يُمرر في ترويسات الطلب (معظم المزوّدين)
- **OAuth2** -- تدفق تفويض عبر المتصفح (Anthropic, Google, GitHub Copilot)
- **AWS IAM** -- مصادقة معتمدة على الأدوار لـ Bedrock

## الإعدادات

```toml
[auth]
default_method = "api_key"

[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
```

## صفحات ذات صلة

- [تدفقات OAuth2](./oauth2)
- [ملفات تعريف المزوّد](./profiles)
- [إدارة الأسرار](/ar/prx/security/secrets)

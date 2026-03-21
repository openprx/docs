---
title: اقتران الأجهزة
description: اقتران الأجهزة والتحقق من الهوية لمصادقة وكيل PRX.
---

# اقتران الأجهزة

يستخدم PRX نموذج اقتران الأجهزة لمصادقة مثيلات الوكيل وبناء الثقة بين العقد. يضمن الاقتران أن الأجهزة المصرح بها فقط يمكنها الاتصال بالوكيل والتحكم فيه.

## نظرة عامة

عملية الاقتران:

1. إنشاء هوية جهاز فريدة (زوج مفاتيح Ed25519)
2. تبادل المفاتيح العامة بين وحدة التحكم والوكيل
3. التحقق من الهوية عبر بروتوكول challenge-response
4. إنشاء قناة اتصال مشفرة

## تدفق الاقتران

```
Controller                    Agent
    │                           │
    │──── Pairing Request ─────►│
    │                           │
    │◄─── Challenge ───────────│
    │                           │
    │──── Signed Response ─────►│
    │                           │
    │◄─── Pairing Confirmed ───│
```

## الإعداد

```toml
[security.pairing]
require_pairing = true
max_paired_devices = 5
challenge_timeout_secs = 30
```

## إدارة الأجهزة المقترنة

```bash
prx pair list          # List paired devices
prx pair add           # Start pairing flow
prx pair remove <id>   # Remove a paired device
prx pair revoke-all    # Revoke all pairings
```

## صفحات ذات صلة

- [نظرة عامة على الأمان](./)
- [العقد](/ar/prx/nodes/)
- [إدارة الأسرار](./secrets)

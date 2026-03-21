---
title: إقران العقدة
description: كيفية إقران عقد PRX مع متحكم لتنفيذ موزع وآمن.
---

# إقران العقدة

قبل أن تتمكن العقدة من استقبال المهام من متحكم، يجب إقرانهما. ينشئ الإقران ثقة متبادلة عبر التحقق من الهوية التشفيرية.

## عملية الإقران

1. شغّل العقدة في وضع الإقران: `prx node pair`
2. تعرض العقدة رمز إقران (PIN من 6 أرقام)
3. على المتحكم، ابدأ الإقران: `prx pair add --address <node-ip>:3121`
4. أدخل رمز الإقران عند الطلب
5. يتبادل الطرفان مفاتيح Ed25519 العامة ويتحققان منها

## الإعداد

```toml
[node.pairing]
auto_accept = false
pairing_timeout_secs = 120
max_paired_controllers = 3
```

## إدارة العقد

```bash
# On the controller
prx node list              # List paired nodes
prx node status <node-id>  # Check node status
prx node unpair <node-id>  # Remove node pairing

# On the node
prx node pair              # Enter pairing mode
prx node info              # Show node identity
```

## صفحات ذات صلة

- [نظرة عامة على العقد](./)
- [بروتوكول الاتصال](./protocol)
- [إقران الأجهزة](/ar/prx/security/pairing)

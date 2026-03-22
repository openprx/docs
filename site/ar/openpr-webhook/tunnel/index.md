---
title: نفق WSS
description: "نفق WSS في OpenPR-Webhook يوفر اتصال WebSocket فعّال بطائرة التحكم لإرسال المهام القائم على الدفع. مفيد عندما تعمل الخدمة خلف NAT أو جدار حماية."
---

# نفق WSS

يوفر نفق WSS (المرحلة B) اتصال WebSocket فعّالاً من OpenPR-Webhook إلى خادم طائرة التحكم. بدلاً من انتظار webhooks HTTP الواردة، يتيح النفق لطائرة التحكم دفع المهام مباشرةً إلى الوكيل عبر اتصال دائم.

هذا مفيد بشكل خاص عندما تعمل خدمة webhook خلف NAT أو جدار حماية ولا تستطيع استقبال طلبات HTTP الواردة.

## كيف يعمل

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

1. يفتح OpenPR-Webhook اتصال WebSocket بـ URL طائرة التحكم
2. يصادق باستخدام رمز Bearer في رأس `Authorization`
3. يرسل رسائل نبضات قلب دورية للحفاظ على الاتصال حياً
4. يستقبل رسائل `task.dispatch` من طائرة التحكم
5. يُقرّ فوراً بـ `task.ack`
6. ينفذ المهمة بشكل غير متزامن عبر وكيل CLI
7. يرسل `task.result` عند اكتمال التنفيذ

## تفعيل النفق

يتطلب النفق **شيئين** لتفعيله:

1. علامة الميزة: `features.tunnel_enabled = true`
2. قسم النفق: `tunnel.enabled = true`

يجب أن يكون الشرطان صحيحَين، ويجب ألا يكون `OPENPR_WEBHOOK_SAFE_MODE` مضبوطاً.

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

## تنسيق غلاف الرسائل

جميع رسائل النفق تستخدم غلافاً قياسياً:

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

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `id` | String (UUID) | معرف رسالة فريد |
| `type` | String | نوع الرسالة (انظر أدناه) |
| `ts` | Integer | طابع زمني Unix (بالثواني) |
| `agent_id` | String | معرف الوكيل المرسِل |
| `payload` | Object | حمولة خاصة بالنوع |
| `sig` | String (اختياري) | توقيع HMAC-SHA256 للغلاف |

## أنواع الرسائل

### صادرة (من الوكيل إلى طائرة التحكم)

| النوع | متى | الحمولة |
|-------|-----|---------|
| `heartbeat` | كل N ثانية | `{"alive": true}` |
| `task.ack` | فوراً عند استقبال مهمة | `{"run_id": "...", "issue_id": "...", "status": "accepted"}` |
| `task.result` | بعد اكتمال المهمة | `{"run_id": "...", "issue_id": "...", "status": "success/failed", "summary": "..."}` |
| `error` | عند أخطاء البروتوكول | `{"reason": "invalid_json/missing_signature/bad_signature", "msg_id": "..."}` |

### واردة (من طائرة التحكم إلى الوكيل)

| النوع | الغرض | الحمولة |
|-------|-------|---------|
| `task.dispatch` | تعيين مهمة لهذا الوكيل | `{"run_id": "...", "issue_id": "...", "agent": "...", "body": {...}}` |

## تدفق إرسال المهمة

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

حقول حمولة `task.dispatch`:

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `run_id` | String | معرف تشغيل فريد (يُولَّد تلقائياً إن غاب) |
| `issue_id` | String | معرف المهمة للعمل عليها |
| `agent` | String (اختياري) | معرف الوكيل الهدف (يعود إلى أول وكيل `cli`) |
| `body` | Object | حمولة webhook الكاملة لتمريرها إلى المرسِل |

## توقيع غلاف HMAC

عند إعداد `tunnel.hmac_secret`، تُوقَّع جميع الغلافات الصادرة:

1. يُسلسَل الغلاف إلى JSON مع تعيين `sig` إلى `null`
2. يُحسَب HMAC-SHA256 على بايتات JSON باستخدام السر
3. يُضبَط التوقيع كـ `sha256={hex}` في حقل `sig`

للرسائل الواردة، إذا كان `tunnel.require_inbound_sig = true`، تُرفض أي رسالة بدون توقيع صالح برسالة خطأ.

```toml
[tunnel]
hmac_secret = "shared-secret-with-control-plane"
require_inbound_sig = true
```

## سلوك إعادة الاتصال

يعيد عميل النفق الاتصال تلقائياً عند الانقطاع:

- تأخر إعادة المحاولة الأولي: `reconnect_secs` (الافتراضي: 3 ثوانٍ)
- التراجع: يتضاعف عند كل فشل متتالٍ
- أقصى تراجع: `runtime.tunnel_reconnect_backoff_max_secs` (الافتراضي: 60 ثانية)
- يُعاد ضبطه على التأخير الأساسي عند نجاح الاتصال

## التحكم في التزامن

تنفيذ مهمة CLI عبر النفق محدود بـ `runtime.cli_max_concurrency`:

```toml
[runtime]
cli_max_concurrency = 2  # Allow 2 concurrent CLI tasks (default: 1)
```

المهام التي تتجاوز حد التزامن تنتظر تصريح semaphore. هذا يمنع إرهاق الجهاز عند إرسال مهام متعددة بسرعة.

## مرجع الإعداد

| الحقل | الافتراضي | الوصف |
|-------|----------|-------|
| `tunnel.enabled` | `false` | تفعيل/تعطيل النفق |
| `tunnel.url` | -- | URL WebSocket (`wss://` أو `ws://`) |
| `tunnel.agent_id` | `openpr-webhook` | معرف الوكيل |
| `tunnel.auth_token` | -- | رمز Bearer للمصادقة |
| `tunnel.reconnect_secs` | `3` | فاصل إعادة الاتصال الأساسي |
| `tunnel.heartbeat_secs` | `20` | فاصل نبضات القلب (الحد الأدنى 3 ثوانٍ) |
| `tunnel.hmac_secret` | -- | سر توقيع HMAC-SHA256 |
| `tunnel.require_inbound_sig` | `false` | رفض الرسائل الواردة غير الموقعة |

## ملاحظات الأمان

- استخدم دائماً `wss://` في الإنتاج. تُسجِّل الخدمة تحذيراً إذا استُخدِم `ws://`.
- يُرسَل `auth_token` كرأس HTTP أثناء ترقية WebSocket؛ تأكد من استخدام TLS.
- فعِّل `require_inbound_sig` مع `hmac_secret` لمنع إرسالات المهام المزيفة.

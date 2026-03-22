---
title: البدء السريع
description: "إعداد OpenPR-Webhook مع وكيل إعادة توجيه webhook بسيط واختباره بحدث محاكى. اختبار التصفية والتحقق من التوقيع ومطابقة الوكيل."
---

# البدء السريع

يرشدك هذا الدليل خلال إعداد OpenPR-Webhook مع وكيل إعادة توجيه webhook بسيط، ثم اختباره بحدث محاكى.

## الخطوة الأولى: إنشاء الإعداد

أنشئ ملفاً باسم `config.toml`:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["my-test-secret"]

[[agents]]
id = "echo-agent"
name = "Echo Agent"
agent_type = "webhook"

[agents.webhook]
url = "https://httpbin.org/post"
```

هذا الإعداد:

- يستمع على المنفذ 9000
- يتطلب توقيعات HMAC-SHA256 باستخدام السر `my-test-secret`
- يوجه أحداث البوت إلى httpbin.org للاختبار

## الخطوة الثانية: بدء الخدمة

```bash
./target/release/openpr-webhook config.toml
```

يجب أن ترى:

```
INFO openpr_webhook: Loaded 1 agent(s)
INFO openpr_webhook: tunnel subsystem disabled (feature flag or safe mode)
INFO openpr_webhook: openpr-webhook listening on 0.0.0.0:9000
```

## الخطوة الثالثة: إرسال حدث اختباري

أنشئ توقيع HMAC-SHA256 لحمولة اختبارية وأرسله:

```bash
# The test payload
PAYLOAD='{"event":"issue.updated","bot_context":{"is_bot_task":true,"bot_name":"echo-agent","bot_agent_type":"webhook"},"data":{"issue":{"id":"42","key":"PROJ-42","title":"Fix login bug"}},"actor":{"name":"alice"},"project":{"name":"backend"}}'

# Compute HMAC-SHA256 signature
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

# Send the webhook
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

الاستجابة المتوقعة:

```json
{
  "status": "dispatched",
  "agent": "echo-agent",
  "result": "webhook: 200 OK"
}
```

## الخطوة الرابعة: اختبار التصفية

الأحداث التي لا تحتوي على `bot_context.is_bot_task = true` تُتجاهَل بصمت:

```bash
PAYLOAD='{"event":"issue.created","data":{"issue":{"id":"1"}}}'
SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "my-test-secret" | awk '{print $2}')

curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$PAYLOAD"
```

الاستجابة:

```json
{
  "status": "ignored",
  "reason": "not_bot_task"
}
```

## الخطوة الخامسة: اختبار رفض التوقيع

التوقيع غير الصالح يُعيد HTTP 401:

```bash
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=invalid" \
  -d '{"event":"test"}'
```

الاستجابة: `401 Unauthorized`

## فهم مطابقة الوكيل

عند وصول حدث webhook مع `is_bot_task = true`، تطابق الخدمة وكيلاً باستخدام هذا المنطق:

1. **بالاسم** -- إذا تطابق `bot_context.bot_name` مع `id` أو `name` الوكيل (بدون حساسية لحالة الأحرف)
2. **بالنوع كاحتياط** -- إذا لم يكن هناك تطابق بالاسم، يستخدم أول وكيل يكون `agent_type` يطابق `bot_context.bot_agent_type`

إذا لم يتطابق أي وكيل، تتضمن الاستجابة `"status": "no_agent"`.

## الخطوات التالية

- [أنواع الوكلاء](../agents/index.md) -- تعلّم جميع أنواع الوكلاء الـ 5
- [مرجع المنفذ](../agents/executors.md) -- تعمّق في كل منفذ
- [مرجع الإعداد](../configuration/index.md) -- مخطط TOML الكامل

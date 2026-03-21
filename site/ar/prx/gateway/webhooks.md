---
title: Webhooks
description: إشعارات webhook صادرة لأحداث PRX والتكاملات.
---

# Webhooks

يدعم PRX webhooks صادرة لإخطار الخدمات الخارجية بأحداث الوكيل. تُمكّن webhooks من التكامل مع أنظمة CI/CD وأدوات المراقبة وسير العمل المخصص.

## نظرة عامة

عند الإعداد، يرسل PRX طلبات HTTP POST إلى عناوين webhook المسجلة عند وقوع أحداث محددة:

- **session.created** -- تم بدء جلسة وكيل جديدة
- **session.completed** -- انتهت جلسة وكيل
- **tool.executed** -- تم استدعاء أداة واكتمل تنفيذها
- **error.occurred** -- تم رصد خطأ

## الإعدادات

```toml
[[gateway.webhooks]]
url = "https://example.com/webhook"
secret = "your-webhook-secret"
events = ["session.completed", "error.occurred"]
timeout_secs = 10
max_retries = 3
```

## تنسيق الحمولة

حمولات webhook هي كائنات JSON تحتوي حقولًا قياسية:

```json
{
  "event": "session.completed",
  "timestamp": "2026-03-21T10:00:00Z",
  "data": { }
}
```

## التحقق من التوقيع

يتضمن كل طلب webhook ترويسة `X-PRX-Signature` تحتوي توقيع HMAC-SHA256 للحمولة باستخدام السر المُعدّ.

## صفحات ذات صلة

- [نظرة عامة على البوابة](./)
- [HTTP API](./http-api)

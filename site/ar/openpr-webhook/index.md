---
title: OpenPR-Webhook
description: "OpenPR-Webhook خدمة إرسال أحداث webhook لـ OpenPR. تستقبل الأحداث وتصفيها وتوجهها إلى وكلاء مُعيَّنين مع التحقق من HMAC-SHA256 ودعم 5 أنواع منفذ."
---

# OpenPR-Webhook

OpenPR-Webhook خدمة إرسال أحداث webhook لـ [OpenPR](https://github.com/openprx/openpr). تستقبل أحداث webhook من منصة OpenPR وتصفيها بناءً على سياق البوت وتوجهها إلى وكيل واحد أو أكثر من الوكلاء المُهيَّئين للمعالجة.

## ما تفعله

عند وقوع حدث في OpenPR (مثل إنشاء مهمة أو تحديثها)، ترسل المنصة طلب POST لـ webhook إلى هذه الخدمة. تقوم OpenPR-Webhook بعد ذلك بـ:

1. **التحقق من الطلب** باستخدام التحقق من توقيع HMAC-SHA256
2. **تصفية الأحداث** -- تُعالج فقط الأحداث التي تحتوي على `bot_context.is_bot_task = true`
3. **التوجيه إلى الوكلاء** -- تطابق الحدث مع وكيل مُعيَّن حسب الاسم أو النوع
4. **الإرسال** -- تنفذ إجراء الوكيل (إرسال رسالة، استدعاء أداة CLI، إعادة توجيه إلى webhook آخر، الخ)

## نظرة عامة على البنية المعمارية

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

## الميزات الرئيسية

- **التحقق من توقيع HMAC-SHA256** على webhooks الواردة مع دعم تدوير أسرار متعددة
- **تصفية مهام البوت** -- يتجاهل الأحداث غير المخصصة للبوتات بصمت
- **5 أنواع من الوكيل/المنفذ** -- openclaw وopenprx وwebhook وcustom وcli
- **قوالب الرسائل** مع متغيرات placeholder لتنسيق الإشعارات بمرونة
- **انتقالات الحالة** -- تحديث حالة المهمة تلقائياً عند بدء المهمة أو نجاحها أو فشلها
- **نفق WSS** (المرحلة B) -- اتصال WebSocket فعّال بطائرة التحكم لإرسال المهام القائم على الدفع
- **أتمتة الحلقة المغلقة عبر MCP** -- تقرأ وكلاء الذكاء الاصطناعي السياق الكامل للمهمة وتكتب النتائج مباشرة عبر أدوات OpenPR MCP
- **متغيرات بيئة لكل وكيل** -- إدخال `OPENPR_BOT_TOKEN` و`OPENPR_API_URL` وغيرها لكل وكيل على حدة
- **الإعدادات الافتراضية الآمنة أولاً** -- الميزات الخطيرة (النفق، cli، استدعاء الرجوع) معطلة افتراضياً، محاطة بعلامات ميزة ووضع آمن

## أنواع الوكلاء المدعومة

| النوع | الغرض | البروتوكول |
|-------|-------|-----------|
| `openclaw` | إرسال إشعارات عبر Signal/Telegram من خلال OpenClaw CLI | أمر shell |
| `openprx` | إرسال رسائل عبر OpenPRX Signal API أو CLI | HTTP API / Shell |
| `webhook` | إعادة توجيه حمولة الحدث الكاملة إلى نقطة نهاية HTTP | HTTP POST |
| `custom` | تنفيذ أمر shell اعتباطي مع الرسالة كوسيطة | أمر shell |
| `cli` | تشغيل وكيل ترميز ذكاء اصطناعي (codex أو claude-code أو opencode) على المهمة | عملية فرعية |

## روابط سريعة

- [التثبيت](getting-started/installation.md)
- [البدء السريع](getting-started/quickstart.md)
- [أنواع الوكلاء](agents/index.md)
- [مرجع المنفذ](agents/executors.md)
- [نفق WSS](tunnel/index.md)
- [مرجع الإعداد](configuration/index.md)
- [استكشاف الأخطاء](troubleshooting/index.md)

## المستودع

الكود المصدري: [github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

الرخصة: MIT OR Apache-2.0

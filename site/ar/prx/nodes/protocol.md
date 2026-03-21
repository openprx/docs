---
title: بروتوكول اتصال العقد
description: المواصفات التقنية لبروتوكول الاتصال بين عقد PRX.
---

# بروتوكول اتصال العقد

تتواصل عقد PRX باستخدام بروتوكول مشفّر ومصادَق عليه عبر TCP. تصف هذه الصفحة صيغة النقل وأنواع الرسائل.

## النقل

- **البروتوكول**: TCP مع TLS 1.3 (مصادقة متبادلة عبر المفاتيح المقترنة)
- **التسلسل**: إطارات MessagePack مسبوقة بالطول
- **الضغط**: ضغط إطارات LZ4 اختياري

## أنواع الرسائل

| Type | Direction | Description |
|------|-----------|-------------|
| `TaskRequest` | Controller -> Node | إسناد مهمة إلى العقدة |
| `TaskResult` | Node -> Controller | إرجاع نتيجة تنفيذ المهمة |
| `StatusQuery` | Controller -> Node | طلب حالة العقدة |
| `StatusReport` | Node -> Controller | الإبلاغ عن صحة العقدة وسعتها |
| `Heartbeat` | Bidirectional | الحفاظ على الاتصال وقياس زمن الاستجابة |
| `Cancel` | Controller -> Node | إلغاء مهمة قيد التشغيل |

## الإعداد

```toml
[node.protocol]
tls_version = "1.3"
compression = "lz4"  # "lz4" | "none"
max_frame_size_kb = 4096
heartbeat_interval_secs = 15
connection_timeout_secs = 10
```

## دورة حياة الاتصال

1. **Connect** -- إنشاء اتصال TCP
2. **TLS handshake** -- مصادقة متبادلة بالمفاتيح المقترنة
3. **Protocol negotiation** -- الاتفاق على الإصدار والضغط
4. **Active** -- تبادل الرسائل
5. **Graceful close** -- إرسال رسالة فصل ثم إغلاق الاتصال

## صفحات ذات صلة

- [نظرة عامة على العقد](./)
- [إقران العقدة](./pairing)

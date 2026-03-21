---
title: HTTP API
description: مرجع RESTful HTTP API لبوابة PRX.
---

# HTTP API

تعرض بوابة PRX واجهة RESTful HTTP API لإدارة جلسات الوكيل وإرسال الرسائل والاستعلام عن حالة النظام.

## Base URL

افتراضيًا، تتوفر الواجهة على `http://127.0.0.1:3120/api/v1`.

## نقاط النهاية

### الجلسات

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions` | إنشاء جلسة وكيل جديدة |
| `GET` | `/sessions` | عرض الجلسات النشطة |
| `GET` | `/sessions/:id` | جلب تفاصيل الجلسة |
| `DELETE` | `/sessions/:id` | إنهاء جلسة |

### الرسائل

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sessions/:id/messages` | إرسال رسالة إلى الوكيل |
| `GET` | `/sessions/:id/messages` | جلب سجل الرسائل |

### النظام

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | فحص السلامة |
| `GET` | `/info` | معلومات النظام |
| `GET` | `/metrics` | مقاييس Prometheus |

## المصادقة

تتطلب طلبات API رمز bearer:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/sessions
```

## صفحات ذات صلة

- [نظرة عامة على البوابة](./)
- [WebSocket](./websocket)
- [Middleware](./middleware)

---
title: Middleware
description: مكدس middleware في البوابة للمصادقة وتحديد المعدل وCORS والتسجيل.
---

# Middleware

تستخدم بوابة PRX مكدس middleware قابلًا للتركيب للتعامل مع الاهتمامات المشتركة مثل المصادقة وتحديد المعدل وCORS وتسجيل الطلبات.

## مكدس Middleware

تمر الطلبات عبر مكدس middleware بالترتيب:

1. **تسجيل الطلبات** -- تسجيل الطلبات الواردة مع التوقيت
2. **CORS** -- معالجة ترويسات المشاركة عبر المصادر
3. **المصادقة** -- التحقق من bearer tokens أو API keys
4. **تحديد المعدل** -- فرض حدود الطلبات لكل عميل
5. **توجيه الطلبات** -- توجيه الطلب إلى المعالج المناسب

## Middleware المصادقة

```toml
[gateway.auth]
enabled = true
method = "bearer"  # "bearer" | "api_key" | "none"
token_secret = "your-secret-key"
```

## تحديد المعدل

```toml
[gateway.rate_limit]
enabled = true
requests_per_minute = 60
burst_size = 10
```

## CORS

```toml
[gateway.cors]
allowed_origins = ["https://app.example.com"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
allowed_headers = ["Authorization", "Content-Type"]
max_age_secs = 86400
```

## تسجيل الطلبات

تُسجَّل جميع طلبات API مع method وpath ورمز الحالة وزمن الاستجابة. يمكن ضبط مستوى السجل:

```toml
[gateway.logging]
level = "info"  # "debug" | "info" | "warn" | "error"
format = "json"  # "json" | "pretty"
```

## صفحات ذات صلة

- [نظرة عامة على البوابة](./)
- [HTTP API](./http-api)
- [الأمان](/ar/prx/security/)

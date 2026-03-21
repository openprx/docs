---
title: prx gateway
description: تشغيل خادم بوابة HTTP/WebSocket المستقل بدون قنوات أو مهام دورية.
---

# prx gateway

تشغيل خادم بوابة HTTP/WebSocket كعملية مستقلة. على عكس [`prx daemon`](./daemon)، يشغّل هذا الأمر البوابة فقط -- بدون قنوات أو مجدول مهام دورية أو محرك تطور.

هذا مفيد لعمليات النشر حيث تريد كشف واجهة PRX البرمجية بدون الخادم الكامل، أو عند تشغيل القنوات والجدولة كعمليات منفصلة.

## الاستخدام

```bash
prx gateway [OPTIONS]
```

## الخيارات

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--config` | `-c` | `~/.config/prx/config.toml` | مسار ملف الإعدادات |
| `--port` | `-p` | `3120` | منفذ الاستماع |
| `--host` | `-H` | `127.0.0.1` | عنوان الربط |
| `--log-level` | `-l` | `info` | مستوى تفصيل السجل: `trace`، `debug`، `info`، `warn`، `error` |
| `--cors-origin` | | `*` | أصول CORS المسموح بها (مفصولة بفواصل) |
| `--tls-cert` | | | مسار ملف شهادة TLS |
| `--tls-key` | | | مسار ملف المفتاح الخاص لـ TLS |

## نقاط النهاية

تكشف البوابة مجموعات نقاط النهاية التالية:

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/health` | GET | فحص السلامة (يعيد `200 OK`) |
| `/api/v1/chat` | POST | إرسال رسالة محادثة |
| `/api/v1/chat/stream` | POST | إرسال رسالة محادثة (بث SSE) |
| `/api/v1/sessions` | GET, POST | إدارة الجلسات |
| `/api/v1/sessions/:id` | GET, DELETE | عمليات الجلسة الفردية |
| `/api/v1/tools` | GET | عرض الأدوات المتاحة |
| `/api/v1/memory` | GET, POST | عمليات الذاكرة |
| `/ws` | WS | نقطة نهاية WebSocket للاتصال الفوري |
| `/webhooks/:channel` | POST | مستقبل webhook الوارد للقنوات |

راجع [واجهة HTTP للبوابة](/ar/prx/gateway/http-api) و[WebSocket للبوابة](/ar/prx/gateway/websocket) للتوثيق الكامل لواجهة API.

## أمثلة

```bash
# التشغيل على المنفذ الافتراضي
prx gateway

# الربط على جميع الواجهات بمنفذ 8080
prx gateway --host 0.0.0.0 --port 8080

# مع TLS
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# تقييد CORS
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# تسجيل مفصل
prx gateway --log-level debug
```

## خلف وكيل عكسي

في الإنتاج، ضع البوابة خلف وكيل عكسي (Nginx، Caddy، إلخ.) لإنهاء TLS وموازنة الحمل:

```
# مثال Caddy
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# مثال Nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## الإشارات

| الإشارة | السلوك |
|---------|--------|
| `SIGHUP` | إعادة تحميل الإعدادات |
| `SIGTERM` | إيقاف تشغيل سلس (إنهاء الطلبات الجارية) |

## ذو صلة

- [prx daemon](./daemon) -- بيئة التشغيل الكاملة (بوابة + قنوات + مهام دورية + تطور)
- [نظرة عامة على البوابة](/ar/prx/gateway/) -- بنية البوابة
- [واجهة HTTP للبوابة](/ar/prx/gateway/http-api) -- مرجع واجهة REST API
- [WebSocket للبوابة](/ar/prx/gateway/websocket) -- بروتوكول WebSocket

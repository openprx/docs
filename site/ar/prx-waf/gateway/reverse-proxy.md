---
title: إعداد الوكيل العكسي
description: "إعداد PRX-WAF كوكيل عكسي. توجيه المضيف والخوادم الخلفية وموازنة الحمل ورؤوس الطلب/الاستجابة وفحوصات الصحة."
---

# إعداد الوكيل العكسي

يعمل PRX-WAF كوكيل عكسي يُحيل طلبات العملاء إلى خوادم الواجهة الخلفية بعد مرورها عبر خط أنابيب كشف WAF. تغطي هذه الصفحة توجيه المضيف وموازنة الحمل وإعداد الوكيل.

## إعداد المضيف

يتطلب كل نطاق محمي إدخال مضيف يُربط الطلبات الواردة بخادم خلفي. يمكن إعداد المضيفين بثلاث طرق:

### عبر ملف إعداد TOML

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### عبر واجهة المستخدم الإدارية

1. انتقل إلى **Hosts** في الشريط الجانبي
2. انقر **Add Host**
3. أدخِل تفاصيل المضيف
4. انقر **Save**

### عبر REST API

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## حقول المضيف

| الحقل | النوع | مطلوب | الوصف |
|-------|------|----------|-------------|
| `host` | `string` | نعم | اسم النطاق للمطابقة (مثل `example.com`) |
| `port` | `integer` | نعم | المنفذ للاستماع عليه (عادةً `80` أو `443`) |
| `remote_host` | `string` | نعم | IP أو اسم مضيف الخادم الخلفي |
| `remote_port` | `integer` | نعم | منفذ الخادم الخلفي |
| `ssl` | `boolean` | لا | هل يستخدم الخادم الخلفي HTTPS (الافتراضي: `false`) |
| `guard_status` | `boolean` | لا | تفعيل حماية WAF لهذا المضيف (الافتراضي: `true`) |

## موازنة الحمل

يستخدم PRX-WAF موازنة حمل round-robin مرجحة عبر الخوادم الخلفية. عند إعداد خوادم خلفية متعددة لمضيف، تُوزَّع الحركة بشكل متناسب وفق أوزانها.

::: info
يمكن إعداد خوادم خلفية متعددة لكل مضيف عبر واجهة المستخدم الإدارية أو API. يدعم ملف إعداد TOML إدخالات مضيف بخادم خلفي واحد.
:::

## رؤوس الطلب

يُضيف PRX-WAF تلقائياً رؤوس وكيل قياسية إلى الطلبات المُحالة:

| الرأس | القيمة |
|--------|-------|
| `X-Real-IP` | عنوان IP الأصلي للعميل |
| `X-Forwarded-For` | IP العميل (مُلحَق بالسلسلة الموجودة) |
| `X-Forwarded-Proto` | `http` أو `https` |
| `X-Forwarded-Host` | قيمة رأس Host الأصلية |

## حد حجم جسم الطلب

يتحكم إعداد الأمن في الحجم الأقصى لجسم الطلب:

```toml
[security]
max_request_body_bytes = 10485760  # 10 MB
```

تُرفض الطلبات التي تتجاوز هذا الحد بـ 413 Payload Too Large قبل الوصول إلى خط أنابيب WAF.

## إدارة المضيفين

### سرد جميع المضيفين

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### تحديث مضيف

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### حذف مضيف

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## قواعد IP

يدعم PRX-WAF قواعد سماح وحجب مستندة إلى IP تُقيَّم في المراحل 1-4 من خط أنابيب الكشف:

```bash
# إضافة قاعدة قائمة سماح IP
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# إضافة قاعدة قائمة حجب IP
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## الخطوات التالية

- [SSL/TLS](./ssl-tls) -- تفعيل HTTPS مع Let's Encrypt
- [نظرة عامة على البوابة](./index) -- التخزين المؤقت للاستجابات والأنفاق العكسية
- [مرجع الإعداد](../configuration/reference) -- جميع مفاتيح إعداد الوكيل

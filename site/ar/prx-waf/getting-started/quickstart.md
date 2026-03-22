---
title: البدء السريع
description: "احمِ تطبيق الويب الخاص بك بـ PRX-WAF في 5 دقائق. ابدأ الوكيل وأضف مضيفاً خلفياً وتحقق من الحماية وراقب أحداث الأمن."
---

# البدء السريع

يأخذك هذا الدليل من الصفر إلى تطبيق ويب محمي بالكامل في أقل من 5 دقائق. بنهاية الدليل، سيوجه PRX-WAF الحركة إلى خادمك الخلفي ويحجب الهجمات الشائعة ويسجل أحداث الأمن.

::: tip المتطلبات الأولية
تحتاج إلى Docker وDocker Compose مثبتَيْن. راجع [دليل التثبيت](./installation) للطرق الأخرى.
:::

## الخطوة 1: بدء تشغيل PRX-WAF

استنسخ المستودع وابدأ جميع الخدمات:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
docker compose up -d
```

تحقق من تشغيل جميع الحاويات:

```bash
docker compose ps
```

المخرجات المتوقعة:

```
NAME         SERVICE     STATUS
prx-waf      prx-waf     running
postgres     postgres    running
```

## الخطوة 2: تسجيل الدخول إلى واجهة المستخدم الإدارية

افتح متصفحك وانتقل إلى `http://localhost:9527`. سجِّل الدخول ببيانات الاعتماد الافتراضية:

- **اسم المستخدم:** `admin`
- **كلمة المرور:** `admin`

::: warning
غيِّر كلمة المرور الافتراضية فور تسجيل دخولك الأول.
:::

## الخطوة 3: إضافة مضيف خلفي

أضف أول مضيف محمي عبر واجهة المستخدم الإدارية أو عبر API:

**عبر واجهة المستخدم الإدارية:**
1. انتقل إلى **Hosts** في الشريط الجانبي
2. انقر **Add Host**
3. أدخِل:
   - **Host:** `example.com` (النطاق الذي تريد حمايته)
   - **Remote Host:** `192.168.1.100` (عنوان IP الخادم الخلفي)
   - **Remote Port:** `8080` (منفذ الخادم الخلفي)
   - **Guard Status:** مُفعَّل
4. انقر **Save**

**عبر API:**

```bash
# الحصول على رمز JWT
TOKEN=$(curl -s -X POST http://localhost:9527/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.token')

# إضافة مضيف
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "192.168.1.100",
    "remote_port": 8080,
    "guard_status": true
  }'
```

## الخطوة 4: اختبار الحماية

أرسل طلباً شرعياً عبر الوكيل:

```bash
curl -H "Host: example.com" http://localhost/
```

يجب أن تتلقى الاستجابة الطبيعية لخادمك الخلفي. الآن اختبر حجب WAF لمحاولة حقن SQL:

```bash
curl -H "Host: example.com" "http://localhost/?id=1%20OR%201=1--"
```

الاستجابة المتوقعة: **403 Forbidden**

اختبر محاولة XSS:

```bash
curl -H "Host: example.com" "http://localhost/?q=<script>alert(1)</script>"
```

الاستجابة المتوقعة: **403 Forbidden**

اختبر محاولة تجاوز المسار:

```bash
curl -H "Host: example.com" "http://localhost/../../etc/passwd"
```

الاستجابة المتوقعة: **403 Forbidden**

## الخطوة 5: مراقبة أحداث الأمن

اعرض الهجمات المحجوبة في واجهة المستخدم الإدارية:

1. انتقل إلى **Security Events** في الشريط الجانبي
2. يجب أن ترى الطلبات المحجوبة من الخطوة 4
3. كل حدث يُظهر نوع الهجوم وعنوان IP المصدر والقاعدة المُطابقة والطابع الزمني

أو استعلم عن الأحداث عبر API:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9527/api/security-events
```

```json
{
  "events": [
    {
      "id": 1,
      "host": "example.com",
      "source_ip": "172.18.0.1",
      "attack_type": "sqli",
      "rule_id": "CRS-942100",
      "action": "block",
      "timestamp": "2026-03-21T10:05:32Z"
    }
  ]
}
```

## الخطوة 6: تفعيل المراقبة في الوقت الفعلي (اختياري)

اتصل بنقطة نهاية WebSocket لأحداث الأمن الحية:

```bash
# باستخدام websocat أو عميل WebSocket مشابه
websocat ws://localhost:9527/ws/events
```

تتدفق الأحداث في الوقت الفعلي عند كشف الهجمات وحجبها.

## ما حققته الآن

بعد إكمال هذه الخطوات، يشمل إعدادك:

| المكوِّن | الحالة |
|-----------|--------|
| الوكيل العكسي | يستمع على المنفذ 80/443 |
| محرك WAF | خط أنابيب كشف من 16 مرحلة نشط |
| القواعد المدمجة | OWASP CRS (أكثر من 310 قاعدة) مُفعَّلة |
| واجهة المستخدم الإدارية | تعمل على المنفذ 9527 |
| PostgreSQL | يخزِّن الإعدادات والقواعد والأحداث |
| المراقبة في الوقت الفعلي | تدفق أحداث WebSocket متاح |

## الخطوات التالية

- [محرك القواعد](../rules/) -- فهم كيفية عمل محرك قواعد YAML
- [بنية YAML](../rules/yaml-syntax) -- تعلم مخطط القاعدة للقواعد المخصصة
- [الوكيل العكسي](../gateway/reverse-proxy) -- تكوين موازنة الحمل وتوجيه الخادم الخلفي
- [SSL/TLS](../gateway/ssl-tls) -- تفعيل HTTPS مع شهادات Let's Encrypt التلقائية
- [مرجع الإعداد](../configuration/reference) -- ضبط كل جانب من جوانب PRX-WAF

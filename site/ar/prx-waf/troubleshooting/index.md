---
title: استكشاف الأخطاء وإصلاحها
description: "حلول للمشكلات الشائعة في PRX-WAF بما فيها اتصال قاعدة البيانات وتحميل القواعد والنتائج الإيجابية الخاطئة ومزامنة الكتلة وشهادات SSL وضبط الأداء."
---

# استكشاف الأخطاء وإصلاحها

تغطي هذه الصفحة أكثر المشكلات شيوعاً عند تشغيل PRX-WAF مع أسبابها وحلولها.

## فشل اتصال قاعدة البيانات

**الأعراض:** يفشل PRX-WAF في البدء مع أخطاء "connection refused" أو "authentication failed".

**الحلول:**

1. **تحقق من تشغيل PostgreSQL:**

```bash
# Docker
docker compose ps postgres

# systemd
sudo systemctl status postgresql
```

2. **اختبر الاتصال:**

```bash
psql "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

3. **تحقق من سلسلة الاتصال** في إعداد TOML:

```toml
[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

4. **شغِّل الترحيلات** إذا كانت قاعدة البيانات موجودة لكن الجداول مفقودة:

```bash
prx-waf -c configs/default.toml migrate
```

## القواعد لا تُحمَّل

**الأعراض:** يبدأ PRX-WAF لكن لا قواعد نشطة. الهجمات لا تُكشف.

**الحلول:**

1. **تحقق من إحصاءات القواعد:**

```bash
prx-waf rules stats
```

إذا أظهرت المخرجات 0 قاعدة، قد يكون دليل القواعد فارغاً أو مُهيَّأ بشكل خاطئ.

2. **تحقق من مسار دليل القواعد** في إعدادك:

```toml
[rules]
dir = "rules/"
```

3. **تحقق من ملفات القواعد:**

```bash
python rules/tools/validate.py rules/
```

4. **تحقق من أخطاء بنية YAML** -- ملف واحد مشوه يمكنه منع تحميل جميع القواعد:

```bash
# التحقق من ملف واحد في كل مرة للعثور على المشكلة
python rules/tools/validate.py rules/owasp-crs/sqli.yaml
```

5. **تأكد من تفعيل القواعد المدمجة:**

```toml
[rules]
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## إعادة التحميل الساخنة لا تعمل

**الأعراض:** تُعدَّل ملفات القواعد لكن التغييرات لا تسري.

**الحلول:**

1. **تحقق من تفعيل إعادة التحميل الساخنة:**

```toml
[rules]
hot_reload = true
reload_debounce_ms = 500
```

2. **شغِّل إعادة تحميل يدوية:**

```bash
prx-waf rules reload
```

3. **أرسل SIGHUP:**

```bash
kill -HUP $(pgrep prx-waf)
```

4. **تحقق من حدود مشاهدة نظام الملفات** (Linux):

```bash
cat /proc/sys/fs/inotify/max_user_watches
# If too low, increase:
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## النتائج الإيجابية الخاطئة

**الأعراض:** الطلبات الشرعية تُحجب (403 Forbidden).

**الحلول:**

1. **حدِّد قاعدة الحجب** من أحداث الأمن:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/security-events
```

ابحث عن حقل `rule_id` في الحدث.

2. **عطِّل القاعدة المحددة:**

```bash
prx-waf rules disable CRS-942100
```

3. **اخفِض مستوى الذعر.** إذا كنت تعمل على مستوى ذعر 2 أو أعلى، جرِّب التخفيض إلى 1:

```toml
# In your rules config, only load paranoia level 1 rules
```

4. **حوِّل القاعدة إلى وضع التسجيل** للمراقبة بدلاً من الحجب:

حرِّر ملف القاعدة وغيِّر `action: "block"` إلى `action: "log"`، ثم أعِد التحميل:

```bash
prx-waf rules reload
```

5. **أضِف قائمة سماح IP** للمصادر الموثوقة:

```bash
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'
```

::: tip
عند نشر قواعد جديدة، ابدأ بـ `action: log` لمراقبة النتائج الإيجابية الخاطئة قبل التبديل إلى `action: block`.
:::

## مشكلات شهادة SSL

**الأعراض:** فشل اتصالات HTTPS أو أخطاء الشهادات أو فشل تجديد Let's Encrypt.

**الحلول:**

1. **تحقق من حالة الشهادة** في واجهة المستخدم الإدارية تحت **SSL Certificates**.

2. **تحقق من إمكانية الوصول إلى المنفذ 80** من الإنترنت لتحديات ACME HTTP-01.

3. **تحقق من مسارات الشهادة** إذا كنت تستخدم شهادات يدوية:

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

4. **تحقق من تطابق الشهادة مع النطاق:**

```bash
openssl x509 -in /etc/prx-waf/tls/cert.pem -text -noout | grep -A1 "Subject Alternative Name"
```

## عقد الكتلة لا تتصل

**الأعراض:** عقد العمال لا تستطيع الانضمام إلى الكتلة. تُظهر الحالة نظراء "disconnected".

**الحلول:**

1. **تحقق من الاتصال الشبكي** على منفذ الكتلة (الافتراضي: UDP 16851):

```bash
# From worker to main
nc -zuv node-a 16851
```

2. **تحقق من قواعد جدار الحماية** -- تستخدم اتصالات الكتلة UDP:

```bash
sudo ufw allow 16851/udp
```

3. **تحقق من الشهادات** -- يجب أن تستخدم جميع العقد شهادات موقَّعة من نفس CA:

```bash
openssl verify -CAfile cluster-ca.pem node-b.pem
```

4. **تحقق من إعداد البذور** على عقد العمال:

```toml
[cluster]
seeds = ["node-a:16851"]   # Must resolve to the main node
```

5. **راجع السجلات** بتفاصيل debug:

```bash
prx-waf -c config.toml run 2>&1 | grep -i "cluster\|quic\|peer"
```

## استهلاك ذاكرة عالٍ

**الأعراض:** تستهلك عملية PRX-WAF ذاكرة أكثر من المتوقع.

**الحلول:**

1. **قلِّل حجم ذاكرة التخزين المؤقت للاستجابات:**

```toml
[cache]
max_size_mb = 128    # Reduce from default 256
```

2. **قلِّل مجمع اتصالات قاعدة البيانات:**

```toml
[storage]
max_connections = 10   # Reduce from default 20
```

3. **قلِّل خيوط العمل:**

```toml
[proxy]
worker_threads = 2    # Reduce from CPU count
```

4. **راقب استخدام الذاكرة:**

```bash
ps aux | grep prx-waf
```

## مشكلات اتصال CrowdSec

**الأعراض:** يُظهر تكامل CrowdSec "disconnected" أو القرارات لا تُحمَّل.

**الحلول:**

1. **اختبر الاتصال بـ LAPI:**

```bash
prx-waf crowdsec test
```

2. **تحقق من مفتاح API:**

```bash
# On the CrowdSec machine
cscli bouncers list
```

3. **تحقق من عنوان URL لـ LAPI:**

```toml
[crowdsec]
lapi_url = "http://127.0.0.1:8080"
api_key  = "your-bouncer-key"
```

4. **اضبط إجراء احتياط آمن** عند عدم إمكانية الوصول إلى LAPI:

```toml
[crowdsec]
fallback_action = "log"    # Don't block when LAPI is down
```

## ضبط الأداء

### أوقات استجابة بطيئة

1. **فعِّل التخزين المؤقت للاستجابات:**

```toml
[cache]
enabled = true
max_size_mb = 512
```

2. **زِد خيوط العمل:**

```toml
[proxy]
worker_threads = 8
```

3. **زِد اتصالات قاعدة البيانات:**

```toml
[storage]
max_connections = 50
```

### استهلاك CPU عالٍ

1. **قلِّل عدد القواعد النشطة.** عطِّل قواعد مستوى الذعر 3-4 إذا لم تكن مطلوبة.

2. **عطِّل مراحل الكشف غير المستخدمة.** مثلاً، إذا كنت لا تستخدم CrowdSec:

```toml
[crowdsec]
enabled = false
```

## الحصول على المساعدة

إذا لم تحل أيٌّ من الحلول أعلاه مشكلتك:

1. **تحقق من المشكلات الموجودة:** [github.com/openprx/prx-waf/issues](https://github.com/openprx/prx-waf/issues)
2. **أبلِغ عن مشكلة جديدة** مع:
   - إصدار PRX-WAF
   - نظام التشغيل وإصدار النواة
   - ملف الإعداد (مع حذف كلمات المرور)
   - مخرجات السجل ذات الصلة
   - خطوات إعادة الإنتاج

## الخطوات التالية

- [مرجع الإعداد](../configuration/reference) -- ضبط جميع الإعدادات
- [محرك القواعد](../rules/) -- فهم كيفية تقييم القواعد
- [وضع الكتلة](../cluster/) -- استكشاف أخطاء الكتلة

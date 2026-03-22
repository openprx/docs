---
title: مرجع أوامر CLI
description: "مرجع كامل لجميع أوامر CLI الخاصة بـ PRX-WAF وأوامرها الفرعية. إدارة الخادم وعمليات القواعد وتكامل CrowdSec وكشف الروبوتات."
---

# مرجع أوامر CLI

توفر واجهة سطر أوامر `prx-waf` أوامر لإدارة الخادم وعمليات القواعد وتكامل CrowdSec وكشف الروبوتات.

## الخيارات العامة

| العلم | الافتراضي | الوصف |
|------|---------|-------------|
| `-c, --config <FILE>` | `configs/default.toml` | المسار إلى ملف إعداد TOML |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## أوامر الخادم

| الأمر | الوصف |
|---------|-------------|
| `prx-waf run` | بدء الوكيل العكسي + API الإدارة (يحجب إلى الأبد) |
| `prx-waf migrate` | تشغيل ترحيلات قاعدة البيانات فقط |
| `prx-waf seed-admin` | إنشاء مستخدم المسؤول الافتراضي (admin/admin) |

```bash
# بدء الخادم
prx-waf -c configs/default.toml run

# تشغيل الترحيلات قبل أول تشغيل
prx-waf -c configs/default.toml migrate

# إنشاء مستخدم المسؤول
prx-waf -c configs/default.toml seed-admin
```

::: tip
للإعداد الأول، شغِّل `migrate` و`seed-admin` قبل `run`. البدءات اللاحقة تحتاج فقط `run` -- يُتحقق من الترحيلات تلقائياً.
:::

## إدارة القواعد

أوامر لإدارة قواعد الكشف. تعمل جميع أوامر القواعد على دليل القواعد المُهيَّأ.

| الأمر | الوصف |
|---------|-------------|
| `prx-waf rules list` | سرد جميع القواعد المحمَّلة |
| `prx-waf rules list --category <CAT>` | تصفية القواعد حسب الفئة |
| `prx-waf rules list --source <SRC>` | تصفية القواعد حسب المصدر |
| `prx-waf rules info <RULE-ID>` | عرض معلومات تفصيلية عن قاعدة |
| `prx-waf rules enable <RULE-ID>` | تفعيل قاعدة مُعطَّلة |
| `prx-waf rules disable <RULE-ID>` | تعطيل قاعدة |
| `prx-waf rules reload` | إعادة التحميل الساخنة لجميع القواعد من القرص |
| `prx-waf rules validate <PATH>` | التحقق من صحة ملف قاعدة |
| `prx-waf rules import <PATH\|URL>` | استيراد قواعد من ملف أو URL |
| `prx-waf rules export [--format yaml]` | تصدير مجموعة القواعد الحالية |
| `prx-waf rules update` | جلب أحدث القواعد من المصادر البعيدة |
| `prx-waf rules search <QUERY>` | البحث في القواعد حسب الاسم أو الوصف |
| `prx-waf rules stats` | عرض إحصاءات القواعد |

### أمثلة

```bash
# سرد جميع قواعد حقن SQL
prx-waf rules list --category sqli

# سرد قواعد OWASP CRS
prx-waf rules list --source owasp

# عرض تفاصيل قاعدة محددة
prx-waf rules info CRS-942100

# تعطيل قاعدة تسبب نتائج إيجابية خاطئة
prx-waf rules disable CRS-942100

# إعادة التحميل الساخنة بعد تعديل القواعد
prx-waf rules reload

# التحقق من القواعد المخصصة قبل النشر
prx-waf rules validate rules/custom/myapp.yaml

# استيراد قواعد من URL
prx-waf rules import https://example.com/rules/custom.yaml

# تصدير جميع القواعد بصيغة YAML
prx-waf rules export --format yaml > all-rules.yaml

# عرض الإحصاءات
prx-waf rules stats
```

## إدارة مصادر القواعد

أوامر لإدارة مصادر القواعد البعيدة.

| الأمر | الوصف |
|---------|-------------|
| `prx-waf sources list` | سرد مصادر القواعد المُهيَّأة |
| `prx-waf sources add <NAME> <URL>` | إضافة مصدر قاعدة بعيد |
| `prx-waf sources remove <NAME>` | إزالة مصدر قاعدة |
| `prx-waf sources update [NAME]` | جلب أحدث من مصدر محدد (أو الكل) |
| `prx-waf sources sync` | مزامنة جميع المصادر البعيدة |

### أمثلة

```bash
# سرد جميع المصادر
prx-waf sources list

# إضافة مصدر مخصص
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# مزامنة جميع المصادر
prx-waf sources sync

# تحديث مصدر محدد
prx-waf sources update owasp-crs
```

## تكامل CrowdSec

أوامر لإدارة تكامل استخبارات التهديدات مع CrowdSec.

| الأمر | الوصف |
|---------|-------------|
| `prx-waf crowdsec status` | عرض حالة تكامل CrowdSec |
| `prx-waf crowdsec decisions` | سرد القرارات النشطة من LAPI |
| `prx-waf crowdsec test` | اختبار الاتصال بـ LAPI |
| `prx-waf crowdsec setup` | معالج إعداد CrowdSec التفاعلي |

### أمثلة

```bash
# التحقق من حالة التكامل
prx-waf crowdsec status

# سرد قرارات الحجب/captcha النشطة
prx-waf crowdsec decisions

# اختبار الاتصال بـ CrowdSec LAPI
prx-waf crowdsec test

# تشغيل معالج الإعداد
prx-waf crowdsec setup
```

## كشف الروبوتات

أوامر لإدارة قواعد كشف الروبوتات.

| الأمر | الوصف |
|---------|-------------|
| `prx-waf bot list` | سرد توقيعات الروبوت المعروفة |
| `prx-waf bot add <PATTERN> [--action ACTION]` | إضافة نمط كشف روبوت |
| `prx-waf bot remove <PATTERN>` | إزالة نمط كشف روبوت |
| `prx-waf bot test <USER-AGENT>` | اختبار وكيل مستخدم مقابل قواعد الروبوت |

### أمثلة

```bash
# سرد جميع توقيعات الروبوت
prx-waf bot list

# إضافة نمط روبوت جديد
prx-waf bot add "(?i)my-bad-bot" --action block

# إضافة نمط روبوت في وضع التسجيل فقط
prx-waf bot add "(?i)suspicious-crawler" --action log

# اختبار سلسلة وكيل مستخدم
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# إزالة نمط روبوت
prx-waf bot remove "(?i)my-bad-bot"
```

## أنماط الاستخدام

### الإعداد الأول

```bash
# 1. تشغيل الترحيلات
prx-waf -c configs/default.toml migrate

# 2. إنشاء مستخدم المسؤول
prx-waf -c configs/default.toml seed-admin

# 3. بدء الخادم
prx-waf -c configs/default.toml run
```

### سير عمل صيانة القواعد

```bash
# 1. التحقق من تحديثات القواعد الخارجية
prx-waf rules update

# 2. التحقق بعد التحديث
prx-waf rules validate rules/

# 3. مراجعة التغييرات
prx-waf rules stats

# 4. إعادة التحميل الساخنة
prx-waf rules reload
```

### إعداد تكامل CrowdSec

```bash
# 1. تشغيل معالج الإعداد
prx-waf crowdsec setup

# 2. اختبار الاتصال
prx-waf crowdsec test

# 3. التحقق من تدفق القرارات
prx-waf crowdsec decisions
```

## الخطوات التالية

- [البدء السريع](../getting-started/quickstart) -- البدء مع PRX-WAF
- [محرك القواعد](../rules/) -- فهم خط أنابيب الكشف
- [مرجع الإعداد](../configuration/reference) -- جميع مفاتيح الإعداد

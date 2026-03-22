---
title: القواعد المدمجة
description: "يُشحن PRX-WAF مع 398 قاعدة YAML تغطي OWASP CRS وقواعد مجتمع ModSecurity وتصحيحات CVE الافتراضية المستهدفة. جرد كامل وتفصيل الفئات."
---

# القواعد المدمجة

يُشحن PRX-WAF مع 398 قاعدة مبنية مسبقاً عبر ثلاث فئات، بالإضافة إلى أكثر من 10 أدوات كشف مُجمَّعة في الملف الثنائي. معاً توفر تغطية شاملة لـ OWASP Top 10 وثغرات CVE المعروفة.

## مجموعة القواعد الأساسية لـ OWASP (310 قاعدة)

قواعد OWASP CRS مُحوَّلة من [مجموعة القواعد الأساسية لـ OWASP ModSecurity الإصدار 4](https://github.com/coreruleset/coreruleset) إلى تنسيق YAML الأصلي لـ PRX-WAF. تغطي أكثر ناقلات هجمات الويب شيوعاً:

| الملف | معرِّفات CRS | القواعد | الفئة |
|------|---------|-------|----------|
| `sqli.yaml` | 942xxx | ~87 | حقن SQL |
| `xss.yaml` | 941xxx | ~41 | البرمجة النصية عبر المواقع |
| `rce.yaml` | 932xxx | ~30 | تنفيذ الأوامر عن بُعد |
| `lfi.yaml` | 930xxx | ~20 | تضمين الملفات المحلية |
| `rfi.yaml` | 931xxx | ~12 | تضمين الملفات البعيدة |
| `php-injection.yaml` | 933xxx | ~18 | حقن PHP |
| `java-injection.yaml` | 944xxx | ~15 | حقن Java / Expression Language |
| `generic-attack.yaml` | 934xxx | ~12 | Node.js وSSI وتقسيم HTTP |
| `scanner-detection.yaml` | 913xxx | ~10 | كشف وكيل المستخدم للماسح الأمني |
| `protocol-enforcement.yaml` | 920xxx | ~15 | امتثال بروتوكول HTTP |
| `protocol-attack.yaml` | 921xxx | ~10 | تهريب الطلبات وحقن CRLF |
| `multipart-attack.yaml` | 922xxx | ~8 | تجاوز متعدد الأجزاء |
| `method-enforcement.yaml` | 911xxx | ~5 | قائمة سماح أساليب HTTP |
| `session-fixation.yaml` | 943xxx | ~6 | تثبيت الجلسة |
| `web-shells.yaml` | 955xxx | ~8 | كشف قشور الويب |
| `response-*.yaml` | 950-956xxx | ~13 | فحص الاستجابة |

### ملفات بيانات قائمة الكلمات

تستخدم قواعد OWASP CRS مطابقة العبارات (`pm_from_file`) مع أكثر من 20 ملف قائمة كلمات مخزَّن في `rules/owasp-crs/data/`:

- `scanners-user-agents.data` -- سلاسل وكيل مستخدم الماسح المعروفة
- `lfi-os-files.data` -- مسارات ملفات نظام التشغيل الحساسة
- `sql-errors.data` -- أنماط رسائل أخطاء قواعد البيانات
- والمزيد

## قواعد مجتمع ModSecurity (46 قاعدة)

قواعد مصنوعة يدوياً لفئات التهديدات غير المغطاة بالكامل في OWASP CRS:

| الملف | القواعد | الفئة |
|------|-------|----------|
| `ip-reputation.yaml` | ~15 | كشف IP للروبوتات والماسحات والوكلاء |
| `dos-protection.yaml` | ~12 | أنماط DoS والطلبات غير الطبيعية |
| `data-leakage.yaml` | ~10 | كشف تسريب المعلومات الشخصية وبيانات الاعتماد |
| `response-checks.yaml` | ~9 | فحص جسم الاستجابة |

## تصحيحات CVE الافتراضية (39 قاعدة)

قواعد كشف مستهدفة لثغرات CVE عالية الأثر. تعمل كتصحيحات افتراضية تحجب محاولات الاستغلال قبل وصولها إلى التطبيقات الضعيفة:

| الملف | CVE(s) | الوصف |
|------|--------|-------------|
| `2021-log4shell.yaml` | CVE-2021-44228، CVE-2021-45046 | RCE في Apache Log4j عبر بحث JNDI |
| `2022-spring4shell.yaml` | CVE-2022-22965، CVE-2022-22963 | RCE في Spring Framework |
| `2022-text4shell.yaml` | CVE-2022-42889 | RCE في Apache Commons Text |
| `2023-moveit.yaml` | CVE-2023-34362، CVE-2023-36934 | حقن SQL في MOVEit Transfer |
| `2024-xz-backdoor.yaml` | CVE-2024-3094 | كشف باب خلفي في XZ Utils |
| `2024-recent.yaml` | متعددة | CVEs بارزة في 2024 |
| `2025-recent.yaml` | متعددة | CVEs بارزة في 2025 |

::: tip
قواعد تصحيح CVE مُضبوطة على مستوى الذعر 1 افتراضياً، مما يعني أنها نشطة في جميع الإعدادات. لديها معدلات نتائج إيجابية خاطئة منخفضة جداً لأنها تستهدف حمولات استغلال محددة.
:::

## أدوات الكشف المدمجة

بالإضافة إلى قواعد YAML، يتضمن PRX-WAF أدوات كشف مُجمَّعة في الملف الثنائي. تعمل في مراحل مخصصة من خط أنابيب الكشف:

| المرحلة | أداة الكشف | الوصف |
|-------|---------|-------------|
| 1-4 | قائمة السماح/الحظر بالـ IP | تصفية IP المستندة إلى CIDR |
| 5 | محدِّد معدل CC/DDoS | تحديد معدل بنافذة منزلقة لكل IP |
| 6 | كشف الماسحات | بصمات ماسح الثغرات (Nmap وNikto وغيرها) |
| 7 | كشف الروبوتات | الروبوتات الضارة وزاحفات الذكاء الاصطناعي والمتصفحات بلا رأس |
| 8 | حقن SQL | libinjection + أنماط regex |
| 9 | XSS | libinjection + أنماط regex |
| 10 | تنفيذ الأوامر / حقن الأوامر | أنماط حقن أوامر نظام التشغيل |
| 11 | تجاوز الدليل | كشف تجاوز المسار (`../`) |
| 14 | البيانات الحساسة | كشف PII/بيانات الاعتماد بـ Aho-Corasick متعدد الأنماط |
| 15 | منع الارتباط الساخن | التحقق المستند إلى Referer لكل مضيف |
| 16 | CrowdSec | قرارات Bouncer + فحص AppSec |

## تحديث القواعد

يمكن مزامنة القواعد من مصادر المنبع باستخدام الأدوات المضمَّنة:

```bash
# التحقق من وجود تحديثات
python rules/tools/sync.py --check

# مزامنة OWASP CRS مع إصدار محدد
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/ --tag v4.10.0

# المزامنة مع الأحدث
python rules/tools/sync.py --source owasp-crs --output rules/owasp-crs/

# إعادة التحميل الساخنة بعد التحديث
prx-waf rules reload
```

## إحصاءات القواعد

اعرض إحصاءات القواعد الحالية عبر CLI:

```bash
prx-waf rules stats
```

مثال على المخرجات:

```
Rule Statistics
===============
  OWASP CRS:    310 rules (21 files)
  ModSecurity:   46 rules (4 files)
  CVE Patches:   39 rules (7 files)
  Custom:         3 rules (1 file)
  ─────────────────────────
  Total:        398 rules (33 files)

  Enabled:      395
  Disabled:       3
  Paranoia 1:   280
  Paranoia 2:    78
  Paranoia 3:    30
  Paranoia 4:    10
```

## الخطوات التالية

- [القواعد المخصصة](./custom-rules) -- كتابة قواعدك الخاصة
- [بنية YAML](./yaml-syntax) -- مرجع مخطط القاعدة الكامل
- [نظرة عامة على محرك القواعد](./index) -- كيف يُقيِّم خط الأنابيب القواعد

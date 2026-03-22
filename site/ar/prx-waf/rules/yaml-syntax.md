---
title: بنية قاعدة YAML
description: "مرجع كامل لتنسيق قواعد YAML في PRX-WAF. المخطط ومرجع الحقول ومرجع العوامل ومرجع الإجراءات وأمثلة موثَّقة."
---

# بنية قاعدة YAML

توثِّق هذه الصفحة مخطط قاعدة YAML الكامل المستخدم في PRX-WAF. كل ملف قاعدة يتبع هذه البنية.

## بنية الملف

كل ملف قاعدة YAML لديه قسم بيانات وصفية على المستوى الأعلى يليه قائمة من القواعد:

```yaml
version: "1.0"                     # Schema version (required)
description: "Short description"   # Human-readable label (required)
source: "OWASP CRS v4.25.0"       # Origin of the rules (optional)
license: "Apache-2.0"             # SPDX license identifier (optional)

rules:
  - <rule>
  - <rule>
```

## مخطط القاعدة

كل قاعدة في قائمة `rules` لها الحقول التالية:

```yaml
- id: "CRS-942100"              # Unique string ID (REQUIRED)
  name: "SQL injection attack"  # Short description (REQUIRED)
  category: "sqli"              # Category tag (REQUIRED)
  severity: "critical"          # Severity level (REQUIRED)
  paranoia: 1                   # Paranoia level 1-4 (optional, default: 1)
  field: "all"                  # Request field to inspect (REQUIRED)
  operator: "regex"             # Match operator (REQUIRED)
  value: "(?i)select.+from"     # Pattern or threshold (REQUIRED)
  action: "block"               # Action on match (REQUIRED)
  tags:                         # String tags (optional)
    - "owasp-crs"
    - "sqli"
  crs_id: 942100                # Original CRS numeric ID (optional)
  reference: "https://..."      # CVE or documentation link (optional)
```

### الحقول المطلوبة

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `id` | `string` | معرِّف فريد عبر جميع ملفات القواعد. التنسيق: `<PREFIX>-<CATEGORY>-<NNN>` |
| `name` | `string` | وصف قصير قابل للقراءة (بحد أقصى ~120 حرفاً) |
| `category` | `string` | وسم الفئة للتصفية والإبلاغ |
| `severity` | `string` | أحد: `critical` وَ`high` وَ`medium` وَ`low` وَ`info` وَ`notice` وَ`warning` وَ`error` وَ`unknown` |
| `field` | `string` | أي جزء من الطلب يتم فحصه (انظر مرجع الحقول) |
| `operator` | `string` | كيفية مطابقة القيمة (انظر مرجع العوامل) |
| `value` | `string` | النمط أو العتبة أو اسم ملف قائمة الكلمات |
| `action` | `string` | ما يجب فعله عند تطابق القاعدة (انظر مرجع الإجراءات) |

### الحقول الاختيارية

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `paranoia` | `integer` | `1` | مستوى الذعر 1-4 |
| `tags` | `string[]` | `[]` | وسوم للتصفية وعرض لوحة التحكم |
| `crs_id` | `integer` | -- | المعرِّف الرقمي الأصلي لـ OWASP CRS |
| `reference` | `string` | -- | URL للـ CVE أو مقالة OWASP أو المنطق |

## مرجع الحقول

تُحدِّد قيمة `field` أي جزء من طلب HTTP يتم فحصه:

| الحقل | يفحص |
|-------|----------|
| `path` | مسار URI للطلب (بدون سلسلة الاستعلام) |
| `query` | سلسلة الاستعلام (جميع المعاملات مُفككة الترميز) |
| `body` | جسم الطلب (مُفكَّك الترميز) |
| `headers` | جميع رؤوس الطلب (أزواج الاسم: القيمة) |
| `user_agent` | رأس User-Agent فقط |
| `cookies` | ملفات تعريف الارتباط في الطلب |
| `method` | أسلوب HTTP (GET وPOST وPUT وغيرها) |
| `content_type` | رأس Content-Type |
| `content_length` | قيمة Content-Length (للمقارنة الرقمية) |
| `path_length` | طول مسار URI (للمقارنة الرقمية) |
| `query_arg_count` | عدد معاملات الاستعلام (للمقارنة الرقمية) |
| `all` | جميع الحقول أعلاه مجتمعةً |

## مرجع العوامل

تُحدِّد قيمة `operator` كيفية مطابقة `value` مع الحقل المفحوص:

| العامل | الوصف | تنسيق القيمة |
|----------|-------------|--------------|
| `regex` | تعبير نمطي متوافق مع PCRE | نمط Regex |
| `contains` | الحقل يحتوي على السلسلة الحرفية | سلسلة حرفية |
| `equals` | الحقل يساوي القيمة تماماً (حساس لحالة الأحرف) | سلسلة حرفية |
| `not_in` | قيمة الحقل ليست في القائمة | قائمة مفصولة بفواصل |
| `gt` | قيمة الحقل (رقمية) أكبر من | سلسلة رقمية |
| `lt` | قيمة الحقل (رقمية) أصغر من | سلسلة رقمية |
| `ge` | قيمة الحقل (رقمية) أكبر من أو تساوي | سلسلة رقمية |
| `le` | قيمة الحقل (رقمية) أصغر من أو تساوي | سلسلة رقمية |
| `detect_sqli` | كشف حقن SQL عبر libinjection | `"true"` أو `""` |
| `detect_xss` | كشف XSS عبر libinjection | `"true"` أو `""` |
| `pm_from_file` | مطابقة عبارات مع ملف قائمة كلمات | اسم ملف في `owasp-crs/data/` |
| `pm` | مطابقة عبارات مع قائمة مضمَّنة | عبارات مفصولة بفواصل |

## مرجع الإجراءات

تُحدِّد قيمة `action` ما يحدث عند تطابق القاعدة:

| الإجراء | الوصف |
|--------|-------------|
| `block` | رفض الطلب باستجابة 403 Forbidden |
| `log` | السماح بالطلب لكن تسجيل التطابق (وضع المراقبة) |
| `allow` | السماح صراحةً بالطلب (يتجاوز القواعد الأخرى) |
| `deny` | اسم بديل لـ `block` |
| `redirect` | إعادة توجيه الطلب (إعداد خاص بالمحرك) |
| `drop` | إسقاط الاتصال بصمت |

::: tip
ابدأ القواعد الجديدة بـ `action: log` لمراقبة النتائج الإيجابية الخاطئة قبل التبديل إلى `action: block`.
:::

## اتفاقية مساحة الاسم للمعرِّفات

يجب أن تتبع معرِّفات القواعد اتفاقية البادئة المعتمدة:

| الدليل | بادئة المعرِّف | مثال |
|-----------|-----------|---------|
| `owasp-crs/` | `CRS-<number>` | `CRS-942100` |
| `modsecurity/` | `MODSEC-<CATEGORY>-<NNN>` | `MODSEC-IP-001` |
| `cve-patches/` | `CVE-<YEAR>-<SHORT>-<NNN>` | `CVE-2021-LOG4J-001` |
| `custom/` | `CUSTOM-<CATEGORY>-<NNN>` | `CUSTOM-API-001` |

## مثال كامل

```yaml
version: "1.0"
description: "Application-specific access control rules"
source: "custom"
license: "Apache-2.0"

rules:
  - id: "CUSTOM-API-001"
    name: "Block access to internal admin API"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/internal/"
    action: "block"
    tags: ["custom", "access-control"]

  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client)"
    action: "log"
    tags: ["custom", "bot", "scanner"]

  - id: "CUSTOM-RATE-001"
    name: "Block requests with excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## التحقق من القواعد

تحقق من ملفات قواعدك قبل النشر:

```bash
# التحقق من جميع القواعد
python rules/tools/validate.py rules/

# التحقق من ملف محدد
python rules/tools/validate.py rules/custom/myapp.yaml
```

يتحقق أداة التحقق من:
- وجود الحقول المطلوبة
- عدم تكرار معرِّفات القواعد عبر جميع الملفات
- صحة قيم الخطورة والإجراءات
- أن مستويات الذعر في النطاق 1-4
- أن التعابير النمطية تُجمَّع بشكل صحيح
- عدم استخدام العوامل الرقمية مع قيم سلسلة نصية

## الخطوات التالية

- [القواعد المدمجة](./builtin-rules) -- استكشاف قواعد OWASP CRS وتصحيحات CVE
- [القواعد المخصصة](./custom-rules) -- كتابة قواعدك الخاصة خطوة بخطوة
- [نظرة عامة على محرك القواعد](./index) -- كيف يُعالج خط الأنابيب القواعد

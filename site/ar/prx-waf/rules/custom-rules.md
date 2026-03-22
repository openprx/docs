---
title: القواعد المخصصة
description: "كتابة قواعد كشف مخصصة لـ PRX-WAF. دليل خطوة بخطوة مع أمثلة للتحكم بالوصول وحجب الروبوتات وتحديد المعدل والحماية الخاصة بالتطبيق."
---

# القواعد المخصصة

يُسهِّل PRX-WAF كتابة قواعد كشف مخصصة مصمَّمة لتطبيقك المحدد. تُكتب القواعد المخصصة بـ YAML وتُوضع في دليل `rules/custom/`.

## البدء

1. أنشئ ملف YAML جديداً في `rules/custom/`:

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. حرِّر الملف متبعاً [مخطط قاعدة YAML](./yaml-syntax).

3. تحقق قبل النشر:

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. تُعاد القواعد تلقائياً، أو شغِّل إعادة التحميل يدوياً:

```bash
prx-waf rules reload
```

## مثال: حجب الوصول إلى المسارات الداخلية

منع الوصول الخارجي إلى نقاط نهاية API الداخلية:

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## مثال: كشف وكلاء المستخدم المشبوهة

تسجيل الطلبات من الأدوات الآلية للمراقبة:

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## مثال: تحديد المعدل بمعاملات الاستعلام

حجب الطلبات ذات عدد مفرط من معاملات الاستعلام (شائعة في هجمات DoS):

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## مثال: حجب امتدادات ملفات محددة

منع الوصول إلى ملفات النسخ الاحتياطية أو الإعداد:

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## مثال: كشف حشو بيانات الاعتماد

كشف محاولات تسجيل الدخول المتكررة السريعة (مفيد بجانب محدِّد المعدل المدمج):

```yaml
  - id: "CUSTOM-AUTH-001"
    name: "Log login endpoint access for monitoring"
    category: "access-control"
    severity: "low"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(api/)?(login|signin|authenticate|auth/token)"
    action: "log"
    tags: ["custom", "authentication", "monitoring"]
```

## مثال: تصحيح CVE الافتراضي

إنشاء تصحيح افتراضي سريع لثغرة محددة:

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## استخدام نصوص Rhai للمنطق المعقد

للقواعد التي تتطلب أكثر من مجرد مطابقة أنماط، يدعم PRX-WAF نصوص Rhai في المرحلة 12:

```rhai
// rules/custom/scripts/geo-block.rhai
// Block requests from specific countries during maintenance
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
تعمل نصوص Rhai في بيئة محاطة. لا يمكنها الوصول إلى نظام الملفات أو الشبكة أو أي موارد نظام خارج سياق الطلب.
:::

## أفضل الممارسات

1. **ابدأ بـ `action: log`** -- راقب قبل الحجب للكشف المبكر عن النتائج الإيجابية الخاطئة.

2. **استخدم مراسي regex محددة** -- استخدم `^` و`$` لمنع التطابقات الجزئية التي تسبب نتائج إيجابية خاطئة.

3. **اضبط مستويات الذعر المناسبة** -- إذا كانت القاعدة قد تتطابق مع الحركة الشرعية، اضبط مستوى الذعر على 2 أو 3 بدلاً من الحجب في المستوى 1.

4. **استخدم المجموعات غير الالتقاطية** -- استخدم `(?:...)` بدلاً من `(...)` للوضوح والأداء.

5. **أضف وسوماً وصفية** -- تظهر الوسوم في واجهة المستخدم الإدارية وتساعد في تصفية أحداث الأمن.

6. **أضِف مراجع** -- أضِف URL لـ `reference` يربط بـ CVE ذات الصلة أو مقالة OWASP أو التوثيق الداخلي.

7. **اختبر التعبيرات النمطية** -- تحقق من أنماط regex قبل النشر:

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **تحقق قبل النشر** -- شغِّل دائماً أداة التحقق:

```bash
python rules/tools/validate.py rules/custom/
```

## الاستيراد عبر CLI

يمكنك أيضاً استيراد القواعد من الملفات أو URLs باستخدام CLI:

```bash
# الاستيراد من ملف محلي
prx-waf rules import /path/to/rules.yaml

# الاستيراد من URL
prx-waf rules import https://example.com/rules/custom.yaml

# التحقق من ملف قاعدة
prx-waf rules validate /path/to/rules.yaml
```

## استيراد قواعد ModSecurity

تحويل قواعد ModSecurity الموجودة بصيغة `.conf` إلى تنسيق YAML لـ PRX-WAF:

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
يدعم مُحوِّل ModSecurity مجموعة فرعية أساسية من توجيهات SecRule (ARGS وREQUEST_HEADERS وREQUEST_URI وREQUEST_BODY). قواعد ModSecurity المعقدة مع الربط أو نصوص Lua غير مدعومة وتحتاج إلى إعادة كتابة يدوية.
:::

## الخطوات التالية

- [بنية YAML](./yaml-syntax) -- مرجع مخطط القاعدة الكامل
- [القواعد المدمجة](./builtin-rules) -- مراجعة القواعد الموجودة قبل كتابة قواعد جديدة
- [نظرة عامة على محرك القواعد](./index) -- فهم كيفية تقييم القواعد في خط الأنابيب

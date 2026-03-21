---
title: تسجيل التدقيق
description: نظام تسجيل تدقيق الأمان لتتبع جميع العمليات ذات الصلة بالأمان في PRX.
---

# تسجيل التدقيق

يتضمن PRX نظام تسجيل تدقيق مدمجًا يسجل جميع العمليات المرتبطة بالأمان. يتتبع `AuditLogger` من قام بماذا، ومتى، وما إذا كانت العملية نجحت، مما يوفّر أثرًا مقاومًا للعبث للامتثال، والاستجابة للحوادث، والتحليل الجنائي.

## نظرة عامة

يلتقط نظام التدقيق أحداثًا منظَّمة لكل إجراء حساس أمنيًا:

- محاولات المصادقة (النجاح والفشل)
- قرارات التفويض (السماح والرفض)
- تغييرات الإعدادات
- تنفيذ الأدوات وأحداث sandbox
- الوصول إلى الذاكرة وتعديلها
- اتصالات القنوات وانفصالاتها
- مقترحات التطور وتطبيقها
- أحداث دورة حياة الإضافات

يتضمن كل حدث تدقيق طابعًا زمنيًا، وهوية الجهة المنفذة، ووصف الإجراء، والهدف، والنتيجة.

## بنية حدث التدقيق

كل حدث تدقيق هو سجل منظَّم بالحقول التالية:

| الحقل | النوع | الوصف |
|-------|------|-------|
| `timestamp` | `DateTime<Utc>` | وقت حدوث الحدث (UTC بدقة نانوثانية) |
| `event_id` | `String` | معرف فريد للحدث (UUIDv7 مرتب زمنيًا) |
| `actor` | `Actor` | من نفّذ الإجراء (مستخدم، وكيل، نظام، أو إضافة) |
| `action` | `String` | ما الذي تم تنفيذه (مثل `auth.login`, `tool.execute`, `config.update`) |
| `target` | `String` | المورد الذي تم التعامل معه (مثل معرف جلسة، مفتاح إعداد، مسار ملف) |
| `outcome` | `Outcome` | النتيجة: `success` أو `failure` أو `denied` |
| `metadata` | `Map<String, Value>` | سياق إضافي (عنوان IP، سبب الرفض، إلخ) |
| `session_id` | `Option<String>` | جلسة الوكيل المرتبطة إن وُجدت |
| `severity` | `Severity` | شدة الحدث: `info` أو `warning` أو `critical` |

### أنواع الجهات المنفذة

| نوع الجهة | الوصف | مثال |
|-----------|-------|------|
| `user` | مستخدم بشري محدد عبر القناة أو مصادقة API | `user:telegram:123456789` |
| `agent` | وكيل PRX نفسه | `agent:default` |
| `system` | عمليات النظام الداخلية (cron, evolution) | `system:evolution` |
| `plugin` | إضافة WASM | `plugin:my-plugin:v1.2.0` |

### فئات الإجراءات

تتبع الإجراءات اصطلاح مساحة أسماء مفصولة بنقطة:

| الفئة | الإجراءات | الشدة |
|-------|-----------|-------|
| `auth.*` | `auth.login`, `auth.logout`, `auth.token_refresh`, `auth.pairing` | info / warning |
| `authz.*` | `authz.allow`, `authz.deny`, `authz.policy_check` | info / warning |
| `config.*` | `config.update`, `config.reload`, `config.hot_reload` | warning |
| `tool.*` | `tool.execute`, `tool.sandbox_escape_attempt`, `tool.timeout` | info / critical |
| `memory.*` | `memory.store`, `memory.recall`, `memory.delete`, `memory.compact` | info |
| `channel.*` | `channel.connect`, `channel.disconnect`, `channel.error` | info / warning |
| `evolution.*` | `evolution.propose`, `evolution.apply`, `evolution.rollback` | warning / critical |
| `plugin.*` | `plugin.load`, `plugin.unload`, `plugin.error`, `plugin.permission_denied` | info / warning |
| `session.*` | `session.create`, `session.terminate`, `session.timeout` | info |

## الإعداد

```toml
[security.audit]
enabled = true
min_severity = "info"           # minimum severity to log: "info", "warning", "critical"

[security.audit.file]
enabled = true
path = "~/.local/share/openprx/audit.log"
format = "jsonl"                # "jsonl" or "csv"
max_size_mb = 100               # rotate when file exceeds this size
max_files = 10                  # keep up to 10 rotated files
compress_rotated = true         # gzip rotated files

[security.audit.database]
enabled = false
backend = "sqlite"              # "sqlite" or "postgres"
path = "~/.local/share/openprx/audit.db"
retention_days = 90             # auto-delete events older than 90 days
```

## مرجع الإعداد

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|-----------|-------|
| `enabled` | `bool` | `true` | تفعيل أو تعطيل تسجيل التدقيق عالميًا |
| `min_severity` | `String` | `"info"` | الحد الأدنى لمستوى الشدة الذي يتم تسجيله |
| `file.enabled` | `bool` | `true` | كتابة أحداث التدقيق إلى ملف سجل |
| `file.path` | `String` | `"~/.local/share/openprx/audit.log"` | مسار ملف سجل التدقيق |
| `file.format` | `String` | `"jsonl"` | تنسيق السجل: `"jsonl"` (كائن JSON واحد لكل سطر) أو `"csv"` |
| `file.max_size_mb` | `u64` | `100` | الحجم الأقصى للملف قبل التدوير (MB) |
| `file.max_files` | `u32` | `10` | عدد الملفات المدورة المحتفظ بها |
| `file.compress_rotated` | `bool` | `true` | ضغط ملفات السجل المدورة باستخدام gzip |
| `database.enabled` | `bool` | `false` | كتابة أحداث التدقيق إلى قاعدة بيانات |
| `database.backend` | `String` | `"sqlite"` | الواجهة الخلفية لقاعدة البيانات: `"sqlite"` أو `"postgres"` |
| `database.path` | `String` | `""` | مسار قاعدة البيانات (SQLite) أو عنوان اتصال (PostgreSQL) |
| `database.retention_days` | `u64` | `90` | حذف تلقائي للأحداث الأقدم من N يومًا. 0 = الاحتفاظ دائمًا |

## واجهات التخزين الخلفية

### ملف (JSONL)

الواجهة الافتراضية تكتب كائن JSON واحدًا لكل سطر في ملف سجل. هذا التنسيق متوافق مع أدوات تحليل السجلات الشائعة (jq, grep, Elasticsearch ingest).

مثال على إدخال سجل:

```json
{
  "timestamp": "2026-03-21T10:15:30.123456789Z",
  "event_id": "019520a8-1234-7000-8000-000000000001",
  "actor": {"type": "user", "id": "user:telegram:123456789"},
  "action": "tool.execute",
  "target": "shell:ls -la /tmp",
  "outcome": "success",
  "metadata": {"sandbox": "bubblewrap", "duration_ms": 45},
  "session_id": "sess_abc123",
  "severity": "info"
}
```

### قاعدة بيانات (SQLite / PostgreSQL)

تخزّن واجهة قاعدة البيانات الأحداث في جدول منظَّم مع فهارس على `timestamp` و`actor` و`action` و`severity` للاستعلام بكفاءة.

## الاستعلام عن مسارات التدقيق

### استعلامات CLI

```bash
# View recent audit events
prx audit log --tail 50

# Filter by action category
prx audit log --action "auth.*" --last 24h

# Filter by severity
prx audit log --severity critical --last 7d

# Filter by actor
prx audit log --actor "user:telegram:123456789"

# Export to JSON
prx audit log --last 30d --format json > audit_export.json
```

### استعلامات قاعدة البيانات

عند استخدام واجهة قاعدة البيانات، يمكنك الاستعلام مباشرة باستخدام SQL:

```sql
-- Failed authentication attempts in the last 24 hours
SELECT * FROM audit_events
WHERE action LIKE 'auth.%'
  AND outcome = 'failure'
  AND timestamp > datetime('now', '-24 hours')
ORDER BY timestamp DESC;

-- Tool execution by a specific user
SELECT action, target, outcome, timestamp
FROM audit_events
WHERE actor_id = 'user:telegram:123456789'
  AND action LIKE 'tool.%'
ORDER BY timestamp DESC
LIMIT 100;

-- Critical events summary
SELECT action, COUNT(*) as count
FROM audit_events
WHERE severity = 'critical'
  AND timestamp > datetime('now', '-7 days')
GROUP BY action
ORDER BY count DESC;
```

## الامتثال

صُمم نظام تسجيل التدقيق لدعم متطلبات الامتثال:

- **عدم القابلية للتغيير** -- ملفات السجل بإلحاق فقط؛ ويمكن التحقق من سلامة الملفات المدورة عبر checksums
- **الاكتمال** -- تُسجَّل جميع العمليات المرتبطة بالأمان افتراضيًا عند مستوى `info`
- **الاحتفاظ** -- فترات احتفاظ قابلة للضبط مع تدوير وحذف تلقائيين
- **عدم الإنكار** -- كل حدث يتضمن هوية الجهة المنفذة وطابعًا زمنيًا
- **الإتاحة** -- مخرجات مزدوجة (ملف + قاعدة بيانات) لضمان عدم فقدان الأحداث عند فشل إحدى الواجهات

### الإعدادات الموصى بها للامتثال

```toml
[security.audit]
enabled = true
min_severity = "info"

[security.audit.file]
enabled = true
format = "jsonl"
max_size_mb = 500
max_files = 50
compress_rotated = true

[security.audit.database]
enabled = true
backend = "postgres"
path = "postgresql://audit_user:password@localhost/prx_audit"
retention_days = 365
```

## الأداء

صُمم مسجل التدقيق لتقليل الحمل إلى الحد الأدنى:

- تُكتب الأحداث بشكل غير متزامن عبر قناة محدودة (السعة الافتراضية: 10,000 حدث)
- تُخزَّن كتابات الملفات مؤقتًا وتُفرَّغ دوريًا (كل ثانية واحدة أو كل 100 حدث)
- تُكتب قاعدة البيانات على دفعات (الحجم الافتراضي للدفعة: 50 حدثًا)
- إذا كانت قناة الأحداث ممتلئة، تُسقط الأحداث مع عداد تحذير (دون حجب حلقة الوكيل الرئيسية)

## القيود

- واجهة الملف لا توفّر كشف عبث مدمجًا (فكّر في مراقبة سلامة خارجية للنشرات عالية الأمان)
- أحداث التدقيق القادمة من كود الإضافات تُسجَّل بواسطة المضيف؛ لا يمكن للإضافات تجاوز نظام التدقيق
- تنسيق CSV لا يدعم حقول metadata المتداخلة (استخدم JSONL لدقة كاملة)
- تنظيف الاحتفاظ في قاعدة البيانات يعمل مرة كل ساعة؛ قد تبقى الأحداث لفترة تتجاوز قليلًا فترة الاحتفاظ المضبوطة

## صفحات ذات صلة

- [نظرة عامة على الأمان](./)
- [محرك السياسات](./policy-engine) -- قرارات التفويض التي تولد أحداث تدقيق
- [Sandbox](./sandbox) -- عزل تنفيذ الأدوات
- [نموذج التهديد](./threat-model) -- معمارية الأمان وحدود الثقة

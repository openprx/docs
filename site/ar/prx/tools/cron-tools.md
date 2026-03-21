---
title: أدوات Cron
description: تسع أدوات لإنشاء المهام المجدولة وإدارتها وتشغيلها باستخدام تعبيرات cron ومحرك المهام الذاتي Xin.
---

# أدوات Cron

يوفّر PRX تسع أدوات لأتمتة المهام المعتمدة على الوقت، وتشمل إدارة وظائف cron التقليدية ومحرك الجدولة المتقدم Xin. تتيح هذه الأدوات للوكيل إنشاء مهام مجدولة، وفحص سجل التشغيل، وتشغيل المهام يدويًا، وتنسيق العمليات الخلفية وفق جداول متكررة.

تنقسم أدوات cron إلى نظامين: **النظام الفرعي cron** للوظائف المجدولة القياسية باستخدام تعبيرات cron، و**محرك Xin** لجدولة المهام المتقدمة مع سلاسل الاعتماد، والتنفيذ الشرطي، والتكامل مع خط أنابيب التطور الذاتي.

تُسجَّل جميع أدوات cron والجدولة في سجل `all_tools()` وتكون متاحة كلما كان الـ daemon قيد التشغيل.

## الإعداد

### نظام Cron

```toml
[cron]
enabled = true
timezone = "UTC"           # Timezone for cron expressions

# Define built-in scheduled tasks
[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"     # Every day at 09:00 UTC
action = "agent"
prompt = "Generate a daily summary report and send it to the user."

[[cron.tasks]]
name = "memory-cleanup"
schedule = "0 3 * * *"     # Every day at 03:00 UTC
action = "agent"
prompt = "Run memory hygiene: archive old daily entries and compact core memories."

[[cron.tasks]]
name = "repo-check"
schedule = "*/30 * * * *"  # Every 30 minutes
action = "shell"
command = "cd /home/user/project && git fetch --all"
```

### محرك Xin

```toml
[xin]
enabled = true
interval_minutes = 5            # Tick interval in minutes (minimum 1)
max_concurrent = 4              # Maximum concurrent task executions per tick
max_tasks = 128                 # Maximum total tasks in the store
stale_timeout_minutes = 60      # Minutes before a running task is marked stale
builtin_tasks = true            # Auto-register built-in system tasks
evolution_integration = false   # Let Xin manage evolution/fitness scheduling
```

## مرجع الأدوات

### cron_add

يضيف وظيفة cron جديدة مع تعبير cron، وأمر أو prompt، ووصف اختياري.

```json
{
  "name": "cron_add",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 2 * * *",
    "action": "shell",
    "command": "tar czf /tmp/workspace-$(date +%Y%m%d).tar.gz /home/user/workspace",
    "description": "Daily workspace backup at 2 AM"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | اسم فريد لوظيفة cron |
| `schedule` | `string` | Yes | -- | تعبير Cron (خمسة حقول: minute hour day month weekday) |
| `action` | `string` | Yes | -- | نوع الإجراء: `"shell"` (تشغيل أمر) أو `"agent"` (تشغيل prompt للوكيل) |
| `command` | `string` | Conditional | -- | أمر shell (مطلوب عندما `action = "shell"`) |
| `prompt` | `string` | Conditional | -- | prompt الوكيل (مطلوب عندما `action = "agent"`) |
| `description` | `string` | No | -- | وصف مقروء للبشر |

### cron_list

يسرد جميع وظائف cron المسجلة مع الجداول والحالة وموعد التشغيل التالي.

```json
{
  "name": "cron_list",
  "arguments": {}
}
```

لا توجد معاملات مطلوبة. يعيد جدولًا بكل وظائف cron.

### cron_remove

يزيل وظيفة cron بالاسم أو المعرّف.

```json
{
  "name": "cron_remove",
  "arguments": {
    "name": "backup-workspace"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | الاسم أو المعرّف لوظيفة cron المراد حذفها |

### cron_update

يحدّث جدول وظيفة cron موجودة، أو أمرها، أو إعداداتها.

```json
{
  "name": "cron_update",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 4 * * *",
    "description": "Daily workspace backup at 4 AM (shifted)"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | اسم وظيفة cron المطلوب تحديثها |
| `schedule` | `string` | No | -- | تعبير cron الجديد |
| `command` | `string` | No | -- | أمر shell جديد |
| `prompt` | `string` | No | -- | prompt وكيل جديد |
| `description` | `string` | No | -- | وصف جديد |

### cron_run

يشغّل وظيفة cron يدويًا فورًا خارج جدولها المعتاد.

```json
{
  "name": "cron_run",
  "arguments": {
    "name": "daily-report"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | اسم وظيفة cron المراد تشغيلها |

### cron_runs

يعرض سجل التنفيذ وسجلات التشغيل لوظائف cron. ويظهر عمليات التنفيذ السابقة مع الطوابع الزمنية والحالة والمخرجات.

```json
{
  "name": "cron_runs",
  "arguments": {
    "name": "daily-report",
    "limit": 10
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | `string` | No | -- | التصفية حسب اسم الوظيفة. إذا لم يُمرَّر، تظهر جميع التشغيلات الحديثة. |
| `limit` | `integer` | No | `20` | الحد الأقصى لعدد عناصر السجل المعادة |

### schedule

يجدول مهمة لمرة واحدة أو مهمة متكررة باستخدام تعبيرات زمنية باللغة الطبيعية. هذه واجهة أعلى مستوى من تعبيرات cron الخام.

```json
{
  "name": "schedule",
  "arguments": {
    "when": "in 30 minutes",
    "action": "agent",
    "prompt": "Check if the deployment completed and report the status."
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `when` | `string` | Yes | -- | تعبير زمني بلغة طبيعية (مثل `"in 30 minutes"`, `"tomorrow at 9am"`, `"every Monday at 10:00"`) |
| `action` | `string` | Yes | -- | نوع الإجراء: `"shell"` أو `"agent"` |
| `command` | `string` | Conditional | -- | أمر shell (لإجراء `"shell"`) |
| `prompt` | `string` | Conditional | -- | prompt الوكيل (لإجراء `"agent"`) |

### cron (Legacy)

نقطة دخول cron قديمة للتوافق مع الإصدارات السابقة. توجّه الطلب إلى أداة cron المناسبة حسب معامل action.

```json
{
  "name": "cron",
  "arguments": {
    "action": "list"
  }
}
```

### xin

محرك الجدولة Xin لأتمتة المهام المتقدمة مع سلاسل الاعتماد والتنفيذ الشرطي.

```json
{
  "name": "xin",
  "arguments": {
    "action": "status"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | الإجراء: `"status"`, `"tasks"`, `"run"`, `"pause"`, `"resume"` |

## صيغة تعبير Cron

يستخدم PRX تعبيرات cron القياسية ذات خمسة حقول:

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
```

**أمثلة:**

| Expression | Description |
|-----------|-------------|
| `0 9 * * *` | كل يوم الساعة 9:00 صباحًا |
| `*/15 * * * *` | كل 15 دقيقة |
| `0 9 * * 1-5` | أيام الأسبوع الساعة 9:00 صباحًا |
| `0 0 1 * *` | أول يوم من كل شهر عند منتصف الليل |
| `30 8,12,18 * * *` | يوميًا عند 8:30 و12:30 و18:30 |

## محرك Xin

محرك Xin هو مجدول مهام متقدم يتجاوز التوقيت البسيط في cron:

- **سلاسل الاعتماد**: يمكن أن تعتمد المهام على الإكمال الناجح لمهام أخرى
- **تنفيذ شرطي**: تعمل المهام فقط عند تحقق شروط محددة
- **مهام مدمجة**: تُسجّل مهام صيانة النظام (heartbeat, memory hygiene, log rotation) تلقائيًا عند `builtin_tasks = true`
- **تكامل التطور**: عند `evolution_integration = true` يدير Xin جدول التطور الذاتي وفحوص الملاءمة
- **اكتشاف المهام الراكدة**: المهام التي تتجاوز `stale_timeout_minutes` تُوسم كراكدة ويمكن تنظيفها
- **تنفيذ متوازٍ**: يمكن تشغيل عدة مهام بالتوازي، مع حد أقصى تحدده `max_concurrent`

## الاستخدام

### إدارة Cron عبر CLI

```bash
# List all cron jobs
prx cron list

# Add a new cron job
prx cron add --name "check-updates" --schedule "0 */6 * * *" --action agent --prompt "Check for package updates"

# Manually trigger a job
prx cron run daily-report

# View run history
prx cron runs --name daily-report --limit 5

# Remove a job
prx cron remove check-updates
```

### حالة Xin

```bash
# Check Xin engine status
prx xin status

# List all Xin tasks
prx xin tasks
```

## الأمان

### عزل أوامر Shell

وظائف cron التي تستخدم `action = "shell"` تُنفَّذ عبر نفس sandbox الخاص بأداة `shell`. وتُطبَّق واجهة sandbox الخلفية المضبوطة (Landlock, Firejail, Bubblewrap, Docker) على الأوامر المجدولة.

### أمان Prompt الوكيل

وظائف cron التي تستخدم `action = "agent"` تنشئ جلسة وكيل جديدة بالـ prompt المحدد. وترث الجلسة سياسات الأمان وقيود الأدوات وحدود الموارد الخاصة بالـ daemon.

### محرك السياسات

تخضع أدوات cron لمحرك سياسات الأمان:

```toml
[security.tool_policy.groups]
automation = "allow"

[security.tool_policy.tools]
cron_add = "supervised"    # Require approval to add new jobs
cron_remove = "supervised" # Require approval to remove jobs
cron_run = "allow"         # Allow manual triggers
```

### سجلات التدقيق

تُسجَّل جميع عمليات cron في سجل التدقيق: إنشاء الوظائف وتعديلها وحذفها، والتشغيل اليدوي، ونتائج التنفيذ.

### حدود الموارد

تشارك المهام المجدولة حدود موارد الـ daemon. ويمنع إعداد `max_concurrent` في محرك Xin استنزاف الموارد بسبب كثرة المهام المتزامنة.

## مرتبط

- [Cron System](/ar/prx/cron/) -- البنية والمهام المدمجة
- [Cron Heartbeat](/ar/prx/cron/heartbeat) -- مراقبة الصحة
- [Cron Tasks](/ar/prx/cron/tasks) -- مهام الصيانة المدمجة
- [Self-Evolution](/ar/prx/self-evolution/) -- تكامل التطور في Xin
- [Shell Execution](/ar/prx/tools/shell) -- sandbox لوظائف cron المعتمدة على shell
- [Configuration Reference](/ar/prx/config/reference) -- إعدادات `[cron]` و`[xin]`
- [Tools Overview](/ar/prx/tools/) -- جميع الأدوات ونظام السجل

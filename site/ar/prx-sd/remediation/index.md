---
title: الاستجابة للتهديدات
description: "تهيئة معالجة التهديدات التلقائية مع سياسات الاستجابة وتنظيف الثبات وعزل الشبكة."
---

# الاستجابة للتهديدات

يوفر محرك المعالجة في PRX-SD استجابة آلية للتهديدات تتخطى مجرد الكشف. عند تحديد تهديد، يمكن للمحرك اتخاذ إجراءات متدرجة تتراوح من التسجيل إلى العزل الكامل للشبكة، بحسب السياسة المُهيَّأة.

## أنواع الاستجابة

| الإجراء | الوصف | قابل للعكس | يتطلب الجذر |
|--------|-------------|-----------|--------------|
| **التبليغ** | تسجيل الاكتشاف والاستمرار. لا إجراء على الملف. | لا ينطبق | لا |
| **العزل** | تشفير ونقل الملف إلى قبو العزل. | نعم | لا |
| **الحظر** | رفض الوصول إلى الملف/تنفيذه عبر fanotify (الوقت الفعلي على لينكس فقط). | نعم | نعم |
| **الإنهاء** | إنهاء العملية التي أنشأت الملف الضار أو تستخدمه. | لا | نعم |
| **التنظيف** | إزالة المحتوى الضار من الملف مع الحفاظ على الأصل (مثل إزالة الماكرو من مستندات Office). | جزئي | لا |
| **الحذف** | حذف الملف الضار نهائياً من القرص. | لا | لا |
| **العزل الكامل** | حظر جميع وصول الشبكة للجهاز باستخدام قواعد جدار الحماية. | نعم | نعم |
| **قائمة الحظر** | إضافة هاش الملف إلى قائمة الحظر المحلية للفحوصات المستقبلية. | نعم | لا |

## تهيئة السياسة

### استخدام أوامر sd policy

```bash
# عرض السياسة الحالية
sd policy show

# ضبط سياسة الاكتشافات الضارة
sd policy set on_malicious quarantine

# ضبط سياسة الاكتشافات المشبوهة
sd policy set on_suspicious report

# إعادة الضبط للافتراضيات
sd policy reset
```

### مثال على المخرجات

```bash
sd policy show
```

```
Threat Response Policy
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### ملف الإعدادات

ضبط السياسات في `~/.prx-sd/config.toml`:

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # auto-add malicious hashes to local blocklist
clean_persistence = true        # remove persistence mechanisms on malicious detection
network_isolate = false         # enable network isolation for critical threats

[policy.notify]
webhook = true
email = false

[policy.escalation]
# Escalate to stronger action if same threat reappears
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
سياستا `on_malicious` و`on_suspicious` تقبلان مجموعات إجراءات مختلفة. الإجراءات المدمِّرة مثل `kill` و`delete` متاحة فقط لـ `on_malicious`.
:::

## تنظيف الثبات

عند تمكين `clean_persistence`، يفحص PRX-SD ويزيل آليات الثبات التي قد تكون البرامج الضارة قد ثبَّتتها. يعمل هذا تلقائياً بعد عزل التهديد أو حذفه.

### نقاط الثبات على لينكس

| الموقع | التقنية | إجراء التنظيف |
|----------|-----------|----------------|
| `/etc/cron.d/`, `/var/spool/cron/` | مهام Cron | إزالة إدخالات cron الضارة |
| `/etc/systemd/system/` | خدمات systemd | تعطيل وإزالة الوحدات الضارة |
| `~/.config/systemd/user/` | خدمات systemd للمستخدم | تعطيل وإزالة |
| `~/.bashrc`, `~/.profile` | حقن Shell RC | إزالة الأسطر المحقونة |
| `~/.ssh/authorized_keys` | مفاتيح SSH للباب الخلفي | إزالة المفاتيح غير المصرح بها |
| `/etc/ld.so.preload` | اختطاف LD_PRELOAD | إزالة إدخالات preload الضارة |
| `/etc/init.d/` | سكريبتات init SysV | إزالة السكريبتات الضارة |

### نقاط الثبات على macOS

| الموقع | التقنية | إجراء التنظيف |
|----------|-----------|----------------|
| `~/Library/LaunchAgents/` | ملفات plist لـ LaunchAgent | إلغاء التحميل والإزالة |
| `/Library/LaunchDaemons/` | ملفات plist لـ LaunchDaemon | إلغاء التحميل والإزالة |
| `~/Library/Application Support/` | عناصر تسجيل الدخول | إزالة العناصر الضارة |
| `/Library/StartupItems/` | عناصر بدء التشغيل | إزالة |
| `~/.zshrc`, `~/.bash_profile` | حقن Shell RC | إزالة الأسطر المحقونة |
| Keychain | إساءة استخدام Keychain | تنبيه (بدون تنظيف تلقائي) |

### نقاط الثبات على ويندوز

| الموقع | التقنية | إجراء التنظيف |
|----------|-----------|----------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | مفاتيح Run في السجل | إزالة القيم الضارة |
| `HKLM\SYSTEM\CurrentControlSet\Services` | الخدمات الضارة | إيقاف وتعطيل وإزالة |
| مجلد `Startup` | اختصارات بدء التشغيل | إزالة الاختصارات الضارة |
| Task Scheduler | المهام المجدولة | حذف المهام الضارة |
| اشتراكات WMI | مستهلكو أحداث WMI | إزالة الاشتراكات الضارة |

::: warning
يُعدِّل تنظيف الثبات ملفات إعدادات النظام وإدخالات السجل. راجع سجل التنظيف في `~/.prx-sd/remediation.log` بعد كل عملية للتحقق من إزالة الإدخالات الضارة فقط.
:::

## عزل الشبكة

للتهديدات الحرجة (برامج الفدية النشطة، استخراج البيانات)، يمكن لـ PRX-SD عزل الجهاز عن الشبكة:

### لينكس (iptables)

```bash
# PRX-SD adds these rules automatically when isolating
iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD configures pf rules
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

رفع العزل:

```bash
sd isolate lift
```

::: warning
يحظر عزل الشبكة جميع حركة مرور الشبكة بما فيها SSH. تأكد من وجود وصول فيزيائي أو عبر وحدة التحكم خارج النطاق قبل تمكين عزل الشبكة التلقائي.
:::

## سجل المعالجة

تُسجَّل جميع إجراءات المعالجة في `~/.prx-sd/remediation.log`:

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## أمثلة

```bash
# ضبط سياسة صارمة للخوادم
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# ضبط سياسة محافظة لمحطات العمل
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# الفحص مع معالجة صريحة
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# فحص ورفع عزل الشبكة
sd isolate status
sd isolate lift

# عرض سجل المعالجة
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## الخطوات التالية

- [إدارة العزل](/ar/prx-sd/quarantine/) -- إدارة الملفات المعزولة
- [حماية برامج الفدية](/ar/prx-sd/realtime/ransomware) -- استجابة متخصصة لبرامج الفدية
- [تنبيهات Webhook](/ar/prx-sd/alerts/webhook) -- إشعار بإجراءات المعالجة
- [تنبيهات البريد الإلكتروني](/ar/prx-sd/alerts/email) -- إشعارات البريد الإلكتروني للتهديدات

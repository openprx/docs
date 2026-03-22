---
title: تنبيهات البريد الإلكتروني
description: تهيئة إشعارات البريد الإلكتروني لاكتشافات التهديدات ونتائج الفحص في PRX-SD.
---

# تنبيهات البريد الإلكتروني

يمكن لـ PRX-SD إرسال إشعارات بريد إلكتروني عند اكتشاف التهديدات أو اكتمال الفحوصات أو حدوث أحداث حرجة. تُكمِّل تنبيهات البريد الإلكتروني الـ webhooks للبيئات التي يكون فيها البريد الإلكتروني القناة الاتصالية الرئيسية أو للوصول إلى موظفي الاستدعاء.

## الاستخدام

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### الأوامر الفرعية

| الأمر الفرعي | الوصف |
|------------|-------------|
| `configure` | إعداد خادم SMTP وإعدادات المستلم |
| `test` | إرسال بريد إلكتروني اختباري للتحقق من الإعداد |
| `send` | إرسال بريد إلكتروني تنبيه يدوياً |
| `status` | عرض حالة إعداد البريد الإلكتروني الحالية |

## تهيئة البريد الإلكتروني

### الإعداد التفاعلي

```bash
sd email-alert configure
```

يطلب معالج الإعداد التفاعلي:

```
SMTP Server: smtp.gmail.com
SMTP Port [587]: 587
Use TLS [yes]: yes
Username: alerts@example.com
Password: ********
From Address [alerts@example.com]: prx-sd@example.com
From Name [PRX-SD]: PRX-SD Scanner
Recipients (comma-separated): security@example.com, oncall@example.com
Min Severity [suspicious]: malicious
```

### الإعداد عبر سطر الأوامر

```bash
sd email-alert configure \
  --smtp-server smtp.gmail.com \
  --smtp-port 587 \
  --tls true \
  --username alerts@example.com \
  --password "app-password-here" \
  --from "prx-sd@example.com" \
  --from-name "PRX-SD Scanner" \
  --to "security@example.com,oncall@example.com" \
  --min-severity malicious
```

### ملف الإعدادات

تُخزَّن إعدادات البريد الإلكتروني في `~/.prx-sd/config.toml`:

```toml
[email]
enabled = true
min_severity = "malicious"    # suspicious | malicious
events = ["threat_detected", "ransomware_alert", "scan_completed"]

[email.smtp]
server = "smtp.gmail.com"
port = 587
tls = true
username = "alerts@example.com"
# Password stored encrypted - use 'sd email-alert configure' to set

[email.message]
from_address = "prx-sd@example.com"
from_name = "PRX-SD Scanner"
recipients = ["security@example.com", "oncall@example.com"]
subject_prefix = "[PRX-SD]"
```

::: tip
لـ Gmail، استخدم كلمة مرور التطبيق بدلاً من كلمة مرور حسابك. انتقل إلى حساب Google > الأمان > التحقق بخطوتين > كلمات مرور التطبيق لإنشاء واحدة.
:::

## اختبار البريد الإلكتروني

إرسال بريد إلكتروني اختباري للتحقق من إعدادك:

```bash
sd email-alert test
```

```
Sending test email to security@example.com, oncall@example.com...
  SMTP connection:  OK (smtp.gmail.com:587, TLS)
  Authentication:   OK
  Delivery:         OK (Message-ID: <prx-sd-test-a1b2c3@example.com>)

Test email sent successfully.
```

## إرسال تنبيهات يدوية

تشغيل بريد إلكتروني تنبيه يدوياً (مفيد لاختبار التكاملات أو إعادة توجيه النتائج):

```bash
# إرسال تنبيه عن ملف محدد
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# إرسال ملخص فحص
sd email-alert send --scan-report /tmp/scan-results.json
```

## محتوى البريد الإلكتروني

### بريد إلكتروني لاكتشاف التهديد

```
Subject: [PRX-SD] MALICIOUS: Win_Trojan_AgentTesla detected on web-server-01

PRX-SD Threat Detection Alert
==============================

Host:       web-server-01
Timestamp:  2026-03-21 10:15:32 UTC
Severity:   MALICIOUS

File:       /tmp/payload.exe
SHA-256:    e3b0c44298fc1c149afbf4c8996fb924...
Size:       240 KB
Type:       PE32 executable (GUI) Intel 80386, for MS Windows

Detection:  Win_Trojan_AgentTesla
Engine:     YARA (neo23x0/signature-base)

Action Taken: Quarantined (ID: a1b2c3d4)

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

### بريد إلكتروني ملخص الفحص

```
Subject: [PRX-SD] Scan Complete: 3 threats found in /home

PRX-SD Scan Report
===================

Host:           web-server-01
Scan Path:      /home
Started:        2026-03-21 10:00:00 UTC
Completed:      2026-03-21 10:12:45 UTC
Duration:       12 minutes 45 seconds

Files Scanned:  45,231
Threats Found:  3

Detections:
  1. /home/user/downloads/crack.exe
     Severity: MALICIOUS | Detection: Win_Trojan_Agent
     Action: Quarantined

  2. /home/user/.cache/tmp/loader.sh
     Severity: MALICIOUS | Detection: Linux_Backdoor_Generic
     Action: Quarantined

  3. /home/user/scripts/util.py
     Severity: SUSPICIOUS | Detection: Heuristic_HighEntropy
     Action: Reported

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

## الأحداث المدعومة

| الحدث | مُضمَّن افتراضياً | الوصف |
|-------|-----------------|-------------|
| `threat_detected` | نعم | اكتشاف ملف ضار أو مشبوه |
| `ransomware_alert` | نعم | اكتشاف سلوك برامج الفدية |
| `scan_completed` | لا | اكتمال مهمة الفحص (فقط إذا وُجدت تهديدات) |
| `update_completed` | لا | اكتمال تحديث التوقيعات |
| `update_failed` | نعم | فشل تحديث التوقيعات |
| `daemon_error` | نعم | واجه الـ daemon خطأً حرجاً |

تهيئة الأحداث التي تُشغِّل رسائل البريد الإلكتروني:

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## تحديد المعدل

لمنع إغراق البريد الإلكتروني أثناء حالات الاندلاع الكبيرة:

```toml
[email.rate_limit]
max_per_hour = 10            # Maximum emails per hour
digest_mode = true           # Batch multiple alerts into a single email
digest_interval_mins = 15    # Digest batch window
```

عند تمكين `digest_mode`، تُجمَّع التنبيهات ضمن نافذة الملخص في بريد إلكتروني ملخص واحد بدلاً من إرسال إشعارات فردية.

## فحص الحالة

```bash
sd email-alert status
```

```
Email Alert Status
  Enabled:      true
  SMTP Server:  smtp.gmail.com:587 (TLS)
  From:         prx-sd@example.com
  Recipients:   security@example.com, oncall@example.com
  Min Severity: malicious
  Events:       threat_detected, ransomware_alert, daemon_error
  Last Sent:    2026-03-21 10:15:32 UTC
  Emails Today: 2
```

## الخطوات التالية

- [تنبيهات Webhook](./webhook) -- إشعارات webhook في الوقت الفعلي
- [الفحوصات المجدولة](./schedule) -- أتمتة الفحوصات المتكررة
- [الاستجابة للتهديدات](/ar/prx-sd/remediation/) -- سياسات المعالجة الآلية
- [الـ Daemon](/ar/prx-sd/realtime/daemon) -- الحماية الخلفية مع التنبيهات

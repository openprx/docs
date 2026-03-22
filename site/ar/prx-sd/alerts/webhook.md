---
title: تنبيهات Webhook
description: تهيئة إشعارات webhook لاكتشافات التهديدات وأحداث العزل ونتائج الفحص في PRX-SD.
---

# تنبيهات Webhook

يمكن لـ PRX-SD إرسال إشعارات في الوقت الفعلي إلى نقاط نهاية webhook عند اكتشاف التهديدات أو عزل الملفات أو اكتمال الفحوصات. تتكامل Webhooks مع Slack وDiscord وMicrosoft Teams وPagerDuty أو أي نقطة نهاية HTTP مخصصة.

## الاستخدام

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### الأوامر الفرعية

| الأمر الفرعي | الوصف |
|------------|-------------|
| `add` | تسجيل نقطة نهاية webhook جديدة |
| `remove` | إزالة webhook مسجَّل |
| `list` | سرد جميع webhooks المسجَّلة |
| `test` | إرسال إشعار اختبار إلى webhook |

## إضافة Webhooks

```bash
sd webhook add [OPTIONS] <URL>
```

| العلم | المختصر | الافتراضي | الوصف |
|------|-------|---------|-------------|
| `--format` | `-f` | `generic` | تنسيق الحمولة: `slack`, `discord`, `teams`, `generic` |
| `--name` | `-n` | تلقائي | اسم قابل للقراءة لهذا الـ webhook |
| `--events` | `-e` | الكل | أحداث مفصولة بفواصل للإشعار بها |
| `--secret` | `-s` | | سر توقيع HMAC-SHA256 للتحقق من الحمولة |
| `--min-severity` | | `suspicious` | الحد الأدنى للخطورة للتشغيل: `suspicious`, `malicious` |

### الأحداث المدعومة

| الحدث | الوصف |
|-------|-------------|
| `threat_detected` | اكتشاف ملف ضار أو مشبوه |
| `file_quarantined` | نقل ملف إلى العزل |
| `scan_completed` | اكتمال مهمة فحص |
| `update_completed` | اكتمال تحديث التوقيعات |
| `ransomware_alert` | اكتشاف سلوك برامج الفدية |
| `daemon_status` | بدء أو إيقاف الـ daemon أو حدوث خطأ |

### أمثلة

```bash
# إضافة webhook لـ Slack
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# إضافة webhook لـ Discord
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# إضافة webhook عام مع توقيع HMAC
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# إضافة webhook لتنبيهات التهديدات الضارة فقط
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## سرد Webhooks

```bash
sd webhook list
```

```
Registered Webhooks (3)

Name              Format    Events              Min Severity  URL
security-alerts   slack     all                 suspicious    https://hooks.slack.com/...XXXX
av-alerts         discord   all                 suspicious    https://discord.com/...defg
siem-ingest       generic   all                 suspicious    https://siem.example.com/...
```

## إزالة Webhooks

```bash
# إزالة بالاسم
sd webhook remove security-alerts

# إزالة بالـ URL
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## اختبار Webhooks

إرسال إشعار اختبار للتحقق من الاتصال:

```bash
# اختبار webhook محدد
sd webhook test security-alerts

# اختبار جميع Webhooks
sd webhook test --all
```

يرسل الاختبار حمولة نموذجية لاكتشاف تهديد حتى تتمكن من التحقق من التنسيق والتسليم.

## تنسيقات الحمولة

### التنسيق العام

يرسل التنسيق الافتراضي `generic` حمولة JSON عبر HTTP POST:

```json
{
  "event": "threat_detected",
  "timestamp": "2026-03-21T10:15:32Z",
  "hostname": "web-server-01",
  "threat": {
    "file": "/tmp/payload.exe",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "size": 245760,
    "severity": "malicious",
    "detection": {
      "engine": "yara",
      "rule": "Win_Trojan_AgentTesla",
      "source": "neo23x0/signature-base"
    }
  },
  "action_taken": "quarantined",
  "quarantine_id": "a1b2c3d4"
}
```

الترويسات المُدرَجة مع الحمولات العامة:

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (if secret configured)
```

### تنسيق Slack

تستقبل webhooks Slack رسالة مُنسَّقة مع خطورة مرمَّزة بالألوان:

```json
{
  "attachments": [{
    "color": "#ff0000",
    "title": "Threat Detected: Win_Trojan_AgentTesla",
    "fields": [
      {"title": "File", "value": "/tmp/payload.exe", "short": false},
      {"title": "Severity", "value": "MALICIOUS", "short": true},
      {"title": "Action", "value": "Quarantined", "short": true},
      {"title": "Host", "value": "web-server-01", "short": true},
      {"title": "SHA-256", "value": "`e3b0c44298fc...`", "short": false}
    ],
    "ts": 1742554532
  }]
}
```

### تنسيق Discord

تستخدم webhooks Discord تنسيق embeds:

```json
{
  "embeds": [{
    "title": "Threat Detected",
    "description": "**Win_Trojan_AgentTesla** found in `/tmp/payload.exe`",
    "color": 16711680,
    "fields": [
      {"name": "Severity", "value": "MALICIOUS", "inline": true},
      {"name": "Action", "value": "Quarantined", "inline": true},
      {"name": "Host", "value": "web-server-01", "inline": true}
    ],
    "timestamp": "2026-03-21T10:15:32Z"
  }]
}
```

## ملف الإعدادات

يمكن أيضاً تهيئة Webhooks في `~/.prx-sd/config.toml`:

```toml
[[webhook]]
name = "security-alerts"
url = "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
format = "slack"
events = ["threat_detected", "ransomware_alert", "file_quarantined"]
min_severity = "suspicious"

[[webhook]]
name = "siem-ingest"
url = "https://siem.example.com/api/v1/alerts"
format = "generic"
secret = "my-hmac-secret"
events = ["threat_detected"]
min_severity = "malicious"
```

::: tip
تُخزَّن أسرار الـ Webhook مُشفَّرة في ملف الإعدادات. استخدم `sd webhook add --secret` لضبطها بأمان بدلاً من تحرير ملف الإعدادات مباشرةً.
:::

## سلوك إعادة المحاولة

تُعاد محاولة تسليمات Webhook الفاشلة بتراجع أسي:

| المحاولة | التأخير |
|---------|-------|
| المحاولة الأولى | 5 ثوانٍ |
| المحاولة الثانية | 30 ثانية |
| المحاولة الثالثة | 5 دقائق |
| المحاولة الرابعة | 30 دقيقة |
| (التوقف) | تُسجَّل الحدث كغير قابل للتسليم |

## الخطوات التالية

- [تنبيهات البريد الإلكتروني](./email) -- تهيئة إشعارات البريد الإلكتروني
- [الفحوصات المجدولة](./schedule) -- إعداد مهام فحص متكررة
- [الاستجابة للتهديدات](/ar/prx-sd/remediation/) -- تهيئة المعالجة الآلية
- [الـ Daemon](/ar/prx-sd/realtime/daemon) -- المراقبة الخلفية مع التنبيهات

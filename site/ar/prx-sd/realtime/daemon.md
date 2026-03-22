---
title: عملية Daemon
description: تشغيل PRX-SD كـ daemon خلفي مع تحديثات التوقيعات التلقائية ومراقبة الملفات المستمرة.
---

# عملية Daemon

يبدأ الأمر `sd daemon` تشغيل PRX-SD كعملية خلفية طويلة الأمد تجمع بين مراقبة الملفات في الوقت الفعلي وتحديثات التوقيعات التلقائية. هذه هي الطريقة الموصى بها لتشغيل PRX-SD على الخوادم ومحطات العمل التي تحتاج إلى حماية مستمرة.

## الاستخدام

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### الأوامر الفرعية

| الأمر الفرعي | الوصف |
|------------|-------------|
| `start` | بدء الـ daemon (الافتراضي إذا لم يُعطَ أمر فرعي) |
| `stop` | إيقاف الـ daemon الجاري |
| `restart` | إيقاف وإعادة تشغيل الـ daemon |
| `status` | عرض حالة الـ daemon وإحصاءاته |

## الخيارات (start)

| العلم | المختصر | الافتراضي | الوصف |
|------|-------|---------|-------------|
| `--watch` | `-w` | `/home,/tmp` | مسارات مفصولة بفواصل للمراقبة |
| `--update-hours` | `-u` | `6` | فترة تحديث التوقيعات التلقائية بالساعات |
| `--no-update` | | `false` | تعطيل تحديثات التوقيعات التلقائية |
| `--block` | `-b` | `false` | تمكين وضع الحظر (Linux fanotify) |
| `--auto-quarantine` | `-q` | `false` | عزل التهديدات تلقائياً |
| `--pid-file` | | `~/.prx-sd/sd.pid` | موقع ملف PID |
| `--log-file` | | `~/.prx-sd/daemon.log` | موقع ملف السجل |
| `--log-level` | `-l` | `info` | تفصيل السجل: `trace`, `debug`, `info`, `warn`, `error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | مسار ملف الإعدادات |

## ما يُديره الـ Daemon

عند بدء التشغيل، يُطلق `sd daemon` نظامَيْن فرعيَّيْن:

1. **شاشة الملفات** -- يراقب المسارات المُهيَّأة لأحداث نظام الملفات ويفحص الملفات الجديدة أو المعدَّلة. يعادل تشغيل `sd monitor` بنفس المسارات.
2. **جدول التحديثات** -- يتحقق دورياً ويُنزِّل توقيعات التهديدات الجديدة (قواعد بيانات الهاش وقواعد YARA وموجات IOC). يعادل تشغيل `sd update` بالفترة الزمنية المُهيَّأة.

## المسارات المُراقَبة الافتراضية

عندما لا يُحدَّد `--watch`، يراقب الـ daemon:

| المنصة | المسارات الافتراضية |
|----------|--------------|
| لينكس | `/home`, `/tmp` |
| macOS | `/Users`, `/tmp`, `/private/tmp` |
| ويندوز | `C:\Users`, `C:\Windows\Temp` |

تجاوز هذه الافتراضيات في ملف الإعدادات أو عبر `--watch`:

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## فحص الحالة

استخدم `sd daemon status` (أو الاختصار `sd status`) لعرض حالة الـ daemon:

```bash
sd status
```

```
PRX-SD Daemon Status
  State:          running (PID 48231)
  Uptime:         3 days, 14 hours, 22 minutes
  Watched paths:  /home, /tmp
  Files scanned:  12,847
  Threats found:  3 (2 quarantined, 1 reported)
  Last update:    2026-03-21 08:00:12 UTC (signatures v2026.0321.1)
  Next update:    2026-03-21 14:00:12 UTC
  Memory usage:   42 MB
```

## تكامل systemd (لينكس)

إنشاء خدمة systemd للتشغيل التلقائي:

```ini
[Unit]
Description=PRX-SD Antivirus Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/bin/sd daemon start
ExecStop=/usr/local/bin/sd daemon stop
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/lib/prx-sd/sd.pid
Restart=on-failure
RestartSec=10
User=root

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prx-sd /home /tmp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-sd
sudo systemctl status prx-sd
sudo journalctl -u prx-sd -f
```

::: tip
يتطلب الـ daemon الجذر لاستخدام وضع حظر fanotify. للمراقبة غير الحاجبة، يمكنك تشغيله كمستخدم غير متميز مع وصول القراءة إلى المسارات المُراقَبة.
:::

## تكامل launchd (macOS)

إنشاء plist خدمة إطلاق في `/Library/LaunchDaemons/com.openprx.sd.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openprx.sd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sd</string>
        <string>daemon</string>
        <string>start</string>
        <string>--watch</string>
        <string>/Users,/tmp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/prx-sd.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/prx-sd.log</string>
</dict>
</plist>
```

```bash
sudo launchctl load /Library/LaunchDaemons/com.openprx.sd.plist
sudo launchctl list | grep openprx
```

## الإشارات

| الإشارة | السلوك |
|--------|----------|
| `SIGHUP` | إعادة تحميل الإعدادات وإعادة تشغيل الشاشات بدون إعادة تشغيل كاملة |
| `SIGTERM` | إيقاف تشغيل لطيف -- إنهاء الفحص الحالي، تفريغ السجلات |
| `SIGINT` | نفس `SIGTERM` |
| `SIGUSR1` | تشغيل تحديث توقيعات فوري |

```bash
# تشغيل تحديث فوري
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## أمثلة

```bash
# بدء الـ daemon بالإعدادات الافتراضية
sd daemon start

# بدء بمسارات مراقبة مخصصة ودورة تحديث 4 ساعات
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# بدء مع وضع الحظر والعزل التلقائي
sudo sd daemon start --block --auto-quarantine

# فحص حالة الـ daemon
sd status

# إعادة تشغيل الـ daemon
sd daemon restart

# إيقاف الـ daemon
sd daemon stop
```

::: warning
إيقاف الـ daemon يُعطِّل جميع الحماية في الوقت الفعلي. أحداث نظام الملفات التي تحدث أثناء توقف الـ daemon لن تُفحص بأثر رجعي.
:::

## الخطوات التالية

- [مراقبة الملفات](./monitor) -- تهيئة مراقبة تفصيلية
- [حماية برامج الفدية](./ransomware) -- الكشف السلوكي لبرامج الفدية
- [تحديث التوقيعات](/ar/prx-sd/signatures/update) -- تحديثات التوقيعات اليدوية
- [تنبيهات Webhook](/ar/prx-sd/alerts/webhook) -- الحصول على إشعارات عند اكتشاف التهديدات

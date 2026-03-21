---
title: prx service
description: تثبيت وإدارة PRX كخدمة نظام (systemd أو OpenRC).
---

# prx service

تثبيت وتشغيل وإيقاف والتحقق من حالة PRX كخدمة نظام. يدعم كلاً من systemd (معظم توزيعات Linux) وOpenRC (Alpine، Gentoo).

## الاستخدام

```bash
prx service <SUBCOMMAND> [OPTIONS]
```

## الأوامر الفرعية

### `prx service install`

إنشاء وتثبيت ملف وحدة خدمة لنظام init الحالي.

```bash
prx service install [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--config` | `-c` | `~/.config/prx/config.toml` | مسار ملف الإعدادات للخدمة |
| `--user` | `-u` | المستخدم الحالي | المستخدم الذي تعمل الخدمة باسمه |
| `--group` | `-g` | المجموعة الحالية | المجموعة التي تعمل الخدمة باسمها |
| `--bin-path` | | يُكتشف تلقائيًا | مسار ملف `prx` التنفيذي |
| `--enable` | | `false` | تفعيل الخدمة للبدء عند الإقلاع |
| `--user-service` | | `false` | التثبيت كخدمة systemd على مستوى المستخدم (لا يتطلب sudo) |

```bash
# التثبيت كخدمة نظام (يتطلب sudo)
sudo prx service install --user prx --group prx --enable

# التثبيت كخدمة مستخدم (بدون sudo)
prx service install --user-service --enable

# التثبيت بمسار إعدادات مخصص
sudo prx service install --config /etc/prx/config.toml --user prx
```

يقوم أمر التثبيت بـ:

1. اكتشاف نظام init (systemd أو OpenRC)
2. إنشاء ملف الخدمة المناسب
3. تثبيته في الموقع الصحيح (`/etc/systemd/system/prx.service` أو `/etc/init.d/prx`)
4. تفعيل الخدمة للإقلاع اختياريًا

### `prx service start`

تشغيل خدمة PRX.

```bash
prx service start
```

```bash
# خدمة النظام
sudo prx service start

# خدمة المستخدم
prx service start
```

### `prx service stop`

إيقاف خدمة PRX بسلاسة.

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

عرض حالة الخدمة الحالية.

```bash
prx service status [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--json` | `-j` | `false` | المخرج بتنسيق JSON |

**مثال على المخرج:**

```
 PRX Service Status
 ──────────────────
 State:      running
 PID:        12345
 Uptime:     3d 14h 22m
 Memory:     42 MB
 Init:       systemd
 Unit:       prx.service
 Enabled:    yes (start on boot)
 Config:     /etc/prx/config.toml
 Log:        journalctl -u prx
```

## ملفات الوحدة المولّدة

### systemd

يتضمن ملف وحدة systemd المولّد توجيهات تقوية أمنية للإنتاج:

```ini
[Unit]
Description=PRX AI Agent Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/prx daemon --config /etc/prx/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
User=prx
Group=prx
RuntimeDirectory=prx
StateDirectory=prx
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

### OpenRC

```bash
#!/sbin/openrc-run

name="PRX AI Agent Daemon"
command="/usr/local/bin/prx"
command_args="daemon --config /etc/prx/config.toml"
command_user="prx:prx"
pidfile="/run/prx.pid"
start_stop_daemon_args="--background --make-pidfile"

depend() {
    need net
    after firewall
}
```

## خدمة على مستوى المستخدم

لعمليات النشر الفردية، ثبّت كخدمة systemd على مستوى المستخدم. لا يتطلب هذا صلاحيات root:

```bash
prx service install --user-service --enable

# الإدارة باستخدام systemctl --user
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## ذو صلة

- [prx daemon](./daemon) -- إعدادات الخادم والإشارات
- [prx doctor](./doctor) -- التحقق من صحة الخدمة
- [نظرة عامة على الإعدادات](/ar/prx/config/) -- مرجع ملف الإعدادات

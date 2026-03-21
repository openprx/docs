---
title: prx daemon
description: تشغيل بيئة PRX الكاملة بما في ذلك البوابة والقنوات ومجدول المهام الدورية ومحرك التطور الذاتي.
---

# prx daemon

تشغيل بيئة PRX الكاملة. تدير عملية الخادم جميع الأنظمة الفرعية طويلة التشغيل: بوابة HTTP/WebSocket، واتصالات قنوات المراسلة، ومجدول المهام الدورية، ومحرك التطور الذاتي.

## الاستخدام

```bash
prx daemon [OPTIONS]
```

## الخيارات

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--config` | `-c` | `~/.config/prx/config.toml` | مسار ملف الإعدادات |
| `--port` | `-p` | `3120` | منفذ الاستماع للبوابة |
| `--host` | `-H` | `127.0.0.1` | عنوان الربط للبوابة |
| `--log-level` | `-l` | `info` | مستوى تفصيل السجل: `trace`، `debug`، `info`، `warn`، `error` |
| `--no-evolution` | | `false` | تعطيل محرك التطور الذاتي |
| `--no-cron` | | `false` | تعطيل مجدول المهام الدورية |
| `--no-gateway` | | `false` | تعطيل بوابة HTTP/WS |
| `--pid-file` | | | كتابة معرف العملية (PID) في الملف المحدد |

## ما يشغّله الخادم

عند التشغيل، يبدأ `prx daemon` الأنظمة الفرعية التالية بالترتيب:

1. **محمّل الإعدادات** -- يقرأ ويتحقق من ملف الإعدادات
2. **واجهة الذاكرة** -- يتصل بمخزن الذاكرة المضبوط (markdown أو SQLite أو PostgreSQL)
3. **خادم البوابة** -- يشغّل خادم HTTP/WebSocket على المضيف والمنفذ المضبوطين
4. **مدير القنوات** -- يربط جميع قنوات المراسلة المفعّلة (Telegram، Discord، Slack، إلخ.)
5. **مجدول المهام الدورية** -- يحمّل وينشّط المهام المجدولة
6. **محرك التطور الذاتي** -- يشغّل أنبوب التطور L1/L2/L3 (إذا كان مفعّلًا)

## أمثلة

```bash
# التشغيل بالإعدادات الافتراضية
prx daemon

# الربط على جميع الواجهات بمنفذ 8080
prx daemon --host 0.0.0.0 --port 8080

# التشغيل مع تسجيل مفصل
prx daemon --log-level debug

# التشغيل بدون تطور (مفيد للتصحيح)
prx daemon --no-evolution

# استخدام ملف إعدادات مخصص
prx daemon --config /etc/prx/production.toml
```

## الإشارات

يستجيب الخادم لإشارات Unix للتحكم أثناء التشغيل:

| الإشارة | السلوك |
|---------|--------|
| `SIGHUP` | إعادة تحميل ملف الإعدادات دون إعادة التشغيل. يتم مواءمة القنوات والمهام الدورية مع الإعدادات الجديدة. |
| `SIGTERM` | إيقاف تشغيل سلس. يُنهي الطلبات الجارية، ويفصل القنوات بشكل نظيف، ويُفرغ عمليات الكتابة المعلقة في الذاكرة. |
| `SIGINT` | مثل `SIGTERM` (Ctrl+C). |

```bash
# إعادة تحميل الإعدادات دون إعادة التشغيل
kill -HUP $(cat /var/run/prx.pid)

# إيقاف تشغيل سلس
kill -TERM $(cat /var/run/prx.pid)
```

## التشغيل كخدمة systemd

الطريقة الموصى بها لتشغيل الخادم في الإنتاج هي عبر systemd. استخدم [`prx service install`](./service) لإنشاء وتثبيت ملف الوحدة تلقائيًا، أو أنشئه يدويًا:

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

# التقوية الأمنية
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# تثبيت وتشغيل الخدمة
prx service install
prx service start

# أو يدويًا
sudo systemctl enable --now prx
```

## التسجيل

يسجّل الخادم على stderr افتراضيًا. في بيئة systemd، تُلتقط السجلات بواسطة journal:

```bash
# متابعة سجلات الخادم
journalctl -u prx -f

# عرض سجلات الساعة الأخيرة
journalctl -u prx --since "1 hour ago"
```

عيّن التسجيل المنظم بتنسيق JSON بإضافة `log_format = "json"` إلى ملف الإعدادات للتكامل مع مجمّعات السجلات.

## فحص السلامة

أثناء تشغيل الخادم، استخدم [`prx doctor`](./doctor) أو استعلم نقطة نهاية سلامة البوابة:

```bash
# تشخيصات سطر الأوامر
prx doctor

# نقطة نهاية HTTP للسلامة
curl http://127.0.0.1:3120/health
```

## ذو صلة

- [prx gateway](./gateway) -- بوابة مستقلة بدون قنوات أو مهام دورية
- [prx service](./service) -- إدارة خدمة systemd/OpenRC
- [prx doctor](./doctor) -- تشخيصات الخادم
- [نظرة عامة على الإعدادات](/ar/prx/config/) -- مرجع ملف الإعدادات
- [نظرة عامة على التطور الذاتي](/ar/prx/self-evolution/) -- تفاصيل محرك التطور

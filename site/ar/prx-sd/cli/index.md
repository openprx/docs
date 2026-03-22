---
title: مرجع أوامر CLI
description: "مرجع كامل لجميع الأوامر الفرعية الـ 27 لـ sd CLI، مُنظَّمة حسب الفئة، مع الخيارات العامة وأمثلة الاستخدام السريع."
---

# مرجع أوامر CLI

توفر واجهة سطر الأوامر `sd` سبعة وعشرين أمراً فرعياً مُنظَّمة في عشر فئات. تعمل هذه الصفحة كفهرس مرجعي سريع. يرتبط كل أمر بصفحة توثيق تفصيلية حيثما كانت متاحة.

## الخيارات العامة

يمكن تمرير هذه الأعلام إلى أي أمر فرعي:

| العلم | الافتراضي | الوصف |
|------|---------|-------------|
| `--log-level <LEVEL>` | `warn` | تفصيل التسجيل: `trace`، `debug`، `info`، `warn`، `error` |
| `--data-dir <PATH>` | `~/.prx-sd` | دليل البيانات الأساسي للتوقيعات والعزل والإعدادات والإضافات |
| `--help` | -- | عرض مساعدة لأي أمر أو أمر فرعي |
| `--version` | -- | عرض إصدار المحرك |

```bash
# تمكين تسجيل التصحيح
sd --log-level debug scan /tmp

# استخدام دليل بيانات مخصص
sd --data-dir /opt/prx-sd scan /home
```

## الفحص

أوامر للفحص الفوري للملفات والنظام.

| الأمر | الوصف |
|---------|-------------|
| `sd scan <PATH>` | فحص ملف أو دليل بحثاً عن التهديدات |
| `sd scan-memory` | فحص ذاكرة العملية الجارية (لينكس فقط، يتطلب root) |
| `sd scan-usb [DEVICE]` | فحص أجهزة USB/القابلة للإزالة |
| `sd check-rootkit` | التحقق من مؤشرات rootkit (لينكس فقط) |

```bash
# فحص دليل بشكل متكرر مع عزل تلقائي
sd scan /home --auto-quarantine

# فحص مع مخرجات JSON للأتمتة
sd scan /tmp --json

# فحص بـ 4 خيوط وتقرير HTML
sd scan /var --threads 4 --report /tmp/report.html

# استثناء الأنماط
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# فحص ومعالجة تلقائية (إيقاف العملية والعزل وتنظيف الاستمرارية)
sd scan /tmp --remediate

# فحص ذاكرة العملية
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# فحص أجهزة USB
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# التحقق من وجود rootkit
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## المراقبة في الوقت الفعلي

أوامر للمراقبة المستمرة لنظام الملفات وتشغيل وحيد الخدمة في الخلفية.

| الأمر | الوصف |
|---------|-------------|
| `sd monitor <PATHS...>` | بدء مراقبة نظام الملفات في الوقت الفعلي |
| `sd daemon [PATHS...]` | التشغيل كوحيد خدمة في الخلفية مع المراقبة والتحديثات التلقائية |

```bash
# مراقبة /home و/tmp للتغييرات
sd monitor /home /tmp

# مراقبة في وضع الحجب (fanotify، يتطلب root)
sudo sd monitor /home --block

# تشغيل كوحيد خدمة مع المسارات الافتراضية (/home، /tmp)
sd daemon

# وحيد خدمة مع فترة تحديث مخصصة (كل ساعتين)
sd daemon /home /tmp /var --update-hours 2
```

## إدارة العزل

أوامر لإدارة قبو العزل المشفر بـ AES-256-GCM.

| الأمر | الوصف |
|---------|-------------|
| `sd quarantine list` | سرد جميع الملفات المعزولة |
| `sd quarantine restore <ID>` | استعادة ملف معزول إلى موقعه الأصلي |
| `sd quarantine delete <ID>` | حذف ملف معزول نهائياً |
| `sd quarantine delete-all` | حذف جميع الملفات المعزولة نهائياً |
| `sd quarantine stats` | عرض إحصاءات قبو العزل |

```bash
# سرد الملفات المعزولة
sd quarantine list

# استعادة ملف (استخدم أول 8 أحرف من المعرّف)
sd quarantine restore a1b2c3d4

# الاستعادة إلى مسار بديل
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# حذف إدخال محدد
sd quarantine delete a1b2c3d4

# حذف جميع الإدخالات (مع مطالبة بالتأكيد)
sd quarantine delete-all

# حذف الجميع بدون تأكيد
sd quarantine delete-all --yes

# عرض إحصاءات العزل
sd quarantine stats
```

## إدارة التوقيعات

أوامر لتحديث واستيراد توقيعات التهديدات.

| الأمر | الوصف |
|---------|-------------|
| `sd update` | التحقق من تحديثات قاعدة بيانات التوقيعات وتطبيقها |
| `sd import <FILE>` | استيراد توقيعات هاش من ملف قائمة حظر |
| `sd import-clamav <FILES...>` | استيراد ملفات توقيعات ClamAV (.cvd، .hdb، .hsb) |
| `sd info` | عرض إصدار المحرك وحالة التوقيعات ومعلومات النظام |

```bash
# تحديث التوقيعات
sd update

# التحقق من التحديثات بدون تنزيل
sd update --check-only

# إعادة التنزيل قسراً
sd update --force

# استيراد ملف هاش مخصص
sd import /path/to/hashes.txt

# استيراد توقيعات ClamAV
sd import-clamav main.cvd daily.cvd

# عرض معلومات المحرك
sd info
```

## الإعدادات

أوامر لإدارة إعدادات المحرك وسياسة المعالجة.

| الأمر | الوصف |
|---------|-------------|
| `sd config show` | عرض الإعدادات الحالية |
| `sd config set <KEY> <VALUE>` | تعيين قيمة إعداد |
| `sd config reset` | إعادة تعيين الإعدادات إلى الافتراضيات |
| `sd policy show` | عرض سياسة المعالجة |
| `sd policy set <KEY> <VALUE>` | تعيين قيمة سياسة المعالجة |
| `sd policy reset` | إعادة تعيين سياسة المعالجة إلى الافتراضيات |

```bash
# عرض الإعدادات
sd config show

# تعيين خيوط الفحص
sd config set scan.threads 8

# إعادة التعيين إلى الافتراضيات
sd config reset

# عرض سياسة المعالجة
sd policy show
```

انظر [نظرة عامة على الإعدادات](../configuration/) و[مرجع الإعدادات](../configuration/reference) للتفاصيل.

## الفحوصات المجدولة

أوامر لإدارة الفحوصات المجدولة المتكررة عبر مؤقتات systemd أو cron.

| الأمر | الوصف |
|---------|-------------|
| `sd schedule add <PATH>` | تسجيل فحص مجدول متكرر |
| `sd schedule remove` | إزالة الفحص المجدول |
| `sd schedule status` | عرض حالة الجدول الحالية |

```bash
# جدولة فحص أسبوعي لـ /home
sd schedule add /home --frequency weekly

# جدولة فحص يومي
sd schedule add /var --frequency daily

# الترددات المتاحة: hourly، 4h، 12h، daily، weekly
sd schedule add /tmp --frequency 4h

# إزالة الجدول
sd schedule remove

# التحقق من حالة الجدول
sd schedule status
```

## التنبيهات والـ Webhooks

أوامر لتهيئة إشعارات التنبيه عبر webhooks والبريد الإلكتروني.

| الأمر | الوصف |
|---------|-------------|
| `sd webhook list` | سرد نقاط نهاية webhook المُهيَّأة |
| `sd webhook add <NAME> <URL>` | إضافة نقطة نهاية webhook |
| `sd webhook remove <NAME>` | إزالة نقطة نهاية webhook |
| `sd webhook test` | إرسال تنبيه اختبار لجميع webhooks |
| `sd email-alert configure` | تهيئة تنبيهات البريد الإلكتروني عبر SMTP |
| `sd email-alert test` | إرسال بريد إلكتروني اختباري |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | إرسال بريد إلكتروني تنبيه مخصص |

```bash
# إضافة webhook Slack
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# إضافة webhook Discord
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# إضافة webhook عام
sd webhook add my-webhook https://example.com/webhook

# سرد جميع webhooks
sd webhook list

# اختبار جميع webhooks
sd webhook test

# تهيئة تنبيهات البريد الإلكتروني
sd email-alert configure

# اختبار تنبيهات البريد الإلكتروني
sd email-alert test
```

## حماية الشبكة

أوامر لحجب الإعلانات والنطاقات الضارة على مستوى DNS.

| الأمر | الوصف |
|---------|-------------|
| `sd adblock enable` | تمكين حماية adblock عبر ملف hosts |
| `sd adblock disable` | تعطيل حماية adblock |
| `sd adblock sync` | إعادة تنزيل جميع قوائم الفلاتر |
| `sd adblock stats` | عرض إحصاءات محرك adblock |
| `sd adblock check <URL>` | التحقق مما إذا كان URL/النطاق محجوباً |
| `sd adblock log` | عرض الإدخالات المحجوبة الأخيرة |
| `sd adblock add <NAME> <URL>` | إضافة قائمة فلاتر مخصصة |
| `sd adblock remove <NAME>` | إزالة قائمة فلاتر |
| `sd dns-proxy` | بدء وكيل DNS محلي مع الفلترة |

```bash
# تمكين adblock
sudo sd adblock enable

# بدء وكيل DNS
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

انظر [Adblock](../network/adblock) و[وكيل DNS](../network/dns-proxy) للتفاصيل.

## التقارير

| الأمر | الوصف |
|---------|-------------|
| `sd report <OUTPUT>` | توليد تقرير HTML من نتائج فحص JSON |

```bash
# الفحص مع مخرجات JSON، ثم توليد تقرير HTML
sd scan /home --json > results.json
sd report report.html --input results.json

# أو استخدام علم --report مباشرةً
sd scan /home --report /tmp/scan-report.html
```

## النظام

أوامر لصيانة المحرك والتكامل والتحديث الذاتي.

| الأمر | الوصف |
|---------|-------------|
| `sd status` | عرض حالة وحيد الخدمة (يعمل/متوقف، PID، التهديدات المحجوبة) |
| `sd install-integration` | تثبيت تكامل النقر بالزر الأيمن في مدير الملفات |
| `sd self-update` | التحقق من تحديثات الملف الثنائي للمحرك وتطبيقها |

```bash
# التحقق من حالة وحيد الخدمة
sd status

# تثبيت تكامل سطح المكتب
sd install-integration

# التحقق من تحديثات المحرك
sd self-update --check-only

# تطبيق تحديث المحرك
sd self-update
```

## المجتمع

أوامر لمشاركة استخبارات تهديدات المجتمع.

| الأمر | الوصف |
|---------|-------------|
| `sd community status` | عرض إعداد مشاركة المجتمع |
| `sd community enroll` | تسجيل هذا الجهاز مع API المجتمع |
| `sd community disable` | تعطيل مشاركة المجتمع |

```bash
# التحقق من حالة التسجيل
sd community status

# التسجيل في مشاركة المجتمع
sd community enroll

# تعطيل المشاركة (يحتفظ ببيانات الاعتماد)
sd community disable
```

## الخطوات التالية

- ابدأ بـ [دليل البداية السريعة](../getting-started/quickstart) لبدء الفحص في 5 دقائق
- استكشف [الإعدادات](../configuration/) لتخصيص سلوك المحرك
- إعداد [المراقبة في الوقت الفعلي](../realtime/) للحماية المستمرة
- تعلّم عن خط أنابيب [محرك الكشف](../detection/)

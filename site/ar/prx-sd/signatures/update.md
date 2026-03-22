---
title: تحديث التوقيعات
description: "الحفاظ على تحديث قواعد بيانات استخبارات التهديدات باستخدام sd update، بما يشمل التحديثات التدريجية والتحقق بـ Ed25519."
---

# تحديث التوقيعات

يُنزِّل الأمر `sd update` أحدث توقيعات التهديدات من جميع المصادر المُهيَّأة. التحديثات المنتظمة أمر بالغ الأهمية -- تظهر عينات البرامج الضارة الجديدة كل بضع دقائق، وقاعدة البيانات القديمة تترك ثغرات في الحماية.

## الاستخدام

```bash
sd update [OPTIONS]
```

## الخيارات

| العلم | المختصر | الافتراضي | الوصف |
|------|-------|---------|-------------|
| `--check-only` | | `false` | التحقق من التحديثات المتاحة دون تنزيلها |
| `--force` | `-f` | `false` | إجبار إعادة تنزيل جميع التوقيعات متجاهلاً الذاكرة المؤقتة |
| `--source` | `-s` | الكل | تحديث فئة مصدر محددة فقط: `hashes`, `yara`, `ioc`, `clamav` |
| `--full` | | `false` | تضمين مجموعات البيانات الكبيرة (VirusShare 20 مليون+ هاش MD5) |
| `--server-url` | | الرسمي | URL خادم تحديث مخصص |
| `--no-verify` | | `false` | تخطي التحقق من توقيع Ed25519 (غير موصى به) |
| `--timeout` | `-t` | `300` | مهلة التنزيل لكل مصدر بالثواني |
| `--parallel` | `-p` | `4` | عدد التنزيلات المتوازية |
| `--quiet` | `-q` | `false` | كتم مخرجات التقدم |

## كيف تعمل التحديثات

### تدفق التحديث

```
sd update
  1. جلب metadata.json من خادم التحديث
  2. مقارنة الإصدارات المحلية مع الإصدارات البعيدة
  3. لكل مصدر قديم:
     a. تنزيل الفرق التدريجي (أو الملف الكامل إذا لم يكن هناك فرق متاح)
     b. التحقق من توقيع Ed25519
     c. تطبيقه على قاعدة البيانات المحلية
  4. إعادة تجميع قواعد YARA
  5. تحديث metadata.json المحلي
```

### التحديثات التدريجية

يستخدم PRX-SD التحديثات التدريجية لتقليل استهلاك النطاق الترددي:

| نوع المصدر | طريقة التحديث | الحجم المعتاد |
|-------------|--------------|-------------|
| قواعد بيانات الهاش | فرق دلتا (إضافات + حذوفات) | 50-200 كيلوبايت |
| قواعد YARA | تصحيحات بأسلوب Git | 10-50 كيلوبايت |
| موجات IOC | استبدال كامل (ملفات صغيرة) | 1-5 ميجابايت |
| ClamAV | تحديثات cdiff تدريجية | 100-500 كيلوبايت |

عندما تكون التحديثات التدريجية غير متاحة (التثبيت الأول، أو التلف، أو `--force`)، يُنزَّل قاعدة البيانات الكاملة.

### التحقق من توقيع Ed25519

يُتحقق من كل ملف مُنزَّل مقابل توقيع Ed25519 قبل تطبيقه. هذا يحمي من:

- **التلاعب** -- الملفات المُعدَّلة مرفوضة
- **الفساد** -- يُكشف عن التنزيلات غير المكتملة
- **هجمات إعادة التشغيل** -- لا يمكن إعادة تشغيل التوقيعات القديمة (التحقق من الطابع الزمني)

مفتاح التوقيع العام مُضمَّن في ملف `sd` الثنائي وقت التجميع.

::: warning
لا تستخدم `--no-verify` أبداً في الإنتاج. التحقق من التوقيع موجود لمنع هجمات سلسلة التوريد عبر خوادم تحديث مخترقة أو هجمات الرجل في المنتصف.
:::

## التحقق من التحديثات

لرؤية التحديثات المتاحة دون تنزيلها:

```bash
sd update --check-only
```

```
Checking for updates...
  MalwareBazaar:    update available (v2026.0321.2, +847 hashes)
  URLhaus:          up to date (v2026.0321.1)
  Feodo Tracker:    update available (v2026.0321.3, +12 hashes)
  ThreatFox:        up to date (v2026.0321.1)
  YARA Community:   update available (v2026.0320.1, +3 rules)
  IOC Feeds:        update available (v2026.0321.1, +1,204 indicators)
  ClamAV:           not configured

3 sources have updates available.
Run 'sd update' to download.
```

## خادم تحديث مخصص

للبيئات المعزولة عن الهواء أو المنظمات التي تُشغِّل مرآة خاصة:

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

ضبط الخادم بشكل دائم في `config.toml`:

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
استخدم أداة `prx-sd-mirror` لإعداد مرآة توقيعات محلية. راجع [دليل الاستضافة الذاتية](https://github.com/OpenPRX/prx-sd-signatures) لمزيد من التفاصيل.
:::

## البديل بسكريبت Shell

للأنظمة التي لا يكون `sd` مثبتاً فيها، استخدم سكريبت Shell المرفق:

```bash
# تحديث قياسي (هاشات + YARA)
./tools/update-signatures.sh

# تحديث كامل يشمل VirusShare
./tools/update-signatures.sh --full

# تحديث الهاشات فقط
./tools/update-signatures.sh --source hashes

# تحديث قواعد YARA فقط
./tools/update-signatures.sh --source yara
```

## أمثلة

```bash
# تحديث قياسي
sd update

# إجبار إعادة تنزيل كامل لكل شيء
sd update --force

# تحديث قواعد YARA فقط
sd update --source yara

# تحديث كامل مع VirusShare (تنزيل كبير)
sd update --full

# الوضع الهادئ لمهام cron
sd update --quiet

# التحقق أولاً مما هو متاح
sd update --check-only

# استخدام خادم مخصص مع تزامن متوازٍ أعلى
sd update --server-url https://mirror.example.com --parallel 8
```

## أتمتة التحديثات

### مع sd daemon

يتولى الـ daemon التحديثات تلقائياً. ضبط الفترة الزمنية:

```bash
sd daemon start --update-hours 4
```

### مع cron

```bash
# تحديث التوقيعات كل 6 ساعات
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### مع systemd timer

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## الخطوات التالية

- [مصادر التوقيعات](./sources) -- تفاصيل حول كل مصدر استخبارات تهديدات
- [استيراد الهاشات](./import) -- إضافة قوائم هاش حظر مخصصة
- [الـ Daemon](../realtime/daemon) -- التحديثات التلقائية في الخلفية
- [نظرة عامة على استخبارات التهديدات](./index) -- نظرة عامة على بنية قاعدة البيانات

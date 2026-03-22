---
title: استيراد الهاشات
description: استيراد قوائم هاش حظر مخصصة وقواعد بيانات توقيعات ClamAV إلى PRX-SD.
---

# استيراد الهاشات

يتيح لك PRX-SD استيراد قوائم هاش حظر مخصصة وقواعد بيانات توقيعات ClamAV لتوسيع تغطية الكشف باستخدام استخبارات التهديدات الخاصة بك أو قوائم الحظر التنظيمية.

## استيراد الهاشات المخصصة

### الاستخدام

```bash
sd import [OPTIONS] <FILE>
```

### الخيارات

| العلم | المختصر | الافتراضي | الوصف |
|------|-------|---------|-------------|
| `--format` | `-f` | اكتشاف تلقائي | تنسيق الهاش: `sha256`, `sha1`, `md5`, `auto` |
| `--label` | `-l` | اسم الملف | تسمية مجموعة الاستيراد |
| `--replace` | | `false` | استبدال الإدخالات الموجودة بنفس التسمية |
| `--dry-run` | | `false` | التحقق من الملف دون استيراد |
| `--quiet` | `-q` | `false` | كتم مخرجات التقدم |

### تنسيقات ملفات الهاش المدعومة

يقبل PRX-SD عدة تنسيقات شائعة:

**قائمة عادية** -- هاش واحد لكل سطر:

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**هاش مع تسمية** -- هاش متبوع بمسافة ووصف اختياري:

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**تنسيق CSV** -- مفصول بفواصل مع ترويسات:

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**أسطر التعليق** -- الأسطر التي تبدأ بـ `#` يتم تجاهلها:

```
# Custom blocklist - updated 2026-03-21
# Source: internal threat hunting team
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
يُكتشف تنسيق الهاش تلقائياً بناءً على الطول: 32 حرفاً = MD5, 40 حرفاً = SHA-1, 64 حرفاً = SHA-256. استخدم `--format` للتجاوز في حالة فشل الاكتشاف.
:::

### أمثلة الاستيراد

```bash
# استيراد قائمة هاش SHA-256
sd import threat_hashes.txt

# استيراد مع تنسيق صريح وتسمية
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# تشغيل جاف للتحقق من الملف
sd import --dry-run suspicious_hashes.csv

# استبدال مجموعة استيراد موجودة
sd import --replace --label "daily-feed" today_hashes.txt
```

### مخرجات الاستيراد

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## استيراد قواعد بيانات ClamAV

### الاستخدام

```bash
sd import-clamav [OPTIONS] <FILE>
```

### الخيارات

| العلم | المختصر | الافتراضي | الوصف |
|------|-------|---------|-------------|
| `--type` | `-t` | اكتشاف تلقائي | نوع قاعدة البيانات: `cvd`, `cld`, `hdb`, `hsb`, `auto` |
| `--quiet` | `-q` | `false` | كتم مخرجات التقدم |

### تنسيقات ClamAV المدعومة

| التنسيق | الامتداد | الوصف |
|--------|-----------|-------------|
| **CVD** | `.cvd` | قاعدة بيانات فيروسات ClamAV (مضغوطة، موقَّعة) |
| **CLD** | `.cld` | قاعدة بيانات ClamAV المحلية (تحديثات تدريجية) |
| **HDB** | `.hdb` | قاعدة بيانات هاش MD5 (نص عادي) |
| **HSB** | `.hsb` | قاعدة بيانات هاش SHA-256 (نص عادي) |
| **NDB** | `.ndb` | تنسيق توقيع مُوسَّع (مستند إلى المحتوى) |

::: warning
قد تكون ملفات CVD/CLD كبيرة جداً. ملف `main.cvd` وحده يحتوي على أكثر من 6 ملايين توقيع ويتطلب حوالي 300 ميجابايت من مساحة القرص بعد الاستيراد.
:::

### أمثلة استيراد ClamAV

```bash
# استيراد قاعدة بيانات ClamAV الرئيسية
sd import-clamav /var/lib/clamav/main.cvd

# استيراد قاعدة بيانات التحديث اليومي
sd import-clamav /var/lib/clamav/daily.cvd

# استيراد قاعدة بيانات هاش نصية عادية
sd import-clamav custom_sigs.hdb

# استيراد قاعدة بيانات هاش SHA-256
sd import-clamav my_hashes.hsb
```

### إعداد تكامل ClamAV

لاستخدام توقيعات ClamAV مع PRX-SD:

1. تثبيت freshclam (مُحدِّث ClamAV):

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. تنزيل قواعد البيانات:

```bash
sudo freshclam
```

3. الاستيراد إلى PRX-SD:

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. تمكين ClamAV في الإعدادات:

```toml
[signatures.sources]
clamav = true
```

## إدارة الهاشات المستوردة

عرض مجموعات الهاش المستوردة:

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

إزالة مجموعة مستوردة:

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## الخطوات التالية

- [قواعد YARA المخصصة](./custom-rules) -- كتابة قواعد كشف مستندة إلى الأنماط
- [مصادر التوقيعات](./sources) -- جميع مصادر استخبارات التهديدات المتاحة
- [تحديث التوقيعات](./update) -- الحفاظ على تحديث قواعد البيانات
- [نظرة عامة على استخبارات التهديدات](./index) -- بنية قاعدة البيانات

---
title: نظرة عامة على استخبارات التهديدات
description: بنية قاعدة بيانات توقيعات PRX-SD بما فيها توقيعات الهاش وقواعد YARA وموجات IOC وتكامل ClamAV.
---

# نظرة عامة على استخبارات التهديدات

يجمع PRX-SD استخبارات التهديدات من مصادر مفتوحة ومجتمعية متعددة في قاعدة بيانات محلية موحدة. يضمن هذا النهج متعدد الطبقات تغطية واسعة -- من هاشات البرامج الضارة المعروفة إلى قواعد الأنماط السلوكية إلى مؤشرات اختراق الشبكة.

## فئات التوقيعات

يُنظِّم PRX-SD استخبارات التهديدات في أربع فئات:

| الفئة | المصادر | العدد | سرعة البحث | التخزين |
|----------|---------|-------|-------------|---------|
| **توقيعات الهاش** | 7 مصادر | ملايين SHA-256/MD5 | O(1) عبر LMDB | ~500 MB |
| **قواعد YARA** | 8 مصادر | أكثر من 38,800 قاعدة | مطابقة الأنماط | ~15 MB |
| **موجات IOC** | 5 مصادر | أكثر من 585,000 مؤشر | Trie / خريطة هاش | ~25 MB |
| **قاعدة بيانات ClamAV** | مصدر واحد | أكثر من 11,000,000 توقيع | محرك ClamAV | ~300 MB |

### توقيعات الهاش

أسرع طبقة كشف. يُشفَّر كل ملف عند الفحص ويُفحص مقابل قاعدة بيانات LMDB المحلية التي تحتوي على هاشات الملفات الضارة المعروفة:

- **abuse.ch MalwareBazaar** -- هاشات SHA-256 لعينات البرامج الضارة الحديثة (نافذة متحركة 48 ساعة)
- **abuse.ch URLhaus** -- هاشات SHA-256 للملفات المُوزَّعة عبر URLs ضارة
- **abuse.ch Feodo Tracker** -- هاشات SHA-256 لأحصنة طروادة المصرفية (Emotet وDridex وTrickBot)
- **abuse.ch ThreatFox** -- IOCs SHA-256 من تقديمات المجتمع
- **abuse.ch SSL Blacklist** -- بصمات SHA-1 لشهادات SSL الضارة
- **VirusShare** -- أكثر من 20,000,000 هاش MD5 (متاح مع تحديث `--full`)
- **قائمة الحظر المدمجة** -- هاشات مُشفَّرة لملف اختبار EICAR وWannaCry وNotPetya وEmotey

### قواعد YARA

قواعد مطابقة الأنماط التي تحدد البرامج الضارة بأنماط الكود والسلاسل النصية والهيكل بدلاً من الهاشات الدقيقة. هذا يلتقط متغيرات وعائلات البرامج الضارة:

- **القواعد المدمجة** -- 64 قاعدة منتقاة لبرامج الفدية وأحصنة طروادة والباب الخلفي وrootkit وعمال المنجم والـ webshells
- **Yara-Rules/rules** -- قواعد يُصانها المجتمع لـ Emotet وTrickBot وCobaltStrike وMirai وLockBit
- **Neo23x0/signature-base** -- قواعد عالية الجودة لـ APT29 وLazarus وتعدين العملات المشفرة والـ webshells
- **ReversingLabs YARA** -- قواعد مفتوحة المصدر بمستوى تجاري لأحصنة طروادة وبرامج الفدية والباب الخلفي
- **ESET IOC** -- قواعد تتبع APT لـ Turla وInterception والتهديدات المتقدمة الأخرى
- **InQuest** -- قواعد متخصصة للمستندات الضارة (استغلالات OLE وDDE)
- **Elastic Security** -- قواعد الكشف من فريق أبحاث التهديدات في Elastic
- **Google GCTI** -- قواعد YARA من استخبارات تهديدات Google Cloud

### موجات IOC

مؤشرات اختراق الشبكة للكشف عن الاتصالات بالبنية التحتية الضارة المعروفة:

- **IPsum** -- قائمة سمعة IP الضارة المجمَّعة (تسجيل متعدد المصادر)
- **FireHOL** -- قوائم حظر IP منتقاة على مستويات تهديد متعددة
- **Emerging Threats** -- قواعد Suricata/Snort مُحوَّلة إلى IOCs IP/نطاق
- **SANS ISC** -- موجات IP المشبوهة اليومية من Internet Storm Center
- **URLhaus** -- URLs ضارة نشطة للتصيد الاحتيالي وتوزيع البرامج الضارة

### قاعدة بيانات ClamAV

تكامل اختياري مع قاعدة بيانات فيروسات ClamAV، التي توفر أكبر مجموعة توقيعات مفتوحة المصدر:

- **main.cvd** -- توقيعات الفيروسات الأساسية
- **daily.cvd** -- التوقيعات المُحدَّثة يومياً
- **bytecode.cvd** -- توقيعات كشف bytecode

## هيكل دليل البيانات

تُخزَّن جميع بيانات التوقيعات تحت `~/.prx-sd/signatures/`:

```
~/.prx-sd/signatures/
  hashes/
    malware_bazaar.lmdb       # MalwareBazaar SHA-256
    urlhaus.lmdb              # URLhaus SHA-256
    feodo.lmdb                # Feodo Tracker SHA-256
    threatfox.lmdb            # ThreatFox IOCs
    virusshare.lmdb           # VirusShare MD5 (--full فقط)
    custom.lmdb               # هاشات مستوردة من المستخدم
  yara/
    builtin/                  # القواعد المدمجة (مشحونة مع الملف الثنائي)
    community/                # قواعد المجتمع المُنزَّلة
    custom/                   # القواعد المخصصة من المستخدم
    compiled.yarc             # ذاكرة مؤقت للقواعد المُجمَّعة مسبقاً
  ioc/
    ipsum.dat                 # سمعة IP لـ IPsum
    firehol.dat               # قوائم حظر FireHOL
    et_compromised.dat        # IPs Emerging Threats
    sans_isc.dat              # IPs مشبوهة SANS ISC
    urlhaus_urls.dat          # URLs ضارة URLhaus
  clamav/
    main.cvd                  # توقيعات ClamAV الرئيسية
    daily.cvd                 # تحديثات ClamAV اليومية
    bytecode.cvd              # توقيعات ClamAV bytecode
  metadata.json               # طوابع زمنية للتحديث ومعلومات الإصدار
```

::: tip
استخدم `sd info` لعرض الحالة الحالية لجميع قواعد بيانات التوقيعات، بما فيها أعداد المصادر وأوقات آخر تحديث واستخدام القرص.
:::

## الاستعلام عن حالة التوقيعات

```bash
sd info
```

```
PRX-SD Signature Database
  Hash signatures:    1,247,832 entries (7 sources)
  YARA rules:         38,847 rules (8 sources, 64 built-in)
  IOC indicators:     585,221 entries (5 sources)
  ClamAV signatures:  not installed
  Last updated:       2026-03-21 08:00:12 UTC
  Database version:   2026.0321.1
  Disk usage:         542 MB
```

## الخطوات التالية

- [تحديث التوقيعات](./update) -- الحفاظ على تحديث قواعد بياناتك
- [مصادر التوقيعات](./sources) -- معلومات تفصيلية عن كل مصدر
- [استيراد الهاشات](./import) -- إضافة قوائم هاش حظر خاصة بك
- [قواعد YARA المخصصة](./custom-rules) -- كتابة ونشر قواعد مخصصة

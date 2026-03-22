---
title: قواعد YARA المخصصة
description: كتابة واختبار ونشر قواعد YARA المخصصة في PRX-SD للكشف عن التهديدات الخاصة ببيئتك.
---

# قواعد YARA المخصصة

YARA هي لغة مطابقة أنماط مصممة للكشف عن البرامج الضارة. يدعم PRX-SD تحميل قواعد YARA المخصصة إلى جانب القواعد المدمجة وقواعد المجتمع، مما يتيح لك إنشاء منطق كشف مُصمَّم خصيصاً لمشهد التهديدات الخاص بك.

## موقع ملفات القواعد

ضع قواعد YARA المخصصة في دليل `~/.prx-sd/yara/`:

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

يُحمِّل PRX-SD جميع ملفات `.yar` و`.yara` من هذا الدليل عند بدء التشغيل وأثناء تحديثات التوقيعات. تُجمَّع القواعد في ذاكرة مؤقت محسَّنة (`compiled.yarc`) للمسح السريع.

::: tip
الدلائل الفرعية مدعومة. نظِّم القواعد حسب الفئة لإدارة أسهل:
```
~/.prx-sd/yara/
  ransomware/
    lockbit_variant.yar
    custom_encryptor.yar
  webshells/
    internal_webshell.yar
  compliance/
    pii_detection.yar
```
:::

## بنية قاعدة YARA

تتكون قاعدة YARA من ثلاثة أقسام: **meta** و**strings** و**condition**.

### الهيكل الأساسي للقاعدة

```yara
rule Detect_CustomMalware : trojan
{
    meta:
        author = "Security Team"
        description = "Detects custom trojan used in targeted attack"
        severity = "high"
        date = "2026-03-21"
        reference = "https://internal.wiki/incident-2026-042"

    strings:
        $magic = { 4D 5A 90 00 }              // PE header (hex bytes)
        $str1 = "cmd.exe /c" ascii nocase      // ASCII string, case-insensitive
        $str2 = "powershell -enc" ascii nocase
        $str3 = "C:\\Users\\Public\\payload" wide  // UTF-16 string
        $mutex = "Global\\CustomMutex_12345"
        $regex = /https?:\/\/[a-z0-9]{8,12}\.onion/ // Regex pattern

    condition:
        $magic at 0 and
        (2 of ($str*)) and
        ($mutex or $regex)
}
```

### عناصر البنية الأساسية

| العنصر | البنية | الوصف |
|---------|--------|-------------|
| سلاسل ست عشرية | `{ 4D 5A ?? 00 }` | أنماط بايت مع أحرف بدل (`??`) |
| سلاسل نصية | `"text" ascii` | سلاسل ASCII عادية |
| سلاسل عريضة | `"text" wide` | سلاسل مُرمَّزة بـ UTF-16LE |
| غير حساس للحالة | `"text" nocase` | مطابقة بغض النظر عن الحالة |
| تعبير منتظم | `/pattern/` | أنماط التعبيرات المنتظمة |
| وسوم | `rule Name : tag1 tag2` | وسوم التصنيف |
| حجم الملف | `filesize < 1MB` | شرط على حجم الملف |
| نقطة الدخول | `entrypoint` | إزاحة نقطة دخول PE/ELF |
| عند إزاحة | `$str at 0x100` | سلسلة عند إزاحة محددة |
| في نطاق | `$str in (0..1024)` | سلسلة ضمن نطاق بايت |
| عدد | `#str > 3` | عدد تكرارات السلسلة |

### مستويات الخطورة

يقرأ PRX-SD حقل `severity` في meta لتحديد تصنيف التهديد:

| الخطورة | حكم PRX-SD |
|----------|---------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| (غير محددة) | SUSPICIOUS |

## أمثلة القواعد

### كشف سكريبت مشبوه

```yara
rule Suspicious_PowerShell_Download : script
{
    meta:
        author = "Security Team"
        description = "PowerShell script downloading and executing remote content"
        severity = "high"

    strings:
        $dl1 = "Invoke-WebRequest" ascii nocase
        $dl2 = "Net.WebClient" ascii nocase
        $dl3 = "DownloadString" ascii nocase
        $dl4 = "DownloadFile" ascii nocase
        $exec1 = "Invoke-Expression" ascii nocase
        $exec2 = "iex(" ascii nocase
        $exec3 = "Start-Process" ascii nocase
        $enc = "-EncodedCommand" ascii nocase
        $bypass = "-ExecutionPolicy Bypass" ascii nocase

    condition:
        filesize < 5MB and
        (any of ($dl*)) and
        (any of ($exec*) or $enc or $bypass)
}
```

### كشف عمال تعدين العملات المشفرة

```yara
rule Crypto_Miner_Strings : miner
{
    meta:
        author = "Security Team"
        description = "Detects cryptocurrency mining software"
        severity = "medium"

    strings:
        $pool1 = "stratum+tcp://" ascii
        $pool2 = "stratum+ssl://" ascii
        $pool3 = "pool.minexmr.com" ascii
        $pool4 = "xmrpool.eu" ascii
        $algo1 = "cryptonight" ascii nocase
        $algo2 = "randomx" ascii nocase
        $algo3 = "ethash" ascii nocase
        $wallet = /[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}/ ascii  // Monero address

    condition:
        (any of ($pool*)) or
        ((any of ($algo*)) and $wallet)
}
```

### كشف Webshells

```yara
rule PHP_Webshell_Generic : webshell
{
    meta:
        author = "Security Team"
        description = "Generic PHP webshell detection"
        severity = "critical"

    strings:
        $php = "<?php" ascii nocase
        $eval1 = "eval(" ascii nocase
        $eval2 = "assert(" ascii nocase
        $eval3 = "preg_replace" ascii nocase
        $input1 = "$_GET[" ascii
        $input2 = "$_POST[" ascii
        $input3 = "$_REQUEST[" ascii
        $input4 = "$_COOKIE[" ascii
        $cmd1 = "system(" ascii nocase
        $cmd2 = "passthru(" ascii nocase
        $cmd3 = "shell_exec(" ascii nocase
        $cmd4 = "exec(" ascii nocase
        $obf1 = "base64_decode" ascii nocase
        $obf2 = "str_rot13" ascii nocase
        $obf3 = "gzinflate" ascii nocase

    condition:
        $php and
        (any of ($eval*)) and
        (any of ($input*)) and
        (any of ($cmd*) or any of ($obf*))
}
```

## اختبار القواعد

تحقق من قواعدك قبل نشرها:

```bash
# التحقق من تجميع ملف قاعدة (التحقق من البنية)
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# اختبار قاعدة مقابل ملف محدد
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# اختبار جميع القواعد المخصصة مقابل دليل من العينات
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# مسح تجريبي باستخدام القواعد المخصصة فقط
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
اختبر دائماً القواعد الجديدة مقابل مجموعة من الملفات النظيفة المعروفة للتحقق من النتائج الإيجابية الكاذبة قبل النشر في مراقبة الإنتاج.
:::

## إعادة تحميل القواعد

بعد إضافة أو تعديل القواعد، أعد التحميل دون إعادة تشغيل الـ daemon:

```bash
# إعادة تجميع وإعادة تحميل القواعد
sd yara reload

# إذا كان يعمل كـ daemon، أرسل SIGHUP
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## المساهمة بالقواعد

شارك قواعدك مع مجتمع PRX-SD:

1. Fork مستودع [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures)
2. أضف قاعدتك إلى دليل الفئة المناسب
3. أدرج حقول `meta` شاملة (author، description، severity، reference)
4. اختبر مقابل عينات ضارة وملفات نظيفة
5. قدِّم pull request مع هاشات العينات للتحقق

## الخطوات التالية

- [مصادر التوقيعات](./sources) -- مصادر قواعد YARA المجتمعية والخارجية
- [استيراد الهاشات](./import) -- إضافة قوائم حظر مستندة إلى الهاش
- [تحديث التوقيعات](./update) -- الحفاظ على تحديث جميع القواعد
- [نظرة عامة على استخبارات التهديدات](./index) -- بنية التوقيعات الكاملة

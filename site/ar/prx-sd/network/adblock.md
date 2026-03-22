---
title: حظر الإعلانات والنطاقات الضارة
description: "حظر الإعلانات والمتتبعات والنطاقات الضارة على مستوى DNS باستخدام أمر sd adblock. يدعم قوائم تصفية متعددة وقواعد مخصصة وتسجيلاً مستمراً."
---

# حظر الإعلانات والنطاقات الضارة

يتضمن PRX-SD محرك adblock مدمج يحظر الإعلانات والمتتبعات والنطاقات الضارة المعروفة على مستوى DNS عن طريق كتابة إدخالات في ملف hosts النظام (`/etc/hosts` على لينكس/macOS، `C:\Windows\System32\drivers\etc\hosts` على ويندوز). تُخزَّن قوائم التصفية محلياً تحت `~/.prx-sd/adblock/` وتدعم كلاً من بنية Adblock Plus (ABP) وتنسيق hosts.

## كيف يعمل

عند تمكين adblock، يقوم PRX-SD بـ:

1. تنزيل قوائم التصفية المُهيَّأة (EasyList وabuse.ch URLhaus وغيرها)
2. تحليل قواعد ABP (`||domain.com^`) وإدخالات hosts (`0.0.0.0 domain.com`)
3. كتابة جميع النطاقات المحظورة في ملف hosts النظام، مُشيراً إليها بـ `0.0.0.0`
4. تسجيل كل بحث عن نطاق محظور في `~/.prx-sd/adblock/blocked_log.jsonl`

::: tip
للتصفية الكاملة على مستوى DNS مع إعادة التوجيه إلى الخادم المنبع، ادمج adblock مع [وكيل DNS](./dns-proxy). يدمج الوكيل قواعد adblock وموجات نطاق IOC وقوائم الحظر المخصصة في محلل واحد.
:::

## الأوامر

### تمكين الحماية

تنزيل قوائم التصفية وتثبيت حظر DNS عبر ملف hosts. يتطلب صلاحيات الجذر/المسؤول.

```bash
sudo sd adblock enable
```

المخرجات:

```
>>> Enabling adblock protection...
  Loaded 4 lists (128432 rules)
success: Adblock enabled: 95211 domains blocked via /etc/hosts
  Lists: ["easylist", "easyprivacy", "urlhaus-domains", "malware-domains"]
  Log: /home/user/.prx-sd/adblock/blocked_log.jsonl
```

### تعطيل الحماية

إزالة جميع إدخالات PRX-SD من ملف hosts. تُحفظ بيانات الاعتماد والقوائم المؤقتة.

```bash
sudo sd adblock disable
```

### مزامنة قوائم التصفية

إجبار إعادة تنزيل جميع قوائم التصفية المُهيَّأة. إذا كان adblock مُمكَّناً حالياً، يُحدَّث ملف hosts تلقائياً بالقواعد الجديدة.

```bash
sudo sd adblock sync
```

### عرض الإحصاءات

عرض الحالة الحالية وقوائم محملة وعدد القواعد وحجم سجل الحظر.

```bash
sd adblock stats
```

المخرجات:

```
Adblock Engine Statistics
  Status:        ENABLED
  Lists loaded:  4
  Total rules:   128432
  Cache dir:     /home/user/.prx-sd/adblock
  Last sync:     2026-03-20T14:30:00Z
  Blocked log:   1842 entries

  - easylist
  - easyprivacy
  - urlhaus-domains
  - malware-domains
```

### التحقق من URL أو نطاق

اختبار ما إذا كان URL أو نطاق محدد محظوراً بقوائم التصفية الحالية.

```bash
sd adblock check ads.example.com
sd adblock check https://tracker.analytics.io/pixel.js
```

إذا لم يكن النطاق مؤهلاً بالكامل مع مخطط، يُضيف PRX-SD تلقائياً `https://`.

المخرجات:

```
BLOCKED ads.example.com -> Ads
```

أو:

```
ALLOWED docs.example.com
```

### عرض سجل الحظر

عرض إدخالات الحظر الأخيرة من سجل JSONL المستمر. يتحكم العلم `--count` في عدد الإدخالات المُعروضة (الافتراضي: 50).

```bash
sd adblock log
sd adblock log --count 100
```

كل إدخال سجل يحتوي على طابع زمني ونطاق وURL وفئة ومصدر.

### إضافة قائمة تصفية مخصصة

إضافة قائمة تصفية خارجية أو مخصصة بالاسم والـ URL. يُصنِّف العلم `--category` القائمة (الافتراضي: `unknown`).

الفئات المتاحة: `ads`, `tracking`, `malware`, `social`.

```bash
sd adblock add my-blocklist https://example.com/blocklist.txt --category malware
```

### إزالة قائمة تصفية

إزالة قائمة تصفية مُضافة مسبقاً بالاسم.

```bash
sd adblock remove my-blocklist
```

## قوائم التصفية الافتراضية

يُشحن PRX-SD مع مصادر التصفية المدمجة التالية:

| القائمة | الفئة | الوصف |
|------|----------|-------------|
| EasyList | الإعلانات | قائمة تصفية إعلانات يُصانها المجتمع |
| EasyPrivacy | التتبع | حماية المتتبعات وبصمة الأصابع |
| URLhaus Domains | البرامج الضارة | نطاقات URLhaus الضارة من abuse.ch |
| Malware Domains | البرامج الضارة | نطاقات توزيع برامج ضارة معروفة |

## تنسيق قائمة التصفية

القوائم المخصصة يمكنها استخدام بنية Adblock Plus (ABP) أو تنسيق hosts:

**تنسيق ABP:**

```
||ads.example.com^
||tracker.analytics.io^
```

**تنسيق Hosts:**

```
0.0.0.0 ads.example.com
127.0.0.1 tracker.analytics.io
```

الأسطر التي تبدأ بـ `!` أو `#` أو `[` تُعامَل كتعليقات وتُتجاهَل.

## هيكل دليل البيانات

```
~/.prx-sd/adblock/
  enabled           # Flag file (present when adblock is active)
  config.json       # Source list configuration
  blocked_log.jsonl # Persistent block log
  lists/            # Cached filter list files
```

::: warning
تمكين وتعطيل adblock يُعدِّل ملف hosts النظام. استخدم دائماً `sd adblock disable` لإزالة الإدخالات بنظافة بدلاً من تحرير ملف hosts يدوياً. يتطلب الأمر صلاحيات الجذر/المسؤول.
:::

## أمثلة

**سير عمل الإعداد الكامل:**

```bash
# تمكين بالقوائم الافتراضية
sudo sd adblock enable

# إضافة قائمة حظر برامج ضارة مخصصة
sd adblock add threatfox-domains https://threatfox.abuse.ch/export/hostfile/ --category malware

# إعادة المزامنة لتنزيل القائمة الجديدة
sudo sd adblock sync

# التحقق من حظر نطاق ضار معروف
sd adblock check malware-c2.example.com

# فحص الإحصاءات
sd adblock stats

# عرض الحظوريات الأخيرة
sd adblock log --count 20
```

**التعطيل والتنظيف:**

```bash
sudo sd adblock disable
```

## الخطوات التالية

- إعداد [وكيل DNS](./dns-proxy) للتصفية الكاملة على مستوى DNS مع إعادة التوجيه إلى الخادم المنبع
- تهيئة [تنبيهات Webhook](../alerts/) للحصول على إشعارات عند حظر النطاقات
- استكشاف [مرجع CLI](../cli/) للحصول على قائمة الأوامر الكاملة

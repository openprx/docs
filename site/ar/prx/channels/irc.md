---
title: IRC (آي آر سي)
description: اربط PRX بـ IRC عبر TLS
---

# IRC (آي آر سي)

> اربط PRX بخوادم Internet Relay Chat (IRC) عبر TLS مع دعم القنوات والرسائل الخاصة وطرق مصادقة متعددة.

## المتطلبات المسبقة

- خادم IRC للاتصال (مثل Libera.Chat أو OFTC أو خادم خاص)
- اسم مستعار (nickname) للبوت
- خادم IRC يدعم TLS (المنفذ 6697 هو القياسي)

## الإعداد السريع

### 1. اختيار الخادم وتسجيل اسم مستعار (اختياري)

في الشبكات العامة مثل Libera.Chat، قد ترغب في تسجيل nickname للبوت لدى NickServ:

```
/msg NickServ REGISTER <password> <email>
```

### 2. التهيئة

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel"]
allowed_users = ["mynick", "*"]
```

مع مصادقة NickServ:

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel", "#another-channel"]
allowed_users = ["*"]
nickserv_password = "your-nickserv-password"
```

### 3. التحقق

```bash
prx channel doctor irc
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `server` | `String` | *required* | اسم مضيف خادم IRC (مثل `"irc.libera.chat"`) |
| `port` | `u16` | `6697` | منفذ خادم IRC (`6697` لـ TLS) |
| `nickname` | `String` | *required* | اسم البوت المستعار على شبكة IRC |
| `username` | `String` | *nickname* | اسم مستخدم IRC (يأخذ قيمة nickname افتراضيًا إذا لم يُضبط) |
| `channels` | `[String]` | `[]` | قنوات IRC التي ينضم إليها عند الاتصال (مثل `["#channel1", "#channel2"]`) |
| `allowed_users` | `[String]` | `[]` | الأسماء المستعارة المسموح بها (غير حساسة لحالة الأحرف). فارغة = رفض الجميع. `"*"` = السماح للجميع |
| `server_password` | `String` | `null` | كلمة مرور الخادم (لـ bouncers مثل ZNC) |
| `nickserv_password` | `String` | `null` | كلمة مرور NickServ IDENTIFY لمصادقة nickname |
| `sasl_password` | `String` | `null` | كلمة مرور SASL PLAIN لمصادقة IRCv3 |
| `verify_tls` | `bool` | `true` | التحقق من شهادة TLS الخاصة بالخادم |

## الميزات

- **تشفير TLS** -- جميع الاتصالات تستخدم TLS للأمان
- **طرق مصادقة متعددة** -- دعم server password وNickServ IDENTIFY وSASL PLAIN (IRCv3)
- **دعم متعدد القنوات** -- الانضمام والرد في عدة قنوات بالتزامن
- **دعم القنوات والرسائل الخاصة** -- التعامل مع channel PRIVMSG والرسائل المباشرة
- **خرج نصّي عادي** -- يتم تكييف الردود تلقائيًا لبيئة IRC (بدون markdown وبدون code fences)
- **تقسيم ذكي للرسائل** -- تقسيم الرسائل الطويلة مع مراعاة حدود طول أسطر IRC
- **إبقاء الاتصال حيًا** -- الرد على PING واكتشاف الاتصالات الميتة (مهلة قراءة 5 دقائق)
- **معرّفات رسائل أحادية الاتجاه** -- ضمان ترتيب فريد للرسائل تحت الضغط العالي

## القيود

- IRC يدعم النص العادي فقط؛ markdown وHTML والتنسيقات الغنية غير مدعومة
- الرسائل مقيّدة بحدود طول أسطر IRC (عادة 512 بايت مع حمل البروتوكول)
- لا يوجد دعم مدمج لمشاركة الوسائط أو الملفات
- قد ينقطع الاتصال إذا لم يستلم الخادم ردًا على PING ضمن المهلة
- بعض شبكات IRC تطبق إجراءات anti-flood قد تحدّ من معدل البوت
- تغييرات الاسم وإعادة الاتصال بعد انقسامات الشبكة مدعومة لكن قد تسبب انقطاعات قصيرة

## استكشاف الأخطاء وإصلاحها

### تعذر الاتصال بخادم IRC
- تأكد من صحة `server` و`port`
- تأكد أن المنفذ 6697 (TLS) غير محجوب بجدار ناري
- عند استخدام شهادة self-signed، اضبط `verify_tls = false`

### البوت ينضم للقنوات لكنه لا يرد
- تحقق أن nickname المرسل موجود في `allowed_users` (مطابقة غير حساسة لحالة الأحرف)
- اضبط `allowed_users = ["*"]` للسماح للجميع أثناء الاختبار
- تأكد أن البوت لديه صلاحية التحدث في القناة (غير مكتوم أو محظور)

### فشل مصادقة NickServ
- تأكد أن `nickserv_password` صحيحة
- يجب أن يكون nickname للبوت مسجّلًا لدى NickServ قبل التعريف
- بعض الشبكات تتطلب مصادقة SASL بدل NickServ؛ استخدم `sasl_password` في هذه الحالة

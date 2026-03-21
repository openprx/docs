---
title: Discord
description: ربط PRX بـ Discord عبر تطبيق بوت
---

# Discord

> ربط PRX بـ Discord باستخدام تطبيق بوت مع Gateway WebSocket للمراسلة الفورية في الخوادم والرسائل المباشرة.

## المتطلبات الأساسية

- حساب Discord
- تطبيق Discord مع مستخدم بوت مُنشأ في [بوابة المطورين](https://discord.com/developers/applications)
- دعوة البوت إلى خادمك بالصلاحيات المناسبة

## الإعداد السريع

### 1. إنشاء تطبيق بوت

1. اذهب إلى [بوابة مطوري Discord](https://discord.com/developers/applications)
2. انقر "New Application" وأعطه اسمًا
3. انتقل إلى قسم "Bot" وانقر "Add Bot"
4. انسخ رمز البوت
5. تحت "Privileged Gateway Intents"، فعّل **Message Content Intent**

### 2. دعوة البوت

أنشئ رابط دعوة تحت "OAuth2 > URL Generator":
- Scopes: `bot`
- Permissions: `Send Messages`، `Read Message History`، `Add Reactions`، `Attach Files`

### 3. الإعدادات

```toml
[channels_config.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
allowed_users = ["123456789012345678"]
```

### 4. التحقق

```bash
prx channel doctor discord
```

## مرجع الإعدادات

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `bot_token` | `String` | *مطلوب* | رمز بوت Discord من بوابة المطورين |
| `guild_id` | `String` | `null` | معرّف خادم (guild) اختياري لتقييد البوت لخادم واحد |
| `allowed_users` | `[String]` | `[]` | معرّفات مستخدمي Discord. فارغ = رفض الكل. `"*"` = السماح للكل |
| `listen_to_bots` | `bool` | `false` | عند التفعيل، يعالج رسائل البوتات الأخرى (يتجاهل رسائله دائمًا) |
| `mention_only` | `bool` | `false` | عند التفعيل، يرد فقط على الرسائل التي تشير إلى البوت بـ @ |

## الميزات

- **Gateway WebSocket** -- تسليم الرسائل الفوري عبر واجهة Gateway API الخاصة بـ Discord
- **دعم الخوادم والرسائل المباشرة** -- يرد في قنوات الخوادم والرسائل المباشرة
- **معالجة المرفقات النصية** -- يجلب ويُدرج مرفقات `text/*` تلقائيًا
- **تقييد الخادم** -- تقييد البوت اختياريًا لخادم واحد باستخدام `guild_id`
- **التواصل بين البوتات** -- فعّل `listen_to_bots` لسير العمل متعدد البوتات
- **مؤشرات الكتابة** -- يعرض حالة الكتابة أثناء توليد الاستجابات

## القيود

- رسائل Discord محدودة بـ 2,000 حرف (يقسّم PRX الاستجابات الأطول تلقائيًا)
- فقط مرفقات نوع MIME من `text/*` تُجلب وتُدرج؛ أنواع الملفات الأخرى تُتخطى
- يجب تفعيل "Message Content Intent" ليتمكن البوت من قراءة نص الرسائل
- يتطلب اتصال WebSocket مستقر ببوابة Discord

## استكشاف الأخطاء

### البوت متصل لكنه لا يرد
- تأكد أن "Message Content Intent" مفعّل في بوابة المطورين تحت إعدادات Bot
- تحقق أن معرّف مستخدم Discord الخاص بالمرسل موجود في `allowed_users`
- تأكد أن البوت لديه صلاحيات `Send Messages` و`Read Message History` في القناة

### البوت يعمل فقط في بعض القنوات
- إذا كان `guild_id` معيّنًا، يرد البوت فقط في ذلك الخادم المحدد
- تحقق أن البوت دُعي بالصلاحيات الصحيحة لكل قناة

### رسائل البوتات الأخرى تُتجاهل
- عيّن `listen_to_bots = true` لمعالجة رسائل حسابات البوتات الأخرى
- يتجاهل البوت دائمًا رسائله لمنع حلقات التغذية الراجعة

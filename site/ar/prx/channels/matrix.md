---
title: ماتريكس
description: اربط PRX بـ Matrix مع دعم التشفير الطرفي
---

# ماتريكس

> اربط PRX بشبكة Matrix باستخدام Client-Server API مع دعم اختياري للتشفير الطرفي (E2EE) ومراسلة تعتمد على الغرف.

## المتطلبات المسبقة

- خادم Matrix منزلي (مثل [matrix.org](https://matrix.org) أو Synapse/Dendrite مستضاف ذاتيًا)
- حساب bot على الخادم مع access token
- Room ID التي يجب أن يستمع فيها البوت
- بناء PRX مع علم الميزة `channel-matrix`

## الإعداد السريع

### 1. إنشاء حساب Bot

أنشئ حسابًا للبوت على خادم Matrix الخاص بك. يمكنك استخدام Element أو سطر الأوامر:

```bash
# Using curl against the homeserver API
curl -X POST "https://matrix.org/_matrix/client/v3/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "prx-bot", "password": "secure-password", "auth": {"type": "m.login.dummy"}}'
```

### 2. الحصول على Access Token

```bash
curl -X POST "https://matrix.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type": "m.login.password", "user": "prx-bot", "password": "secure-password"}'
```

### 3. دعوة البوت إلى غرفة

من عميل Matrix لديك، ادعُ حساب البوت إلى الغرفة المطلوبة. دوّن Room ID (الصيغة: `!abc123:matrix.org`).

### 4. التهيئة

```toml
[channels_config.matrix]
homeserver = "https://matrix.org"
access_token = "syt_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
room_id = "!abc123def456:matrix.org"
allowed_users = ["@alice:matrix.org", "@bob:matrix.org"]
```

### 5. التحقق

```bash
prx channel doctor matrix
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `homeserver` | `String` | *required* | رابط Matrix homeserver (مثل `"https://matrix.org"`) |
| `access_token` | `String` | *required* | Matrix access token لحساب البوت |
| `user_id` | `String` | `null` | Matrix user ID (مثل `"@bot:matrix.org"`). يُستخدم لاستعادة الجلسة |
| `device_id` | `String` | `null` | Matrix device ID. يُستخدم لاستمرارية جلسة E2EE |
| `room_id` | `String` | *required* | Room ID التي يتم الاستماع فيها (مثل `"!abc123:matrix.org"`) |
| `allowed_users` | `[String]` | `[]` | Matrix user IDs المسموح بها. فارغة = رفض الجميع. `"*"` = السماح للجميع |

## الميزات

- **تشفير طرفي** -- دعم الغرف المشفرة باستخدام matrix-sdk مع Vodozemac
- **مراسلة مبنية على الغرف** -- الاستماع والرد داخل غرفة Matrix محددة
- **تفاعلات الرسائل** -- إضافة تفاعلات لتأكيد الاستلام والإكمال
- **إيصالات قراءة** -- إرسال read receipts للرسائل المعالجة
- **استمرارية الجلسة** -- تخزين جلسات التشفير محليًا لاستمرارية E2EE بعد إعادة التشغيل
- **غير مرتبط بمزود محدد** -- يعمل مع أي Matrix homeserver (Synapse وDendrite وConduit وغيرها)

## القيود

- يستمع حاليًا في غرفة واحدة فقط (محددة عبر `room_id`)
- يتطلب علم الميزة `channel-matrix` وقت البناء
- لا يدعم بعد نسخ مفاتيح E2EE الاحتياطي والتحقق المتبادل عبر cross-signing
- الغرف الكبيرة ذات معدل الرسائل المرتفع قد تزيد استهلاك الموارد
- يجب دعوة البوت إلى الغرفة قبل أن يتمكن من الاستماع

## استكشاف الأخطاء وإصلاحها

### البوت لا يرد في الغرف المشفرة
- تأكد من ضبط `user_id` و`device_id` لإدارة صحيحة لجلسات E2EE
- احذف مخزن التشفير المحلي وأعد التشغيل لإعادة إنشاء جلسات التشفير
- تحقق من أن حساب البوت موثّق/موثوق لدى أعضاء الغرفة

### خطأ "Room not found"
- تأكد من صحة صيغة Room ID (`!` في البداية و`:homeserver` في النهاية)
- تأكد أن البوت تمت دعوته وانضم إلى الغرفة
- Room aliases (مثل `#room:matrix.org`) غير مدعومة؛ استخدم Room ID

### رفض Access token
- قد تنتهي صلاحية Access tokens؛ أنشئ واحدًا جديدًا عبر Login API
- تأكد أن الرمز يتبع الـ homeserver الصحيح

---
title: Nextcloud Talk (نكست كلاود Talk)
description: اربط PRX بـ Nextcloud Talk عبر OCS API
---

# Nextcloud Talk (نكست كلاود Talk)

> اربط PRX بـ Nextcloud Talk باستخدام OCS API وتسليم رسائل مبني على webhook للمراسلة الجماعية المستضافة ذاتيًا.

## المتطلبات المسبقة

- نسخة Nextcloud (يُوصى بالإصدار 25 أو أحدث) مع تفعيل تطبيق Talk
- bot app token لمصادقة OCS API
- إعداد webhook لتسليم الرسائل الواردة

## الإعداد السريع

### 1. إنشاء Bot App Token

في Nextcloud، أنشئ app password:
1. اذهب إلى **Settings > Security > Devices & Sessions**
2. أنشئ app password جديدًا باسم وصفي (مثل "PRX Bot")
3. انسخ الرمز الذي تم توليده

بديلًا من ذلك، لـ Nextcloud Talk Bot API (Nextcloud 27+):
1. استخدم `occ` لتسجيل بوت: `php occ talk:bot:setup "PRX" <secret> <webhook-url>`

### 2. التهيئة

```toml
[channels_config.nextcloud_talk]
base_url = "https://cloud.example.com"
app_token = "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
allowed_users = ["admin", "alice"]
```

### 3. إعداد Webhooks

هيّئ Nextcloud Talk bot لإرسال أحداث webhook إلى نقطة بوابة PRX:

```
POST https://your-prx-domain.com/nextcloud-talk
```

### 4. التحقق

```bash
prx channel doctor nextcloud_talk
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `base_url` | `String` | *required* | الرابط الأساسي لـ Nextcloud (مثل `"https://cloud.example.com"`) |
| `app_token` | `String` | *required* | Bot app token لمصادقة bearer على OCS API |
| `webhook_secret` | `String` | `null` | سرّ مشترك للتحقق من توقيع webhook عبر `HMAC-SHA256`. يمكن ضبطه أيضًا عبر متغير البيئة `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` |
| `allowed_users` | `[String]` | `[]` | Nextcloud actor IDs المسموح بها. فارغة = رفض الجميع. `"*"` = السماح للجميع |

## الميزات

- **تسليم عبر Webhook** -- استلام الرسائل عبر HTTP webhook push من Nextcloud Talk
- **ردود عبر OCS API** -- إرسال الردود من خلال Nextcloud Talk OCS REST API
- **تحقق HMAC-SHA256** -- تحقق اختياري من توقيع webhook باستخدام `webhook_secret`
- **دعم صيغ Payload متعددة** -- يدعم الصيغة القديمة/المخصصة وصيغة Activity Streams 2.0 (webhooks الخاصة ببوت Nextcloud Talk)
- **استضافة ذاتية** -- يعمل مع أي نسخة Nextcloud مع بقاء كل البيانات ضمن بنيتك التحتية

## القيود

- يتطلب نقطة نهاية HTTPS عامة لتسليم webhook (أو reverse proxy)
- Nextcloud Talk bot API متاح من Nextcloud 27+؛ الإصدارات الأقدم تتطلب إعداد webhook مخصص
- يجب تسجيل البوت داخل غرفة Talk لاستقبال الرسائل
- معالجة الملفات والوسائط غير مدعومة حاليًا
- payloads التي تستخدم timestamps بالميلي ثانية تُطبّع تلقائيًا إلى ثوانٍ

## استكشاف الأخطاء وإصلاحها

### لا يتم استلام أحداث webhook
- تأكد أن رابط webhook متاح للعامة ويشير إلى `https://your-domain/nextcloud-talk`
- تأكد من تسجيل البوت في غرفة Talk
- راجع سجلات خادم Nextcloud لأخطاء تسليم webhook

### فشل التحقق من التوقيع
- تأكد أن `webhook_secret` يطابق السر المستخدم عند تسجيل البوت
- يمكن ضبط السر عبر الإعدادات أو متغير البيئة `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET`

### لا يتم نشر الردود
- تأكد أن `base_url` صحيح ويمكن الوصول إليه من خادم PRX
- تحقق أن `app_token` لديه صلاحية نشر الرسائل في الغرفة
- راجع استجابة OCS API لأخطاء المصادقة أو الصلاحيات

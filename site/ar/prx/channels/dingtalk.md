---
title: DingTalk (دينغ توك)
description: اربط PRX بـ DingTalk (Alibaba) عبر Stream Mode
---

# DingTalk (دينغ توك)

> اربط PRX بـ DingTalk باستخدام Stream Mode WebSocket API للمراسلة الفورية عبر البوت على منصة العمل من Alibaba.

## المتطلبات المسبقة

- مؤسسة DingTalk (شركة أو فريق)
- تطبيق bot مُنشأ في [DingTalk Developer Console](https://open-dev.dingtalk.com/)
- Client ID (AppKey) وClient Secret (AppSecret) من لوحة المطور

## الإعداد السريع

### 1. إنشاء DingTalk Bot

1. اذهب إلى [DingTalk Open Platform](https://open-dev.dingtalk.com/) وسجّل الدخول
2. أنشئ "Enterprise Internal Application" جديدًا (أو "H5 Micro Application")
3. أضف قدرة "Robot" إلى تطبيقك
4. ضمن "Credentials" انسخ **Client ID** (AppKey) و**Client Secret** (AppSecret)
5. فعّل "Stream Mode" ضمن إعدادات البوت

### 2. التهيئة

```toml
[channels_config.dingtalk]
client_id = "dingxxxxxxxxxxxxxxxxxx"
client_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["manager1234"]
```

### 3. التحقق

```bash
prx channel doctor dingtalk
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `client_id` | `String` | *required* | Client ID (AppKey) من لوحة مطور DingTalk |
| `client_secret` | `String` | *required* | Client Secret (AppSecret) من لوحة المطور |
| `allowed_users` | `[String]` | `[]` | Staff IDs المسموح بها في DingTalk. فارغة = رفض الجميع. `"*"` = السماح للجميع |

## الميزات

- **Stream Mode WebSocket** -- اتصال WebSocket دائم مع بوابة DingTalk لتسليم الرسائل لحظيًا
- **لا يحتاج رابطًا عامًا** -- Stream Mode يعتمد اتصالًا خارجيًا صادرًا، دون إعداد webhook وارد
- **دردشات خاصة ومجموعات** -- التعامل مع محادثات 1:1 ورسائل المجموعات
- **Session webhooks** -- إرسال الردود عبر روابط webhook خاصة بكل رسالة يوفّرها DingTalk
- **تسجيل تلقائي مع البوابة** -- التسجيل مع بوابة DingTalk للحصول على WebSocket endpoint وتذكرة
- **اكتشاف نوع المحادثة** -- التمييز بين المحادثات الخاصة ومحادثات المجموعات

## القيود

- Stream Mode يتطلب اتصال WebSocket خارجيًا ثابتًا إلى خوادم DingTalk
- الردود تستخدم Session webhooks لكل رسالة، وقد تنتهي صلاحيتها إذا تأخر الاستخدام
- يجب إضافة البوت إلى المجموعة بواسطة مشرف قبل أن يستقبل رسائل المجموعة
- توثيق DingTalk غالبًا باللغة الصينية؛ الدعم الدولي محدود
- قد يتطلب نشر التطبيقات الداخلية موافقة إدارة المؤسسة

## استكشاف الأخطاء وإصلاحها

### البوت لا يتصل بـ DingTalk
- تحقق من صحة `client_id` و`client_secret`
- تأكد من تفعيل "Stream Mode" في لوحة مطور DingTalk ضمن إعدادات البوت
- افحص أن الاتصالات الخارجية إلى خوادم DingTalk غير محجوبة بجدار ناري

### يتم استلام الرسائل لكن الردود تفشل
- Session webhooks مرتبطة بكل رسالة وقد تنتهي سريعًا؛ أرسل الردود دون تأخير
- تحقق من امتلاك البوت لصلاحيات API اللازمة في لوحة المطور

### لا يتم استلام رسائل المجموعات
- يجب إضافة البوت إلى المجموعة بشكل صريح بواسطة مشرف
- تحقق أن Staff ID للمرسل ضمن `allowed_users`، أو اضبط `allowed_users = ["*"]`

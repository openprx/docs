---
title: Mattermost (ماترموست)
description: اربط PRX بـ Mattermost عبر REST API
---

# Mattermost (ماترموست)

> اربط PRX بـ Mattermost باستخدام REST API v4 للمراسلة في هذا البديل المفتوح المصدر والمستضاف ذاتيًا لـ Slack.

## المتطلبات المسبقة

- خادم Mattermost (مستضاف ذاتيًا أو سحابي)
- حساب bot مُنشأ في Mattermost مع personal access token
- دعوة البوت إلى القنوات التي يجب أن يعمل فيها

## الإعداد السريع

### 1. إنشاء حساب Bot

1. اذهب إلى **System Console > Integrations > Bot Accounts** وفعّل حسابات البوت
2. اذهب إلى **Integrations > Bot Accounts > Add Bot Account**
3. اضبط اسم المستخدم واسم العرض والدور
4. انسخ **Access Token** الذي تم توليده

بديلًا من ذلك، يمكنك إنشاء حساب مستخدم عادي وتوليد personal access token من **Profile > Security > Personal Access Tokens**.

### 2. التهيئة

```toml
[channels_config.mattermost]
url = "https://mattermost.example.com"
bot_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
channel_id = "abc123def456ghi789"
allowed_users = ["user123456"]
```

### 3. التحقق

```bash
prx channel doctor mattermost
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `url` | `String` | *required* | رابط خادم Mattermost (مثل `"https://mattermost.example.com"`) |
| `bot_token` | `String` | *required* | Bot access token أو personal access token |
| `channel_id` | `String` | `null` | Channel ID اختياري لتقييد البوت على قناة واحدة |
| `allowed_users` | `[String]` | `[]` | Mattermost user IDs المسموح بها. فارغة = رفض الجميع. `"*"` = السماح للجميع |
| `thread_replies` | `bool` | `true` | عند `true` تكون الردود ضمن thread للمنشور الأصلي. عند `false` تُنشر الردود في جذر القناة |
| `mention_only` | `bool` | `false` | عند `true` يرد فقط على الرسائل التي تتضمن @-mention للبوت |

## الميزات

- **REST API v4** -- استخدام Mattermost API القياسي لإرسال واستقبال الرسائل
- **ردود Threaded** -- الرد تلقائيًا داخل thread الأصلي
- **مؤشرات الكتابة** -- إظهار حالة الكتابة أثناء توليد الرد
- **ملائم للاستضافة الذاتية** -- يعمل مع أي نشر لـ Mattermost بدون اعتماديات خارجية
- **تقييد القناة** -- حصر البوت اختياريًا في قناة واحدة عبر `channel_id`
- **تصفية mentions** -- الرد فقط على @-mentions في القنوات المزدحمة

## القيود

- يستخدم polling بدل WebSocket لتسليم الرسائل، مما يضيف تأخيرًا بسيطًا
- يجب أن يكون البوت عضوًا في القناة لقراءة الرسائل وإرسالها
- تفعيل حسابات البوت يتطلب System Admin في Mattermost System Console
- معالجة مرفقات الملفات غير مدعومة حاليًا
- تتم إزالة الشرطة المائلة الأخيرة في الرابط تلقائيًا

## استكشاف الأخطاء وإصلاحها

### البوت لا يرد
- تأكد أن `url` لا يحتوي على trailing slash (يُزال تلقائيًا، لكن تحقق)
- تأكد من صحة bot token: `curl -H "Authorization: Bearer <token>" https://your-mm.com/api/v4/users/me`
- تأكد من إضافة البوت إلى القناة

### الردود تذهب إلى مكان خاطئ
- إذا كان `thread_replies = true` فالرد يكون في thread حسب `root_id` للمنشور الأصلي
- إذا لم تكن الرسالة الأصلية ضمن thread، سيتم إنشاء thread جديد
- اضبط `thread_replies = false` للنشر دائمًا في جذر القناة

### البوت يرد على كل شيء في القناة
- اضبط `mention_only = true` للرد فقط عند @-mention
- أو قيد البوت في قناة مخصصة عبر `channel_id`

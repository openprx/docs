---
title: Slack
description: ربط PRX بـ Slack عبر Bot API وSocket Mode
---

# Slack

> ربط PRX بـ Slack باستخدام بوت مع رموز OAuth وSocket Mode لأحداث الوقت الفعلي ودعم المحادثات في السلاسل.

## المتطلبات الأساسية

- مساحة عمل Slack لديك صلاحية تثبيت التطبيقات فيها
- تطبيق Slack مُنشأ في [api.slack.com/apps](https://api.slack.com/apps)
- رمز بوت (`xoxb-...`) واختياريًا رمز مستوى التطبيق (`xapp-...`) لـ Socket Mode

## الإعداد السريع

### 1. إنشاء تطبيق Slack

1. اذهب إلى [api.slack.com/apps](https://api.slack.com/apps) وانقر "Create New App"
2. اختر "From scratch" وحدد مساحة عملك
3. تحت "OAuth & Permissions"، أضف صلاحيات البوت هذه:
   - `chat:write`، `channels:history`، `groups:history`، `im:history`، `mpim:history`
   - `files:read`، `files:write`، `reactions:write`، `users:read`
4. ثبّت التطبيق في مساحة عملك وانسخ **Bot User OAuth Token** (`xoxb-...`)

### 2. تفعيل Socket Mode (موصى به)

1. تحت "Socket Mode"، فعّله وأنشئ رمز مستوى التطبيق (`xapp-...`) بصلاحية `connections:write`
2. تحت "Event Subscriptions"، اشترك في: `message.channels`، `message.groups`، `message.im`، `message.mpim`

### 3. الإعدادات

```toml
[channels_config.slack]
bot_token = "xoxb-your-bot-token-here"
app_token = "xapp-your-app-token-here"
allowed_users = ["U01ABCDEF"]
```

### 4. التحقق

```bash
prx channel doctor slack
```

## مرجع الإعدادات

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `bot_token` | `String` | *مطلوب* | رمز OAuth لبوت Slack (`xoxb-...`) |
| `app_token` | `String` | `null` | رمز مستوى التطبيق (`xapp-...`) لـ Socket Mode. بدونه، يعود إلى الاستطلاع |
| `channel_id` | `String` | `null` | تقييد البوت لقناة واحدة. احذفه أو عيّنه لـ `"*"` للاستماع عبر جميع القنوات |
| `allowed_users` | `[String]` | `[]` | معرّفات مستخدمي Slack. فارغ = رفض الكل. `"*"` = السماح للكل |
| `interrupt_on_new_message` | `bool` | `false` | عند التفعيل، تلغي رسالة جديدة من نفس المرسل الطلب الجاري |
| `thread_replies` | `bool` | `true` | عند التفعيل، تبقى الردود في السلسلة الأصلية. عند التعطيل، تذهب الردود إلى جذر القناة |
| `mention_only` | `bool` | `false` | عند التفعيل، يرد فقط على الإشارات بـ @. تُعالج الرسائل المباشرة دائمًا |

## الميزات

- **Socket Mode** -- تسليم الأحداث الفوري بدون عنوان URL عام (يتطلب `app_token`)
- **الردود في السلاسل** -- يرد تلقائيًا داخل السلسلة الأصلية
- **مرفقات الملفات** -- يحمّل ويُدرج الملفات النصية؛ يعالج الصور حتى 5 ميجابايت
- **أسماء العرض** -- يحلّ معرّفات مستخدمي Slack إلى أسماء العرض مع تخزين مؤقت (صلاحية 6 ساعات)
- **دعم القنوات المتعددة** -- الاستماع عبر قنوات متعددة أو التقييد لواحدة
- **مؤشرات الكتابة** -- يعرض حالة الكتابة أثناء توليد الاستجابات
- **دعم المقاطعة** -- إلغاء الطلبات الجارية عند إرسال المستخدم متابعة

## القيود

- رسائل Slack محدودة بـ 40,000 حرف (نادرًا ما تكون مشكلة)
- تحميل الملفات محدود بـ 256 كيلوبايت للنصوص و5 ميجابايت للصور
- الحد الأقصى 8 مرفقات ملفات تُعالج لكل رسالة
- يتطلب Socket Mode صلاحية `connections:write` على رمز مستوى التطبيق
- بدون Socket Mode (`app_token`)، تعود القناة إلى الاستطلاع بتأخير أعلى

## استكشاف الأخطاء

### البوت لا يستقبل الرسائل
- تحقق أن Socket Mode مفعّل و`app_token` صحيح
- تأكد أن "Event Subscriptions" تتضمن أحداث `message.*` اللازمة
- تأكد أن البوت دُعي إلى القناة (`/invite @botname`)

### الردود تذهب إلى القناة بدلاً من السلسلة
- تأكد أن `thread_replies` ليست معيّنة على `false`
- ردود السلاسل تتطلب أن تحتوي الرسالة الأصلية على `thread_ts`

### مرفقات الملفات لا تُعالج
- تأكد أن البوت لديه صلاحية `files:read`
- فقط أنواع MIME من `text/*` وأنواع الصور الشائعة مدعومة
- تُتخطى الملفات الأكبر من حدود الحجم بصمت

---
title: QQ (كيوكيو)
description: اربط PRX بـ QQ للمراسلة الفورية عبر Bot API
---

# QQ (كيوكيو)

> اربط PRX بـ QQ باستخدام Bot API الرسمي مع دعم الرسائل الخاصة ومحادثات المجموعات وguilds ومرفقات الوسائط.

## المتطلبات المسبقة

- حساب QQ (شخصي أو مؤسسي)
- تطبيق bot مسجل على [QQ Open Platform](https://q.qq.com/)
- App ID وApp Secret من لوحة المطور
- يجب اعتماد البوت ونشره (يتوفر sandbox mode للاختبار)

## الإعداد السريع

### 1. إنشاء QQ Bot

1. اذهب إلى [QQ Open Platform](https://q.qq.com/) وسجّل الدخول بحساب QQ
2. انتقل إلى "Applications" وأنشئ تطبيق bot جديدًا
3. املأ اسم البوت والوصف والصورة الرمزية
4. ضمن "Development Settings" انسخ **App ID** و**App Secret**
5. هيّئ intents الخاصة بالبوت (أنواع الرسائل التي يجب أن يستقبلها)
6. للاختبار، فعّل sandbox mode لحصر البوت في test guild محددة

### 2. التهيئة

أضف ما يلي إلى ملف إعداد PRX:

```toml
[channels_config.qq]
app_id = "102012345"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["user_openid_1", "user_openid_2"]
sandbox = true
```

اضبط `sandbox = false` بعد اعتماد البوت للاستخدام الإنتاجي.

### 3. التحقق

```bash
prx channel doctor qq
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `app_id` | `String` | *required* | Application ID من لوحة مطور QQ Open Platform |
| `app_secret` | `String` | *required* | Application secret من لوحة المطور |
| `allowed_users` | `[String]` | `[]` | User OpenIDs المسموح بها. فارغة = وضع pairing. `"*"` = السماح للجميع |
| `sandbox` | `bool` | `false` | عند `true` يتم الاتصال بـ sandbox gateway للاختبار |
| `intents` | `[String]` | `["guilds", "guild_messages", "direct_messages"]` | Event intents المطلوب الاشتراك بها |
| `stream_mode` | `String` | `"none"` | وضع البث: `"none"` أو `"typing"`. وضع typing يرسل مؤشر كتابة أثناء التوليد |
| `interrupt_on_new_message` | `bool` | `false` | عند `true` تلغي الرسالة الجديدة من نفس المرسل الطلب الجاري |
| `mention_only` | `bool` | `false` | عند `true` يرد فقط على @-mentions في قنوات المجموعة أو guild. الرسائل المباشرة تُعالج دائمًا |
| `ack_reactions` | `bool` | *inherited* | تجاوز لإعداد `ack_reactions` العام. يعود إلى `[channels_config].ack_reactions` إذا لم يُضبط |

## آلية العمل

يتصل PRX بـ QQ Bot API عبر تدفق أحداث يعتمد على WebSocket. دورة الاتصال كالتالي:

1. **Authentication** -- يحصل PRX على access token باستخدام App ID وApp Secret عبر OAuth2 client credentials
2. **Gateway discovery** -- يطلب البوت WebSocket gateway URL من QQ API
3. **Session establishment** -- يتم فتح اتصال WebSocket إلى البوابة باستخدام access token
4. **Intent subscription** -- يحدد البوت أنواع الأحداث التي يريد استقبالها
5. **Event loop** -- تُرسل الرسائل الواردة إلى PRX agent loop؛ وتُرسل الردود عبر REST API

```
QQ Gateway (WSS) ──► PRX Channel Handler ──► Agent Loop
                                                │
QQ REST API ◄───── Reply with message ◄────────┘
```

## الميزات

- **مراسلة guild والمجموعات** -- الرد على الرسائل في QQ guilds (القنوات) ومحادثات المجموعات
- **رسائل مباشرة** -- التعامل مع المحادثات الخاصة 1:1 مع المستخدمين
- **وضع Pairing** -- ربط آمن برمز لمرة واحدة عند عدم ضبط مستخدمين مسموحين
- **مرفقات الوسائط** -- دعم إرسال واستقبال الصور والملفات والبطاقات الغنية
- **ردود Markdown** -- تدعم بوتات QQ جزءًا من تنسيق Markdown في الردود
- **تفاعلات التأكيد** -- يضيف تفاعلات لتأكيد استلام الرسائل عند التفعيل
- **Sandbox mode** -- اختبار البوت في بيئة guild معزولة قبل النشر الإنتاجي
- **تجديد تلقائي للرمز** -- يتم تحديث access tokens تلقائيًا قبل الانتهاء
- **متعدد المنصات** -- يعمل على QQ desktop وmobile وQQ for Linux

## أنواع الرسائل

يدعم QQ Bot API عدة أنواع لمحتوى الرسائل:

| النوع | الاتجاه | الوصف |
|------|-----------|-------------|
| Text | Send / Receive | رسائل نصية عادية حتى 2,048 حرفًا |
| Markdown | Send | نص منسق باستخدام جزء Markdown المدعوم في QQ |
| Image | Send / Receive | مرفقات صور (JPEG, PNG, GIF) |
| File | Receive | مرفقات ملفات من المستخدمين |
| Rich embed | Send | رسائل بطاقة مهيكلة بعنون ووصف وصورة مصغرة |
| Ark template | Send | رسائل غنية معتمدة على قوالب باستخدام نظام Ark في QQ |

## النوايا (Intents)

تتحكم Intents في الأحداث التي يستقبلها البوت. Intents المتاحة:

| Intent | الأحداث | ملاحظات |
|--------|--------|-------|
| `guilds` | إنشاء/تحديث/حذف Guild | تغييرات بيانات Guild |
| `guild_members` | إضافة/تحديث/إزالة عضو | يتطلب صلاحيات مرتفعة |
| `guild_messages` | الرسائل في قنوات النص داخل Guild | الأكثر شيوعًا |
| `guild_message_reactions` | إضافة/إزالة تفاعلات داخل Guild | تفاعلات Emoji |
| `direct_messages` | الرسائل الخاصة مع البوت | موصى به دائمًا |
| `group_and_c2c` | محادثات المجموعات ورسائل C2C | يتطلب موافقة منفصلة |
| `interaction` | ضغط الأزرار والتفاعلات | لمكونات الرسائل التفاعلية |

## القيود

- QQ Bot API مقيّد جغرافيًا؛ التوفر الأساسي في برّ الصين الرئيسي
- sandbox mode يقيّد البوت إلى test guild واحدة بعدد أعضاء محدود
- بوتات الإنتاج تتطلب موافقة فريق مراجعة QQ Open Platform
- رسائل المجموعات وC2C تتطلب طلب صلاحية منفصل
- رفع الملفات محدود بـ 20 MB لكل مرفق
- QQ يفرض مراجعة محتوى الرسائل؛ المحتوى المحظور قد يُسقط دون إشعار
- توجد حدود معدل: نحو 5 رسائل/ثانية لكل guild، و2/ثانية للرسائل المباشرة
- لا يمكن للبوت بدء المحادثات؛ يجب أن يضيفه المستخدم أو المشرف أولًا

## استكشاف الأخطاء وإصلاحها

### البوت لا يتصل بـ QQ gateway

- تحقق من صحة `app_id` و`app_secret` باستخدام `prx channel doctor qq`
- عند استخدام sandbox mode، تأكد من ضبط `sandbox = true` (بوابات sandbox والإنتاج مختلفة)
- تأكد أن الاتصالات الخارجية إلى `api.sgroup.qq.com` وبوابة WebSocket غير محجوبة

### البوت يتصل لكنه لا يستقبل الرسائل

- تحقق أن `intents` المناسبة لحالة الاستخدام مهيأة
- في قنوات guild، قد يحتاج البوت صلاحية "Receive Messages" من مشرف guild
- تأكد أن OpenID للمرسل موجود في `allowed_users`، أو اضبط `allowed_users = ["*"]`

### الردود لا تصل

- QQ يفرض مراجعة محتوى؛ راجع سجلات PRX لردود الرفض من API
- تأكد أن البوت يملك صلاحية "Send Messages" في guild أو المجموعة المستهدفة
- لردود DM، يجب أن يرسل المستخدم رسالة للبوت أولًا لفتح المحادثة

### فشل تجديد الرمز

- قد يكون App Secret تم تدويره في لوحة المطور؛ حدّث الإعداد بالقيمة الجديدة
- مشاكل الشبكة قد تمنع تجديد الرمز؛ افحص الاتصال بـ `bots.qq.com`

## صفحات ذات صلة

- [نظرة عامة على القنوات](./)
- [DingTalk](./dingtalk) -- إعداد مشابه لمنصة DingTalk
- [Lark](./lark) -- إعداد مشابه لـ Lark / Feishu
- [Security: Pairing](../security/pairing) -- تفاصيل ربط pairing برمز لمرة واحدة

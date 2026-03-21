---
title: Lark / Feishu (لارك / فيشو)
description: اربط PRX بـ Lark (الدولي) أو Feishu (الصين) للمراسلة الفورية
---

# Lark / Feishu (لارك / فيشو)

> اربط PRX بـ Lark (الدولي) أو Feishu (برّ الصين الرئيسي) باستخدام Open Platform API مع WebSocket long-connection أو تسليم أحداث HTTP webhook.

## المتطلبات المسبقة

- مؤسسة (tenant) على Lark أو Feishu
- تطبيق مُنشأ في [Lark Developer Console](https://open.larksuite.com/app) أو [Feishu Developer Console](https://open.feishu.cn/app)
- App ID وApp Secret وVerification Token من لوحة المطور

## الإعداد السريع

### 1. إنشاء تطبيق Bot

1. اذهب إلى لوحة المطور وأنشئ Custom App جديدًا
2. ضمن "Credentials" انسخ **App ID** و**App Secret**
3. ضمن "Event Subscriptions" انسخ **Verification Token**
4. أضف قدرة البوت واضبط الصلاحيات التالية:
   - `im:message`, `im:message.group_at_msg`, `im:message.p2p_msg`

### 2. التهيئة

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]
```

لـ Feishu (الصين):

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
use_feishu = true
allowed_users = ["*"]
```

### 3. التحقق

```bash
prx channel doctor lark
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `app_id` | `String` | *required* | App ID من لوحة مطور Lark/Feishu |
| `app_secret` | `String` | *required* | App Secret من لوحة المطور |
| `verification_token` | `String` | `null` | Verification token للتحقق من webhook |
| `encrypt_key` | `String` | `null` | مفتاح تشفير لفك تشفير رسائل webhook |
| `allowed_users` | `[String]` | `[]` | معرّفات المستخدمين أو union IDs المسموح بها. فارغة = رفض الجميع. `"*"` = السماح للجميع |
| `mention_only` | `bool` | `false` | عند `true` يرد فقط على @-mentions في المجموعات. الرسائل المباشرة تُعالج دائمًا |
| `use_feishu` | `bool` | `false` | عند `true` يستخدم نقاط نهاية Feishu (CN) بدل Lark (الدولي) |
| `receive_mode` | `String` | `"websocket"` | وضع استقبال الأحداث: `"websocket"` (افتراضي، لا يحتاج رابطًا عامًا) أو `"webhook"` |
| `port` | `u16` | `null` | منفذ HTTP لوضع webhook فقط. مطلوب عندما `receive_mode = "webhook"`، ومُتجاهل في websocket |

## الميزات

- **WebSocket long-connection** -- اتصال WSS دائم لأحداث فورية بدون رابط عام (الوضع الافتراضي)
- **وضع HTTP webhook** -- طريقة بديلة لتسليم الأحداث عبر HTTP callbacks عند الحاجة
- **دعم Lark وFeishu** -- تبديل تلقائي لنقاط API بين Lark (الدولي) وFeishu (الصين)
- **تفاعلات تأكيد الاستلام** -- يضيف تفاعلات مناسبة للّغة/المنطقة (zh-CN وzh-TW وen وja)
- **مراسلة مباشرة ومجموعات** -- يدعم الدردشات الخاصة ومحادثات المجموعات
- **إدارة tenant access token** -- جلب وتجديد تلقائي لرموز الوصول الخاصة بالمؤسسة
- **إزالة تكرار الرسائل** -- يمنع المعالجة المزدوجة لرسائل WebSocket ضمن نافذة 30 دقيقة

## القيود

- وضع WebSocket يتطلب اتصالًا خارجيًا ثابتًا بخوادم Lark/Feishu
- وضع Webhook يتطلب نقطة نهاية HTTPS عامة
- يجب إضافة البوت إلى المجموعة قبل أن يستقبل رسائل المجموعة
- Feishu وLark يستخدمان نطاقات API مختلفة؛ تأكد أن `use_feishu` يطابق منطقة المؤسسة
- قد يتطلب الأمر موافقة تطبيق المؤسسة حسب سياسات إدارة المؤسسة

## استكشاف الأخطاء وإصلاحها

### البوت لا يستقبل الرسائل
- في وضع websocket، تأكد أن الاتصالات الخارجية إلى `open.larksuite.com` (أو `open.feishu.cn`) مسموحة
- تحقق أن التطبيق يملك صلاحيات `im:message` المطلوبة وأنه تم اعتماده/نشره
- تأكد أن البوت مضاف للمجموعة أو أن المستخدم بدأ رسالة مباشرة معه

### "Verification failed" في أحداث webhook
- تحقق أن `verification_token` يطابق القيمة في لوحة المطور
- إذا كنت تستخدم `encrypt_key` فتأكد من مطابقته للإعداد في اللوحة تمامًا

### منطقة API غير صحيحة
- إذا كنت تستخدم مؤسسة Feishu (الصين)، اضبط `use_feishu = true`
- إذا كنت تستخدم مؤسسة Lark (الدولي)، تأكد أن `use_feishu = false` (الافتراضي)

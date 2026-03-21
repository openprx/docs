---
title: واتساب (Cloud API)
description: اربط PRX بـ WhatsApp عبر Business Cloud API
---

# واتساب (Cloud API)

> اربط PRX بـ WhatsApp باستخدام Meta Business Cloud API للمراسلة المعتمدة على Webhook مع منصة WhatsApp Business.

## المتطلبات المسبقة

- حساب [Meta Business](https://business.facebook.com/)
- تطبيق WhatsApp Business API مُعدّ في [Meta Developer Portal](https://developers.facebook.com/)
- Phone Number ID وAccess Token من WhatsApp Business API
- نقطة نهاية HTTPS عامة يمكن الوصول إليها للويبهوك

## الإعداد السريع

### 1. إعداد WhatsApp Business API

1. اذهب إلى [Meta Developer Portal](https://developers.facebook.com/) وأنشئ تطبيقًا
2. أضف منتج "WhatsApp" إلى تطبيقك
3. من "WhatsApp > API Setup"، دوّن **Phone Number ID** وأنشئ **Permanent Access Token**

### 2. تهيئة PRX

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxxxxxxxxxxxxxxxxxxx"
phone_number_id = "123456789012345"
verify_token = "my-secret-verify-token"
allowed_numbers = ["+1234567890"]
```

### 3. إعداد Webhooks

1. في Meta Developer Portal، اذهب إلى "WhatsApp > Configuration"
2. اضبط رابط webhook على `https://your-domain.com/whatsapp`
3. أدخل نفس `verify_token` الذي ضبطته في PRX
4. اشترك في حقل webhook باسم `messages`

### 4. التحقق

```bash
prx channel doctor whatsapp
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `access_token` | `String` | *required* | Permanent access token من Meta Business API |
| `phone_number_id` | `String` | *required* | Phone number ID من Meta Business API. وجود هذا الحقل يحدد وضع Cloud API |
| `verify_token` | `String` | *required* | سرّ مشترك لعملية التحقق من webhook |
| `app_secret` | `String` | `null` | App secret للتحقق من توقيع webhook (`HMAC-SHA256`). يمكن ضبطه أيضًا عبر متغير البيئة `ZEROCLAW_WHATSAPP_APP_SECRET` |
| `allowed_numbers` | `[String]` | `[]` | أرقام الهواتف المسموح بها بصيغة E.164 (مثل `"+1234567890"`). القيمة `"*"` = السماح للجميع |

## الميزات

- **مراسلة عبر Webhook** -- يستقبل الرسائل عبر إشعارات push من Meta webhook
- **تصفية أرقام E.164** -- تقييد الوصول على أرقام هواتف محددة
- **فرض HTTPS** -- يرفض نقل البيانات عبر روابط غير HTTPS
- **التحقق من توقيع Webhook** -- تحقق اختياري `HMAC-SHA256` باستخدام `app_secret`
- **رسائل نصية ووسائط** -- يتعامل مع النصوص والصور وأنواع الوسائط الأخرى الواردة

## القيود

- يتطلب نقطة نهاية HTTPS عامة لتسليم webhook
- لدى Cloud API من Meta حدود معدل تعتمد على مستوى نشاطك التجاري
- نافذة مراسلة 24 ساعة: يمكنك الرد فقط خلال 24 ساعة من آخر رسالة للمستخدم (إلا عند استخدام قوالب الرسائل)
- يجب أن تكون أرقام الهواتف بصيغة E.164 عند استخدام قائمة السماح

## استكشاف الأخطاء وإصلاحها

### فشل التحقق من Webhook
- تأكد أن `verify_token` في إعداد PRX يطابق تمامًا ما أدخلته في Meta Developer Portal
- يجب أن تستجيب نقطة نهاية webhook لطلبات GET مع معامل `hub.challenge`

### لا يتم استلام الرسائل
- تحقق أن اشتراك webhook يتضمن الحقل `messages`
- تأكد أن رابط webhook متاح للعامة عبر HTTPS
- راجع سجلات تسليم webhook في Meta Developer Portal

### خطأ "Refusing to transmit over non-HTTPS"
- كل اتصالات WhatsApp Cloud API تتطلب HTTPS
- تأكد أن بوابة PRX خلف proxy ينهي TLS (مثل Caddy أو Nginx مع SSL)

::: tip وضع WhatsApp Web
لعميل WhatsApp Web أصلي لا يتطلب إعداد Meta Business API، راجع [WhatsApp Web](./whatsapp-web).
:::

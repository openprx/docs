---
title: البريد الإلكتروني
description: اربط PRX بالبريد الإلكتروني عبر IMAP وSMTP
---

# البريد الإلكتروني

> اربط PRX بأي مزود بريد إلكتروني باستخدام IMAP للاستقبال وSMTP للإرسال، مع دعم IDLE push للتسليم اللحظي.

## المتطلبات المسبقة

- حساب بريد إلكتروني مع تفعيل IMAP وSMTP
- أسماء مضيفي IMAP/SMTP والمنافذ
- بيانات اعتماد البريد الإلكتروني (اسم مستخدم وكلمة مرور أو كلمة مرور خاصة بالتطبيق)

## الإعداد السريع

### 1. تفعيل وصول IMAP

لمعظم مزودي البريد:
- **Gmail**: فعّل IMAP من Gmail Settings > Forwarding and POP/IMAP، ثم أنشئ [App Password](https://myaccount.google.com/apppasswords)
- **Outlook**: IMAP مفعّل افتراضيًا؛ استخدم app password إذا كان 2FA مفعّلًا
- **Self-hosted**: تأكد أن خادم البريد لديك يدعم IMAP

### 2. التهيئة

```toml
[channels_config.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 465
username = "your-bot@gmail.com"
password = "your-app-password"
from_address = "your-bot@gmail.com"
allowed_senders = ["trusted-user@example.com"]
```

### 3. التحقق

```bash
prx channel doctor email
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `imap_host` | `String` | *required* | اسم مضيف خادم IMAP (مثل `"imap.gmail.com"`) |
| `imap_port` | `u16` | `993` | منفذ خادم IMAP (`993` لـ TLS) |
| `imap_folder` | `String` | `"INBOX"` | مجلد IMAP الذي تتم مراقبته للرسائل الجديدة |
| `smtp_host` | `String` | *required* | اسم مضيف خادم SMTP (مثل `"smtp.gmail.com"`) |
| `smtp_port` | `u16` | `465` | منفذ SMTP (`465` لـ implicit TLS، و`587` لـ STARTTLS) |
| `smtp_tls` | `bool` | `true` | استخدام TLS لاتصالات SMTP |
| `username` | `String` | *required* | اسم مستخدم البريد للمصادقة على IMAP/SMTP |
| `password` | `String` | *required* | كلمة مرور البريد أو كلمة مرور خاصة بالتطبيق |
| `from_address` | `String` | *required* | عنوان المرسل للرسائل الصادرة |
| `idle_timeout_secs` | `u64` | `1740` | مهلة IDLE بالثواني قبل إعادة الاتصال (الافتراضي: 29 دقيقة حسب RFC 2177) |
| `allowed_senders` | `[String]` | `[]` | عناوين أو نطاقات المرسلين المسموح بها. فارغة = رفض الجميع. `"*"` = السماح للجميع |
| `default_subject` | `String` | `"PRX Message"` | عنوان الموضوع الافتراضي للرسائل الصادرة |

## الميزات

- **IMAP IDLE** -- إشعارات push فورية للرسائل الجديدة (RFC 2177) بدون تأخير polling
- **تشفير TLS** -- الاتصالات إلى خوادم IMAP وSMTP مشفرة عبر TLS
- **تحليل MIME** -- التعامل مع رسائل multipart واستخراج النص والمرفقات
- **تصفية على مستوى النطاق** -- السماح بنطاقات كاملة (مثل `"@company.com"`) في allowlist للمرسلين
- **إعادة اتصال تلقائية** -- إعادة إنشاء اتصال IDLE بعد انتهاء مهلة 29 دقيقة
- **ترابط الردود** -- الرد في نفس سلسلة البريد الأصلية مع ترويسات `In-Reply-To` الصحيحة

## القيود

- يعالج فقط الرسائل ضمن مجلد IMAP المحدد (الافتراضي: INBOX)
- رسائل HTML تُعالج كنص عادي (تتم إزالة وسوم HTML)
- قد لا تُعالج المرفقات الكبيرة بالكامل بحسب قيود الذاكرة
- بعض مزودي البريد يتطلبون app-specific passwords عند تفعيل 2FA
- دعم IDLE يعتمد على خادم IMAP؛ معظم الخوادم الحديثة تدعمه

## استكشاف الأخطاء وإصلاحها

### تعذر الاتصال بخادم IMAP
- تأكد أن `imap_host` و`imap_port` صحيحان لمزودك
- تأكد من تفعيل IMAP في إعدادات حساب البريد
- عند استخدام Gmail، أنشئ App Password (كلمات المرور العادية تُحجب مع 2FA)
- تحقق أن TLS غير محجوب بجدار ناري

### لا يتم اكتشاف الرسائل
- تأكد من صحة `imap_folder` (الافتراضي: `"INBOX"`)
- تحقق أن عنوان المرسل أو نطاقه موجود في `allowed_senders`
- بعض المزودين قد يظهرون تأخيرًا قبل ظهور الرسائل عبر IMAP

### لا يتم إرسال الردود
- تحقق أن إعدادات `smtp_host` و`smtp_port` و`smtp_tls` تطابق مزودك
- افحص بيانات مصادقة SMTP (نفس `username`/`password` الخاصة بـ IMAP أو بيانات SMTP منفصلة)
- راجع سجلات الخادم لأسباب رفض SMTP (مثل إخفاقات SPF/DKIM)

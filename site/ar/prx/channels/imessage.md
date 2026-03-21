---
title: iMessage (آي مسج)
description: اربط PRX بـ iMessage على macOS
---

# iMessage (آي مسج)

> اربط PRX بـ iMessage باستخدام قاعدة بيانات Messages في macOS وجسر AppleScript لتكامل iMessage أصلي.

## المتطلبات المسبقة

- **macOS فقط** -- تكامل iMessage يتطلب macOS (يُوصى بـ Monterey 12.0 أو أحدث)
- حساب iMessage نشط ومسجل الدخول في تطبيق Messages
- منح Full Disk Access لعملية PRX (لقراءة قاعدة بيانات Messages)

## الإعداد السريع

### 1. منح Full Disk Access

1. افتح **System Settings > Privacy & Security > Full Disk Access**
2. أضف تطبيق الطرفية أو ملف PRX التنفيذي إلى القائمة
3. أعد تشغيل الطرفية أو عملية PRX

### 2. التهيئة

```toml
[channels_config.imessage]
allowed_contacts = ["+1234567890", "user@icloud.com"]
```

### 3. التحقق

```bash
prx channel doctor imessage
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `allowed_contacts` | `[String]` | *required* | جهات iMessage المسموح بها: أرقام هواتف (E.164) أو عناوين بريد إلكتروني. القائمة الفارغة = رفض الجميع |

## الميزات

- **تكامل macOS أصلي** -- قراءة مباشرة من قاعدة بيانات Messages SQLite
- **جسر AppleScript** -- إرسال الردود عبر `osascript` لتسليم موثوق
- **جهات هاتف وبريد إلكتروني** -- التصفية حسب أرقام الهواتف أو بريد Apple ID
- **دعم macOS الحديث** -- التعامل مع صيغة `attributedBody` typedstream في macOS Ventura وما بعده
- **يعتمد على polling** -- فحص دوري لقاعدة بيانات Messages لاكتشاف الرسائل الجديدة

## القيود

- **macOS فقط** -- غير متاح على Linux أو Windows
- يتطلب Full Disk Access لقراءة `~/Library/Messages/chat.db`
- يجب أن يكون تطبيق Messages قيد التشغيل (أو على الأقل مسجل الدخول)
- لا يمكن بدء محادثات مع جهات جديدة؛ يجب وجود محادثة سابقة مع الجهة
- لا يوجد دعم حالي لمحادثات iMessage الجماعية
- فاصل polling يضيف تأخيرًا بسيطًا مقارنة بالقنوات المبنية على push
- قد لا يعمل الإرسال عبر AppleScript في بيئات macOS بدون واجهة رسومية (SSH فقط)

## استكشاف الأخطاء وإصلاحها

### "Permission denied" عند قراءة قاعدة بيانات Messages
- تأكد من منح Full Disk Access لعملية PRX أو الطرفية الأب
- على macOS Ventura+ تحقق من **System Settings > Privacy & Security > Full Disk Access**
- أعد تشغيل الطرفية بعد منح الصلاحيات

### لا يتم اكتشاف الرسائل
- تحقق أن تطبيق Messages مسجل الدخول باستخدام Apple ID
- تأكد أن جهة الاتصال موجودة في `allowed_contacts` (رقم E.164 أو بريد إلكتروني)
- قد تتطلب الرسائل الجديدة دورة polling واحدة لاكتشافها

### لا يتم إرسال الردود
- تأكد أن تطبيق Messages قيد التشغيل (وليس تسجيل دخول فقط)
- إرسال AppleScript يتطلب وصول GUI؛ جلسات SSH فقط قد تفشل
- راجع macOS Console.app لأخطاء AppleScript

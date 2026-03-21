---
title: واتساب Web
description: اربط PRX بـ WhatsApp عبر عميل Web أصلي (wa-rs)
---

# واتساب Web

> اربط PRX بـ WhatsApp باستخدام عميل Web أصلي مكتوب بـ Rust (wa-rs) مع تشفير طرفي، وربط عبر QR code أو pair code، ودعم كامل للوسائط.

## المتطلبات المسبقة

- حساب WhatsApp برقم هاتف نشط
- بناء PRX مع علم الميزة `whatsapp-web`
- لا حاجة إلى حساب Meta Business API

## الإعداد السريع

### 1. تفعيل علم الميزة

ابنِ PRX مع دعم WhatsApp Web:

```bash
cargo build --release --features whatsapp-web
```

### 2. التهيئة

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
allowed_numbers = ["+1234567890", "*"]
```

لربط pair code (بدل QR code):

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
pair_phone = "15551234567"
allowed_numbers = ["*"]
```

### 3. ربط الحساب

شغّل PRX. في أول تشغيل سيعرض أحد الخيارين:
- **QR code** في الطرفية لمسحه بتطبيق WhatsApp على الهاتف، أو
- **pair code** إذا تم ضبط `pair_phone` (أدخل الرمز في WhatsApp > Linked Devices)

### 4. التحقق

```bash
prx channel doctor whatsapp
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `session_path` | `String` | *required* | مسار قاعدة بيانات جلسة SQLite. وجود هذا الحقل يحدد وضع Web |
| `pair_phone` | `String` | `null` | رقم الهاتف لربط pair code (الصيغة: رمز الدولة + الرقم، مثل `"15551234567"`). إذا لم يُضبط، يتم استخدام QR code |
| `pair_code` | `String` | `null` | Pair code مخصص للربط. اتركه فارغًا ليُنشئه WhatsApp تلقائيًا |
| `allowed_numbers` | `[String]` | `[]` | أرقام الهواتف المسموح بها بصيغة E.164 (مثل `"+1234567890"`). القيمة `"*"` = السماح للجميع |

## الميزات

- **لا حاجة إلى Meta Business API** -- اتصال مباشر كجهاز مرتبط عبر بروتوكول WhatsApp Web
- **تشفير طرفي (End-to-end)** -- الرسائل مشفرة عبر Signal Protocol مثل عملاء WhatsApp الرسميين
- **ربط عبر QR code وpair code** -- طريقتان لربط حساب WhatsApp
- **جلسات مستمرة** -- حالة الجلسة محفوظة في SQLite محلي وتستمر بعد إعادة التشغيل
- **مجموعات ورسائل مباشرة** -- يدعم المحادثات الخاصة ومحادثات المجموعات
- **رسائل الوسائط** -- يتعامل مع الصور والمستندات وأنواع الوسائط الأخرى
- **دعم الرسائل الصوتية** -- يفرّغ الرسائل الصوتية الواردة (عند تهيئة STT) ويمكنه الرد بصوت (عند تهيئة TTS)
- **الحضور والتفاعلات** -- يدعم مؤشرات الكتابة وتفاعلات الرسائل

## القيود

- يتطلب علم الميزة `whatsapp-web` وقت البناء
- يدعم جلسة جهاز مرتبط واحدة فقط لكل رقم هاتف (قيد من WhatsApp)
- قد تنتهي الجلسة عند عدم الاستخدام لفترة طويلة؛ يتطلب إعادة ربط
- يعمل على macOS وLinux وWindows WSL2 فقط (مثل PRX)
- قد يطلب WhatsApp إعادة المصادقة أحيانًا

## استكشاف الأخطاء وإصلاحها

### لا يظهر QR code
- تأكد من ضبط `session_path` وأن المجلد قابل للكتابة
- تحقق أن PRX بُني باستخدام `--features whatsapp-web`
- احذف قاعدة بيانات الجلسة وأعد التشغيل لفرض عملية ربط جديدة

### انتهت الجلسة أو انقطع الاتصال
- احذف قاعدة بيانات الجلسة في `session_path` المهيأ
- أعد تشغيل PRX لبدء تدفق QR code أو pair code جديد

### لا يتم تفريغ الرسائل الصوتية
- هيّئ قسم `[transcription]` في إعداد PRX لتفعيل STT
- مزودات STT المدعومة: OpenAI Whisper وDeepgram وAssemblyAI وGoogle STT

::: tip وضع Cloud API
إذا كان لديك حساب Meta Business وتفضّل المراسلة المعتمدة على webhook، راجع [WhatsApp (Cloud API)](./whatsapp).
:::

---
title: مرجع الإعداد
description: "مرجع كامل لإعداد PRX-Email بما فيه إعدادات النقل وخيارات التخزين وسياسات المرفقات ومتغيرات البيئة وضبط وقت التشغيل."
---

# مرجع الإعداد

هذه الصفحة هي المرجع الكامل لجميع خيارات إعداد PRX-Email ومتغيرات البيئة وإعدادات وقت التشغيل.

## إعداد النقل

هيكل `EmailTransportConfig` يُعيّن كلاً من اتصالات IMAP وSMTP:

```rust
use prx_email::plugin::{
    EmailTransportConfig, ImapConfig, SmtpConfig, AuthConfig,
    AttachmentPolicy, AttachmentStoreConfig,
};

let config = EmailTransportConfig {
    imap: ImapConfig { /* ... */ },
    smtp: SmtpConfig { /* ... */ },
    attachment_store: Some(AttachmentStoreConfig { /* ... */ }),
    attachment_policy: AttachmentPolicy::default(),
};
```

### إعدادات IMAP

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|----------|-------|
| `imap.host` | `String` | (مطلوب) | اسم مضيف خادم IMAP |
| `imap.port` | `u16` | (مطلوب) | منفذ خادم IMAP (عادةً 993) |
| `imap.user` | `String` | (مطلوب) | اسم مستخدم IMAP |
| `imap.auth.password` | `Option<String>` | `None` | كلمة المرور للمصادقة LOGIN |
| `imap.auth.oauth_token` | `Option<String>` | `None` | رمز OAuth لـ XOAUTH2 |

### إعدادات SMTP

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|----------|-------|
| `smtp.host` | `String` | (مطلوب) | اسم مضيف خادم SMTP |
| `smtp.port` | `u16` | (مطلوب) | منفذ خادم SMTP (465 أو 587) |
| `smtp.user` | `String` | (مطلوب) | اسم مستخدم SMTP |
| `smtp.auth.password` | `Option<String>` | `None` | كلمة المرور لـ PLAIN/LOGIN |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | رمز OAuth لـ XOAUTH2 |

### قواعد التحقق

- `imap.host` و`smtp.host` يجب ألا يكونا فارغَين
- `imap.user` و`smtp.user` يجب ألا يكونا فارغَين
- يجب ضبط واحد بالضبط من `password` أو `oauth_token` لكل بروتوكول
- `attachment_policy.max_size_bytes` يجب أن يكون أكبر من 0
- `attachment_policy.allowed_content_types` يجب ألا يكون فارغاً

## إعداد التخزين

### StoreConfig

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|----------|-------|
| `enable_wal` | `bool` | `true` | تفعيل وضع WAL لسجل الدفتر |
| `busy_timeout_ms` | `u64` | `5000` | مهلة انشغال SQLite بالمللي ثانية |
| `wal_autocheckpoint_pages` | `i64` | `1000` | الصفحات بين نقاط التحقق التلقائية |
| `synchronous` | `SynchronousMode` | `Normal` | وضع المزامنة: `Full` أو `Normal` أو `Off` |

### SQLite Pragmas المطبقة

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- when enable_wal = true
PRAGMA synchronous = NORMAL;      -- matches synchronous setting
PRAGMA wal_autocheckpoint = 1000; -- matches wal_autocheckpoint_pages
```

## سياسة المرفقات

### AttachmentPolicy

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|----------|-------|
| `max_size_bytes` | `usize` | `26,214,400` (25 ميغابايت) | الحجم الأقصى للمرفق |
| `allowed_content_types` | `HashSet<String>` | انظر أدناه | أنواع MIME المسموح بها |

### أنواع MIME المسموح بها افتراضياً

| نوع MIME | الوصف |
|---------|-------|
| `application/pdf` | مستندات PDF |
| `image/jpeg` | صور JPEG |
| `image/png` | صور PNG |
| `text/plain` | ملفات نصية عادية |
| `application/zip` | أرشيفات ZIP |

### AttachmentStoreConfig

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|----------|-------|
| `enabled` | `bool` | (مطلوب) | تفعيل استمرارية المرفقات |
| `dir` | `String` | (مطلوب) | الدليل الجذر للمرفقات المخزّنة |

::: warning أمان المسار
يُتحقق من مسارات المرفقات ضد هجمات اجتياز الدليل. أي مسار يُحلّ خارج جذر `dir` المُعيَّن مرفوض، بما فيها الهروب القائم على الروابط الرمزية.
:::

## إعداد منشئ المزامنة

### SyncRunnerConfig

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|----------|-------|
| `max_concurrency` | `usize` | `4` | الحد الأقصى للمهام لكل دورة تشغيل |
| `base_backoff_seconds` | `i64` | `10` | التراجع الأولي عند الفشل |
| `max_backoff_seconds` | `i64` | `300` | التراجع الأقصى (5 دقائق) |

## متغيرات البيئة

### إدارة رمز OAuth

| المتغير | الوصف |
|---------|-------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | رمز وصول IMAP OAuth |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | رمز وصول SMTP OAuth |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | انتهاء صلاحية رمز IMAP (بالثواني Unix) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | انتهاء صلاحية رمز SMTP (بالثواني Unix) |

البادئة الافتراضية هي `PRX_EMAIL`. استخدم `reload_auth_from_env("PRX_EMAIL")` لتحميلها في وقت التشغيل.

### مكوّن WASM

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | غير مضبوط (معطّل) | اضبطه على `1` لتفعيل IMAP/SMTP الحقيقي من سياق WASM |

## حدود API

| الحد | القيمة | الوصف |
|-----|-------|-------|
| الحد الأدنى للقائمة/البحث | 1 | الحد الأدنى لمعامل `limit` |
| الحد الأقصى للقائمة/البحث | 500 | الحد الأقصى لمعامل `limit` |
| تقطيع رسائل التصحيح | 160 حرفاً | رسائل تصحيح المزوّد تُقطَّع |
| طول مقتطف الرسالة | 120 حرفاً | مقتطفات الرسائل المولَّدة تلقائياً |

## رموز الأخطاء

| الرمز | الوصف |
|-------|-------|
| `Validation` | فشل تحقق المدخلات (حقول فارغة، حدود خارج النطاق، ميزات غير معروفة) |
| `FeatureDisabled` | عملية محظورة بعلامة ميزة |
| `Network` | خطأ اتصال أو بروتوكول IMAP/SMTP |
| `Provider` | مزوّد البريد الإلكتروني رفض العملية |
| `Storage` | خطأ قاعدة بيانات SQLite |

## ثوابت صندوق الصادر

| الثابت | القيمة | الوصف |
|--------|-------|-------|
| أساس التراجع | 5 ثوانٍ | التراجع الأولي لإعادة المحاولة |
| صيغة التراجع | `5 * 2^retries` | نمو أسي |
| الحد الأقصى لإعادة المحاولة | غير محدود | محدود بنمو التراجع |
| مفتاح الأدوات | `outbox-{id}-{retries}` | Message-ID حتمي |

## علامات الميزات

| العلامة | الوصف | مستوى المخاطرة |
|--------|-------|--------------|
| `inbox_read` | قائمة الرسائل وقراءتها | منخفض |
| `inbox_search` | البحث في الرسائل بالاستعلام | منخفض |
| `email_send` | إرسال رسائل بريد إلكتروني جديدة | متوسط |
| `email_reply` | الرد على رسائل بريد إلكتروني موجودة | متوسط |
| `outbox_retry` | إعادة محاولة رسائل صندوق الصادر الفاشلة | منخفض |

## التسجيل

يُخرج PRX-Email سجلات منظمة إلى stderr بالتنسيق:

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### الأمان

- رموز OAuth وكلمات المرور ومفاتيح API **لا تُسجَّل أبداً**
- عناوين البريد الإلكتروني تُخفى في سجلات التصحيح (مثلاً `a***@example.com`)
- رسائل تصحيح المزوّد تُعقَّم: رؤوس التفويض تُخفى والمخرجات تُقطَّع إلى 160 حرفاً

## الخطوات التالية

- [التثبيت](../getting-started/installation) -- إعداد PRX-Email
- [إدارة الحسابات](../accounts/) -- إعداد الحسابات والميزات
- [استكشاف الأخطاء](../troubleshooting/) -- حل مشكلات الإعداد

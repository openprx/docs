---
title: استكشاف الأخطاء وإصلاحها
description: "حلول للمشكلات الشائعة في PRX-Email بما فيها أخطاء OAuth وفشل مزامنة IMAP ومشكلات إرسال SMTP وأخطاء SQLite ومشكلات مكوّن WASM."
---

# استكشاف الأخطاء وإصلاحها

تغطي هذه الصفحة المشكلات الأكثر شيوعاً التي تواجهها عند تشغيل PRX-Email، مع أسبابها وحلولها.

## انتهاء صلاحية رمز OAuth

**الأعراض:** تفشل العمليات برمز خطأ `Provider` ورسالة عن الرموز المنتهية الصلاحية.

**الأسباب المحتملة:**
- انتهت صلاحية رمز وصول OAuth ولا يوجد مزوّد تحديث مُعيَّن
- يحتوي متغير البيئة `*_OAUTH_EXPIRES_AT` على طابع زمني قديم
- مزوّد التحديث يعيد أخطاء

**الحلول:**

1. **التحقق من طوابع انتهاء صلاحية الرمز:**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# These should be Unix timestamps in the future
```

2. **إعادة تحميل الرموز يدوياً من البيئة:**

```rust
// Set fresh tokens
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// Reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **تنفيذ مزوّد تحديث** لتجديد الرمز التلقائي:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **إعادة تشغيل سكريبت بدء Outlook** للحصول على رموز جديدة:

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
يحاول PRX-Email تحديث الرموز قبل 60 ثانية من انتهاء صلاحيتها. إذا انتهت صلاحية رموزك أسرع من فترة المزامنة، تأكد من اتصال مزوّد التحديث.
:::

## فشل مزامنة IMAP

**الأعراض:** تعيد `sync()` خطأ `Network`، أو يُبلَّغ عن فشل في منشئ المزامنة.

**الأسباب المحتملة:**
- اسم مضيف أو منفذ خادم IMAP غير صحيح
- مشكلات في اتصال الشبكة
- فشل المصادقة (كلمة مرور خاطئة أو رمز OAuth منتهي الصلاحية)
- تحديد معدل خادم IMAP

**الحلول:**

1. **التحقق من الاتصال بخادم IMAP:**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **فحص إعداد النقل:**

```rust
// Ensure host and port are correct
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **التحقق من وضع المصادقة:**

```rust
// Must have exactly one set
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **فحص حالة تراجع منشئ المزامنة.** بعد فشل متكرر، يطبق الجدول الزمني تراجعاً أسياً. إعادة الضبط مؤقتاً باستخدام `now_ts` في المستقبل البعيد:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **فحص السجلات المنظمة** للحصول على معلومات تفصيلية عن الخطأ:

```bash
# Look for sync-related structured logs
grep "prx_email.*sync" /path/to/logs
```

## فشل إرسال SMTP

**الأعراض:** تعيد `send()` `ApiResponse` مع `ok: false` وخطأ `Network` أو `Provider`.

**الأسباب المحتملة:**
- اسم مضيف أو منفذ خادم SMTP غير صحيح
- فشل المصادقة
- رفض المزوّد لعنوان المستلم
- تجاوز حصة الإرسال أو تحديد المعدل

**الحلول:**

1. **فحص حالة صندوق الصادر:**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **التحقق من إعداد SMTP:**

```rust
// Check auth mode
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **التحقق من أخطاء التحقق.** ترفض واجهة الإرسال:
   - `to` أو `subject` أو `body_text` فارغة
   - علامة ميزة `email_send` معطّلة
   - عناوين بريد إلكتروني غير صالحة

4. **الاختبار مع فشل محاكي** للتحقق من معالجة أخطائك:

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... fields ...
    failure_mode: Some(SendFailureMode::Network), // Simulate failure
});
```

## صندوق الصادر عالق في حالة "sending"

**الأعراض:** سجلات صندوق الصادر لها `status = 'sending'` لكن العملية تعطلت قبل الإنهاء.

**السبب:** تعطلت العملية بعد المطالبة بسجل صندوق الصادر لكن قبل إنهائه كـ `sent` أو `failed`.

**الحل:** استرداد السجلات العالقة يدوياً عبر SQL:

```sql
-- Identify stuck rows (threshold: 15 minutes)
SELECT id, account_id, updated_at
FROM outbox
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;

-- Recover to failed and schedule retry
UPDATE outbox
SET status = 'failed',
    last_error = 'recovered_from_stuck_sending',
    next_attempt_at = strftime('%s','now') + 30,
    updated_at = strftime('%s','now')
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;
```

## مرفق مرفوض

**الأعراض:** يفشل الإرسال بـ "attachment exceeds size limit" أو "attachment content type is not allowed".

**الحلول:**

1. **فحص سياسة المرفق:**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **التحقق من حجم الملف** ضمن الحد (الافتراضي: 25 ميغابايت).

3. **إضافة نوع MIME** إلى القائمة المسموح بها إذا كان آمناً:

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **للمرفقات القائمة على المسار**، تأكد من أن مسار الملف تحت جذر تخزين المرفقات المُعيَّن. المسارات التي تحتوي على `../` أو الروابط الرمزية التي تُحلّ خارج الجذر مرفوضة.

## خطأ ميزة معطّلة

**الأعراض:** تعيد العمليات رمز خطأ `FeatureDisabled`.

**السبب:** علامة الميزة للعملية المطلوبة غير مفعّلة للحساب.

**الحل:**

```rust
// Check current state
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// Enable the feature
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Or set the global default
plugin.set_feature_default("email_send", true, now)?;
```

## أخطاء قاعدة بيانات SQLite

**الأعراض:** تفشل العمليات برمز خطأ `Storage`.

**الأسباب المحتملة:**
- ملف قاعدة البيانات مقفل بعملية أخرى
- القرص ممتلئ
- ملف قاعدة البيانات تالف
- لم تُشغَّل الترحيلات

**الحلول:**

1. **تشغيل الترحيلات:**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **التحقق من قاعدة البيانات المقفلة.** يمكن أن يكون اتصال كتابة واحد فقط نشطاً في كل مرة. زد مهلة الانشغال:

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 seconds
    ..StoreConfig::default()
};
```

3. **التحقق من مساحة القرص:**

```bash
df -h .
```

4. **الإصلاح أو إعادة الإنشاء** إذا كانت قاعدة البيانات تالفة:

```bash
# Back up the existing database
cp email.db email.db.bak

# Check integrity
sqlite3 email.db "PRAGMA integrity_check;"

# If corrupt, export and reimport
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## مشكلات مكوّن WASM

### خطأ حارس الشبكة

**الأعراض:** تعيد عمليات البريد الإلكتروني المستضافة بـ WASM خطأ `EMAIL_NETWORK_GUARD`.

**السبب:** مفتاح أمان الشبكة غير مفعّل.

**الحل:**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### قدرة المضيف غير متاحة

**الأعراض:** تعيد العمليات `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

**السبب:** وقت التشغيل المضيف لا يوفر قدرة البريد الإلكتروني. يحدث هذا عند التشغيل خارج سياق WASM.

**الحل:** تأكد من إعداد وقت تشغيل PRX لتوفير استدعاءات مضيف البريد الإلكتروني للمكوّن.

## منشئ المزامنة يتخطى المهام باستمرار

**الأعراض:** يُبلَّغ عن `attempted: 0` من منشئ المزامنة رغم إعداد المهام.

**السبب:** جميع المهام في حالة تراجع بسبب فشل سابق.

**الحلول:**

1. **فحص حالة تراجع الفشل** بفحص السجلات المنظمة.

2. **التحقق من إمكانية الوصول إلى الشبكة** ومصادقة IMAP قبل إعادة التشغيل.

3. **إعادة ضبط التراجع** باستخدام طابع زمني في المستقبل البعيد:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## معدل فشل إرسال مرتفع

**الأعراض:** تُظهر المقاييس عدداً مرتفعاً من `send_failures`.

**الحلول:**

1. **فحص السجلات المنظمة** مرشحة بـ `run_id` و`error_code`:

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **التحقق من وضع مصادقة SMTP.** تأكد من ضبط واحد بالضبط من كلمة المرور أو oauth_token.

3. **التحقق من توفر المزوّد** قبل تفعيل النشر الواسع.

4. **فحص المقاييس:**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## الحصول على المساعدة

إذا لم يحل أي من الحلول أعلاه مشكلتك:

1. **تحقق من المشكلات الموجودة:** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **قدّم مشكلة جديدة** مع:
   - إصدار PRX-Email (تحقق من `Cargo.toml`)
   - إصدار سلسلة أدوات Rust (`rustc --version`)
   - مخرجات السجل المنظم ذات الصلة
   - خطوات إعادة الإنتاج

## الخطوات التالية

- [مرجع الإعداد](../configuration/) -- مراجعة جميع الإعدادات
- [مصادقة OAuth](../accounts/oauth) -- حل المشكلات الخاصة بـ OAuth
- [تخزين SQLite](../storage/) -- صيانة قاعدة البيانات والاسترداد

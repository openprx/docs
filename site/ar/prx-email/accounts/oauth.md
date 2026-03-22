---
title: مصادقة OAuth
description: "إعداد مصادقة OAuth 2.0 XOAUTH2 لـ PRX-Email مع Gmail وOutlook. إدارة دورة حياة الرمز ومزودو التحديث وإعادة التحميل الساخن."
---

# مصادقة OAuth

يدعم PRX-Email مصادقة OAuth 2.0 عبر آلية XOAUTH2 لكل من IMAP وSMTP. هذا مطلوب لـ Outlook/Office 365 وموصى به لـ Gmail. يوفر المكوّن تتبع انتهاء صلاحية الرمز ومزودو التحديث القابلون للتوصيل وإعادة التحميل القائم على البيئة.

## كيف يعمل XOAUTH2

يستبدل XOAUTH2 مصادقة كلمة المرور التقليدية برمز وصول OAuth. يرسل العميل سلسلة منسقة خصيصاً أثناء IMAP AUTHENTICATE أو SMTP AUTH:

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

يتعامل PRX-Email مع هذا تلقائياً عند ضبط `auth.oauth_token`.

## إعداد OAuth لـ Gmail

### 1. إنشاء بيانات اعتماد Google Cloud

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروعاً أو اختر مشروعاً موجوداً
3. فعّل Gmail API
4. أنشئ بيانات اعتماد OAuth 2.0 (نوع تطبيق سطح المكتب)
5. دوّن **Client ID** و**Client Secret**

### 2. الحصول على رمز وصول

استخدم ملعب OAuth الخاص بـ Google أو سير OAuth الخاص بك للحصول على رمز وصول مع النطاقات التالية:

- `https://mail.google.com/` (وصول كامل لـ IMAP/SMTP)

### 3. إعداد PRX-Email

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## إعداد OAuth لـ Outlook

يتضمن PRX-Email سكريبت بدء لـ OAuth الخاص بـ Outlook/Office 365 يتعامل مع سير رمز التفويض بالكامل.

### 1. تسجيل تطبيق Azure

1. اذهب إلى [تسجيلات تطبيقات Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. سجّل تطبيقاً جديداً
3. اضبط URI إعادة التوجيه (مثلاً `http://localhost:53682/callback`)
4. دوّن **Application (client) ID** و**Directory (tenant) ID**
5. تحت أذونات API، أضف:
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. تشغيل سكريبت البدء

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

سيقوم السكريبت بـ:
1. طباعة URL التفويض -- افتحه في متصفحك
2. انتظار لصق URL الرد أو رمز التفويض
3. تبادل الرمز برموز الوصول والتحديث
4. حفظ الرموز في `./outlook_oauth.local.env` مع `chmod 600`

### خيارات السكريبت

| العلامة | الوصف |
|--------|-------|
| `--output <file>` | مسار إخراج مخصص (الافتراضي: `./outlook_oauth.local.env`) |
| `--dry-run` | طباعة URL التفويض والخروج |
| `-h`، `--help` | عرض معلومات الاستخدام |

### متغيرات البيئة

| المتغير | مطلوب | الوصف |
|---------|-------|-------|
| `CLIENT_ID` | نعم | معرف عميل تطبيق Azure |
| `TENANT` | نعم | معرف المستأجر، أو `common`/`organizations`/`consumers` |
| `REDIRECT_URI` | نعم | URI إعادة التوجيه المسجل في تطبيق Azure |
| `SCOPE` | لا | نطاقات مخصصة (الافتراضي: IMAP + SMTP + offline_access) |

::: warning الأمان
لا تودع ملف الرمز المولَّد أبداً. أضف `*.local.env` إلى `.gitignore`.
:::

### 3. تحميل الرموز

بعد أن يولّد سكريبت البدء الرموز، اقرأ ملف env وأعد إعداد PRX-Email:

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## إدارة دورة حياة الرمز

### تتبع انتهاء الصلاحية

يتبع PRX-Email طوابع انتهاء صلاحية رمز OAuth لكل بروتوكول (IMAP/SMTP):

```rust
// Set expiry via environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

قبل كل عملية، يتحقق المكوّن مما إذا كان الرمز سينتهي خلال 60 ثانية. إذا كان كذلك، تُحاول إعادة التحديث.

### مزوّد التحديث القابل للتوصيل

نفّذ سمة `OAuthRefreshProvider` للتعامل مع تحديث الرمز التلقائي:

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // Call your OAuth provider's token endpoint
        // Return the new access token and optional expiry
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

أرفق المزوّد عند إنشاء المكوّن:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### إعادة التحميل الساخن من البيئة

إعادة تحميل رموز OAuth في وقت التشغيل دون إعادة تشغيل:

```rust
// Set new tokens in environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// Trigger reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

تقرأ طريقة `reload_auth_from_env` متغيرات البيئة بالبادئة المعطاة وتحدّث رموز OAuth وطوابع انتهاء الصلاحية لـ IMAP/SMTP. عند تحميل رمز OAuth، تُمسح كلمة المرور المقابلة للحفاظ على متغير مصادقة-واحد-من-اثنين.

### إعادة تحميل الإعداد الكامل

لإعادة تكوين النقل بالكامل:

```rust
plugin.reload_config(new_transport_config)?;
```

يتحقق هذا من الإعداد الجديد ويستبدل تكوين النقل بأكمله بشكل ذري.

## متغيرات البيئة لـ OAuth

| المتغير | الوصف |
|---------|-------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | رمز وصول IMAP OAuth |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | رمز وصول SMTP OAuth |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | انتهاء صلاحية رمز IMAP (بالثواني Unix) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | انتهاء صلاحية رمز SMTP (بالثواني Unix) |

البادئة تُمرَّر إلى `reload_auth_from_env()`. لإعداد PRX-Email الافتراضي، استخدم `PRX_EMAIL` كبادئة.

## أفضل ممارسات الأمان

1. **لا تسجّل الرموز أبداً.** يُعقّم PRX-Email رسائل التصحيح ويُخفي محتوى متعلق بالتفويض.
2. **استخدم رموز التحديث.** تنتهي صلاحية رموز الوصول؛ نفّذ دائماً مزوّد تحديث للاستخدام الإنتاجي.
3. **خزّن الرموز بأمان.** استخدم أذونات الملفات (`chmod 600`) ولا تودع ملفات الرموز في إدارة الإصدار.
4. **دوّر الرموز بانتظام.** حتى مع التحديث التلقائي، تحقق بشكل دوري من أن الرموز يتم تدويرها.

## الخطوات التالية

- [إدارة الحسابات](./index) -- إدارة الحسابات وعلامات الميزات
- [مرجع الإعداد](../configuration/) -- جميع متغيرات البيئة والإعدادات
- [استكشاف الأخطاء](../troubleshooting/) -- حل الأخطاء المتعلقة بـ OAuth

---
title: مرجع الإعداد
description: "مرجع إعداد كامل لـ Fenfa. خيارات ملف الإعداد ومتغيرات البيئة وإعدادات التخزين وبيانات اعتماد Apple Developer API."
---

# مرجع الإعداد

يمكن إعداد Fenfa من خلال ملف `config.json` أو متغيرات البيئة أو لوحة الإدارة (للإعدادات في وقت التشغيل مثل التخزين و Apple API).

## أولوية الإعداد

1. **متغيرات البيئة** -- الأولوية القصوى، تتجاوز كل شيء
2. **ملف config.json** -- يُحمَّل عند بدء التشغيل
3. **القيم الافتراضية** -- تُستخدم عند عدم تحديد أي شيء

## ملف الإعداد

أنشئ `config.json` في دليل العمل (أو ارفعه في Docker):

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "Your Company Name",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## إعدادات الخادم

| المفتاح | النوع | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `server.port` | string | `"8000"` | منفذ استماع HTTP |
| `server.primary_domain` | string | `"http://localhost:8000"` | URL العام المستخدم في المنشورات والردود وروابط التنزيل |
| `server.secondary_domains` | string[] | `[]` | نطاقات إضافية (CDN أو وصول بديل) |
| `server.organization` | string | `"Fenfa Distribution"` | اسم المؤسسة في ملفات تعريف iOS |
| `server.bundle_id_prefix` | string | `""` | بادئة معرف الحزمة للملفات الشخصية المولَّدة |
| `server.data_dir` | string | `"data"` | دليل قاعدة بيانات SQLite |
| `server.db_path` | string | `"data/fenfa.db"` | مسار ملف قاعدة البيانات الصريح |
| `server.dev_proxy_front` | string | `""` | URL خادم Vite dev للصفحة العامة (للتطوير فقط) |
| `server.dev_proxy_admin` | string | `""` | URL خادم Vite dev للوحة الإدارة (للتطوير فقط) |

::: warning النطاق الأساسي
إعداد `primary_domain` ضروري لتوزيع iOS OTA. يجب أن يكون URL الـ HTTPS الذي يصل إليه المستخدمون النهائيون. تستخدم ملفات manifest لـ iOS هذا الـ URL لروابط التنزيل، وردود UDID تُعاد توجيهها إلى هذا النطاق.
:::

## المصادقة

| المفتاح | النوع | الافتراضي | الوصف |
|---------|-------|----------|-------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | رموز لـ API الرفع |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | رموز لـ admin API (تشمل إذن الرفع) |

::: danger تغيير الرموز الافتراضية
الرموز الافتراضية (`dev-upload-token` و`dev-admin-token`) للتطوير فقط. غيّرها دائماً قبل النشر الإنتاجي.
:::

رموز متعددة مدعومة لكل نطاق، مما يتيح إصدار رموز مختلفة لخطوط CI/CD أو أعضاء الفريق المختلفين وإلغاؤها بشكل فردي.

## متغيرات البيئة

تجاوز أي قيمة إعداد بمتغيرات البيئة:

| المتغير | مكافئ الإعداد | الوصف |
|---------|--------------|-------|
| `FENFA_PORT` | `server.port` | منفذ استماع HTTP |
| `FENFA_DATA_DIR` | `server.data_dir` | دليل قاعدة البيانات |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | URL النطاق العام |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | رمز الإدارة (يستبدل الرمز الأول) |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | رمز الرفع (يستبدل الرمز الأول) |

مثال:

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## إعداد التخزين

### التخزين المحلي (الافتراضي)

تُخزَّن الملفات على `uploads/{product_id}/{variant_id}/{release_id}/filename.ext` بالنسبة لدليل العمل. لا يلزم إعداد إضافي.

### التخزين المتوافق مع S3

أعدّ تخزين S3 في لوحة الإدارة تحت **الإعدادات > التخزين**، أو عبر API:

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

المزوّدون المدعومون:
- **Cloudflare R2** -- لا رسوم تدفق للخارج، متوافق مع S3
- **AWS S3** -- S3 القياسي
- **MinIO** -- تخزين متوافق مع S3 ذاتي الاستضافة
- أي مزوّد متوافق مع S3

::: tip نطاق الرفع
إذا كان نطاقك الأساسي له قيود على CDN لحجم الملف، أعدّ `upload_domain` كنطاق منفصل يتجاوز قيود CDN لرفع الملفات الكبيرة.
:::

## Apple Developer API

أعدّ بيانات اعتماد Apple Developer API للتسجيل التلقائي للأجهزة. اضبطها في لوحة الإدارة تحت **الإعدادات > Apple Developer API**، أو عبر API:

| الحقل | الوصف |
|-------|-------|
| `apple_key_id` | معرف مفتاح API من App Store Connect |
| `apple_issuer_id` | معرف المُصدِر (بتنسيق UUID) |
| `apple_private_key` | محتوى المفتاح الخاص بتنسيق PEM |
| `apple_team_id` | معرف فريق Apple Developer |

راجع [توزيع iOS](../distribution/ios) لتعليمات الإعداد.

## قاعدة البيانات

يستخدم Fenfa SQLite عبر GORM. يُنشأ ملف قاعدة البيانات تلقائياً في المسار المُعيَّن `db_path`. تعمل عمليات الترحيل تلقائياً عند بدء التشغيل.

::: info النسخ الاحتياطي
لنسخ Fenfa احتياطياً، انسخ ملف قاعدة بيانات SQLite ودليل `uploads/`. للتخزين S3، يلزم النسخ الاحتياطي المحلي لملف قاعدة البيانات فقط.
:::

## إعدادات التطوير

للتطوير المحلي مع إعادة التحميل الساخن:

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

عند ضبط `dev_proxy_front` أو `dev_proxy_admin`، يُوكّل Fenfa الطلبات إلى خادم Vite للتطوير بدلاً من تقديم الواجهة الأمامية المدمجة. يتيح هذا استبدال الوحدات الساخن أثناء التطوير.

## الخطوات التالية

- [نشر Docker](../deployment/docker) -- إعداد Docker والأجزاء
- [النشر الإنتاجي](../deployment/production) -- الوكيل العكسي وتقوية الأمان
- [نظرة عامة على API](../api/) -- تفاصيل مصادقة API

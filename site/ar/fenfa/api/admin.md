---
title: واجهة برمجة تطبيقات الإدارة
description: "مرجع كامل لـ Fenfa admin API لإدارة المنتجات والمتغيرات والإصدارات والأجهزة والإعدادات والتصديرات."
---

# واجهة برمجة تطبيقات الإدارة

جميع نقاط نهاية الإدارة تتطلب رأس `X-Auth-Token` مع رمز ذي نطاق admin. رموز الإدارة لها وصول كامل إلى جميع عمليات API بما فيها الرفع.

## المنتجات

### قائمة المنتجات

```
GET /admin/api/products
```

يُعيد جميع المنتجات مع معلوماتها الأساسية.

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### إنشاء منتج

```
POST /admin/api/products
Content-Type: application/json
```

| الحقل | مطلوب | الوصف |
|-------|-------|-------|
| `name` | نعم | اسم عرض المنتج |
| `slug` | نعم | معرف URL (فريد) |
| `description` | لا | وصف المنتج |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "Cross-platform app"}'
```

### الحصول على منتج

```
GET /admin/api/products/:productID
```

يُعيد المنتج مع جميع متغيراته.

### تحديث منتج

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### حذف منتج

```
DELETE /admin/api/products/:productID
```

::: danger حذف متتالٍ
يؤدي حذف منتج إلى حذف نهائي لجميع متغيراته وإصداراته والملفات المرفوعة.
:::

## المتغيرات

### إنشاء متغير

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| الحقل | مطلوب | الوصف |
|-------|-------|-------|
| `platform` | نعم | `ios`، `android`، `macos`، `windows`، `linux` |
| `display_name` | نعم | الاسم القابل للقراءة |
| `identifier` | نعم | معرف الحزمة أو اسم الحزمة |
| `arch` | لا | معمارية CPU |
| `installer_type` | لا | نوع الملف (`ipa`، `apk`، `dmg`، إلخ.) |
| `min_os` | لا | الحد الأدنى لإصدار نظام التشغيل |
| `sort_order` | لا | ترتيب العرض (الأصغر = الأول) |

### تحديث متغير

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### حذف متغير

```
DELETE /admin/api/variants/:variantID
```

::: danger حذف متتالٍ
يؤدي حذف متغير إلى حذف نهائي لجميع إصداراته والملفات المرفوعة.
:::

### إحصائيات المتغير

```
GET /admin/api/variants/:variantID/stats
```

يُعيد عداد التنزيل وإحصائيات أخرى للمتغير.

## الإصدارات

### حذف إصدار

```
DELETE /admin/api/releases/:releaseID
```

يحذف الإصدار وملفه الثنائي المرفوع.

## النشر

التحكم في ظهور منتج/تطبيق في صفحة التنزيل العامة.

### النشر

```
PUT /admin/api/apps/:appID/publish
```

### إلغاء النشر

```
PUT /admin/api/apps/:appID/unpublish
```

## الأحداث

### استعلام الأحداث

```
GET /admin/api/events
```

يُعيد أحداث الزيارة والنقر والتنزيل. يدعم معاملات استعلام للتصفية.

| المعامل | الوصف |
|---------|-------|
| `type` | نوع الحدث (`visit`، `click`، `download`) |
| `variant_id` | التصفية حسب المتغير |
| `release_id` | التصفية حسب الإصدار |

## أجهزة iOS

### قائمة الأجهزة

```
GET /admin/api/ios_devices
```

يُعيد جميع أجهزة iOS التي أكملت ربط UDID.

### تسجيل جهاز مع Apple

```
POST /admin/api/devices/:deviceID/register-apple
```

يُسجّل جهازاً واحداً في حساب Apple Developer الخاص بك.

### تسجيل دفعي للأجهزة

```
POST /admin/api/devices/register-apple
```

يُسجّل جميع الأجهزة غير المسجّلة مع Apple في عملية دفعية واحدة.

## Apple Developer API

### التحقق من الحالة

```
GET /admin/api/apple/status
```

يُعيد ما إذا كانت بيانات اعتماد Apple Developer API مُعيَّنة وصالحة.

### قائمة أجهزة Apple

```
GET /admin/api/apple/devices
```

يُعيد الأجهزة المسجّلة في حساب Apple Developer الخاص بك.

## الإعدادات

### الحصول على الإعدادات

```
GET /admin/api/settings
```

يُعيد إعدادات النظام الحالية (النطاقات والمؤسسة ونوع التخزين).

### تحديث الإعدادات

```
PUT /admin/api/settings
Content-Type: application/json
```

الحقول القابلة للتحديث تشمل:
- `primary_domain` -- URL العام للمنشورات والردود
- `secondary_domains` -- CDN أو نطاقات بديلة
- `organization` -- اسم المؤسسة في ملفات تعريف iOS
- `storage_type` -- `local` أو `s3`
- إعداد S3 (نقطة النهاية والحاوية والمفاتيح والـ URL العام)
- بيانات اعتماد Apple Developer API

### الحصول على إعداد الرفع

```
GET /admin/api/upload-config
```

يُعيد إعداد الرفع الحالي بما فيه نوع التخزين والحدود.

## التصديرات

تصدير البيانات كملفات CSV للتحليل الخارجي:

| نقطة النهاية | البيانات |
|-------------|---------|
| `GET /admin/exports/releases.csv` | جميع الإصدارات مع البيانات الوصفية |
| `GET /admin/exports/events.csv` | جميع الأحداث |
| `GET /admin/exports/ios_devices.csv` | جميع أجهزة iOS |

```bash
# مثال: تصدير جميع الإصدارات
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## الخطوات التالية

- [واجهة برمجة تطبيقات الرفع](./upload) -- مرجع نقطة نهاية الرفع
- [الإعداد](../configuration/) -- خيارات إعداد الخادم
- [النشر الإنتاجي](../deployment/production) -- تأمين admin API

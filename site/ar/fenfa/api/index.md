---
title: نظرة عامة على واجهة برمجة التطبيقات
description: "مرجع REST API لـ Fenfa. المصادقة بالرمز واستجابات JSON ونقاط النهاية لرفع البنيات وإدارة المنتجات والاستعلام عن الإحصائيات."
---

# نظرة عامة على واجهة برمجة التطبيقات

يعرض Fenfa REST API لرفع البنيات وإدارة المنتجات والاستعلام عن الإحصائيات. جميع التفاعلات البرمجية -- من رفع CI/CD إلى عمليات لوحة الإدارة -- تمر عبر هذا API.

## URL الأساسي

جميع نقاط نهاية API نسبية إلى URL خادم Fenfa:

```
https://your-domain.com
```

## المصادقة

تتطلب نقاط النهاية المحمية رأس `X-Auth-Token`. يستخدم Fenfa نطاقَي رمز:

| النطاق | الصلاحيات | الرأس |
|--------|----------|-------|
| `upload` | رفع البنيات | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | وصول إدارة كامل (يشمل الرفع) | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

تُعيَّن الرموز في `config.json` أو عبر متغيرات البيئة. راجع [الإعداد](../configuration/).

::: warning
الطلبات إلى نقاط النهاية المحمية بدون رمز صالح تستقبل استجابة `401 Unauthorized`.
:::

## تنسيق الاستجابة

جميع استجابات JSON تتبع بنية موحدة:

**نجاح:**

```json
{
  "ok": true,
  "data": { ... }
}
```

**خطأ:**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### رموز الأخطاء

| الرمز | حالة HTTP | الوصف |
|-------|----------|-------|
| `BAD_REQUEST` | 400 | معاملات طلب غير صالحة |
| `UNAUTHORIZED` | 401 | رمز مصادقة مفقود أو غير صالح |
| `FORBIDDEN` | 403 | الرمز يفتقر إلى النطاق المطلوب |
| `NOT_FOUND` | 404 | المورد غير موجود |
| `INTERNAL_ERROR` | 500 | خطأ في الخادم |

## ملخص نقاط النهاية

### نقاط النهاية العامة (بدون مصادقة)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/products/:slug` | صفحة تنزيل المنتج (HTML) |
| GET | `/d/:releaseID` | تنزيل الملف مباشرةً |
| GET | `/ios/:releaseID/manifest.plist` | manifest iOS OTA |
| GET | `/udid/profile.mobileconfig?variant=:id` | ملف تعريف ربط UDID |
| POST | `/udid/callback` | رد UDID (من iOS) |
| GET | `/udid/status?variant=:id` | حالة ربط UDID |
| GET | `/healthz` | فحص الصحة |

### نقاط نهاية الرفع (رمز الرفع)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/upload` | رفع ملف بناء |

### نقاط نهاية الإدارة (رمز الإدارة)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/admin/api/smart-upload` | رفع ذكي مع كشف تلقائي |
| GET | `/admin/api/products` | قائمة المنتجات |
| POST | `/admin/api/products` | إنشاء منتج |
| GET | `/admin/api/products/:id` | الحصول على منتج مع متغيراته |
| PUT | `/admin/api/products/:id` | تحديث منتج |
| DELETE | `/admin/api/products/:id` | حذف منتج |
| POST | `/admin/api/products/:id/variants` | إنشاء متغير |
| PUT | `/admin/api/variants/:id` | تحديث متغير |
| DELETE | `/admin/api/variants/:id` | حذف متغير |
| GET | `/admin/api/variants/:id/stats` | إحصائيات المتغير |
| DELETE | `/admin/api/releases/:id` | حذف إصدار |
| PUT | `/admin/api/apps/:id/publish` | نشر تطبيق |
| PUT | `/admin/api/apps/:id/unpublish` | إلغاء نشر تطبيق |
| GET | `/admin/api/events` | استعلام الأحداث |
| GET | `/admin/api/ios_devices` | قائمة أجهزة iOS |
| POST | `/admin/api/devices/:id/register-apple` | تسجيل جهاز مع Apple |
| POST | `/admin/api/devices/register-apple` | تسجيل دفعي للأجهزة |
| GET | `/admin/api/settings` | الحصول على الإعدادات |
| PUT | `/admin/api/settings` | تحديث الإعدادات |
| GET | `/admin/api/upload-config` | الحصول على إعداد الرفع |
| GET | `/admin/api/apple/status` | حالة Apple API |
| GET | `/admin/api/apple/devices` | الأجهزة المسجّلة في Apple |

### نقاط نهاية التصدير (رمز الإدارة)

| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/admin/exports/releases.csv` | تصدير الإصدارات |
| GET | `/admin/exports/events.csv` | تصدير الأحداث |
| GET | `/admin/exports/ios_devices.csv` | تصدير أجهزة iOS |

## تنسيق المعرف

جميع معرفات الموارد تستخدم تنسيق بادئة + سلسلة عشوائية:

| البادئة | المورد |
|--------|--------|
| `prd_` | المنتج |
| `var_` | المتغير |
| `rel_` | الإصدار |
| `app_` | التطبيق (قديم) |

## المراجع التفصيلية

- [واجهة برمجة تطبيقات الرفع](./upload) -- نقطة نهاية الرفع مع مرجع الحقول والأمثلة
- [واجهة برمجة تطبيقات الإدارة](./admin) -- توثيق كامل لنقاط نهاية الإدارة

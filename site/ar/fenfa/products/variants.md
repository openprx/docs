---
title: المتغيرات
description: "إنشاء متغيرات المنصة لمنتجات Fenfa. المنصات المدعومة وأنواع المثبّت والمعماريات وسير عمل إعداد المتغير."
---

# المتغيرات

المتغير يمثل إصداراً محدداً للمنصة من منتجك. كل منتج يمكن أن يحتوي على عدة متغيرات -- على سبيل المثال iOS وAndroid وmacOS.

## المنصات المدعومة

| المنصة | المعرف | أنواع المثبّت | المعماريات الشائعة |
|--------|--------|---------------|-------------------|
| iOS | `ios` | `ipa` | `arm64`, `universal` |
| Android | `android` | `apk`, `aab` | `arm64-v8a`, `armeabi-v7a`, `x86_64`, `universal` |
| macOS | `macos` | `dmg`, `pkg`, `zip` | `arm64`, `x86_64`, `universal` |
| Windows | `windows` | `exe`, `msi`, `zip` | `x64`, `x86`, `arm64` |
| Linux | `linux` | `deb`, `rpm`, `appimage`, `tar.gz` | `x86_64`, `arm64` |

## إنشاء متغير

### عبر لوحة الإدارة

اذهب إلى **المنتجات > [منتجك] > متغيرات > متغير جديد**.

### عبر API

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa"
  }'
```

### حقول المتغير

| الحقل | مطلوب | الوصف |
|-------|-------|-------|
| `platform` | نعم | `ios`, `android`, `macos`, `windows`, `linux` |
| `display_name` | نعم | اسم قابل للقراءة (يُعرض في لوحة الإدارة والصفحة العامة) |
| `identifier` | نعم | معرف الحزمة أو اسم الحزمة (مثلاً `com.example.myapp`) |
| `arch` | لا | معمارية CPU (مثلاً `arm64`, `x86_64`, `universal`) |
| `installer_type` | لا | نوع الملف (مثلاً `ipa`, `apk`, `dmg`) |
| `min_os` | لا | الحد الأدنى لإصدار نظام التشغيل (مثلاً `"15.0"` لـ iOS) |
| `sort_order` | لا | ترتيب العرض (الأصغر = الأول) |

## الإعداد النموذجي للمنتج

```
MyApp (prd_abc123)
├── iOS (var_ios)              platform=ios, arch=arm64, installer=ipa
├── Android (var_android)      platform=android, arch=universal, installer=apk
├── macOS Apple Silicon        platform=macos, arch=arm64, installer=dmg
├── macOS Intel                platform=macos, arch=x86_64, installer=dmg
└── Windows (var_win)          platform=windows, arch=x64, installer=exe
```

::: tip معمارية واحدة مقابل متعددة
إذا بنيت ثنائي عالمي (مثل iOS FAT binary أو Android universal APK)، استخدم `arch: "universal"` بدلاً من إنشاء متغيرات منفصلة.

إذا كنت ترسل ثنائيات لكل معمارية منفصلة (مثل macOS ARM64 وx86_64)، أنشئ متغيراً لكل منها.
:::

## تحديث متغير

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "iOS (iPhone / iPad)", "min_os": "16.0"}'
```

## حذف متغير

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: danger حذف متتالٍ
يؤدي حذف متغير إلى حذف نهائي لجميع إصداراته والملفات المرفوعة.
:::

## إحصائيات المتغير

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

يُعيد عداد التنزيل وإحصائيات أخرى للمتغير.

## تنسيق المعرف

معرفات المتغيرات تستخدم البادئة `var_` (مثلاً `var_def456`).

## الخطوات التالية

- [الإصدارات](./releases) -- رفع البنيات لمتغيراتك
- [توزيع iOS](../distribution/ios) -- التثبيت عبر الهواء وربط UDID
- [توزيع Android](../distribution/android) -- توزيع ملفات APK
- [توزيع سطح المكتب](../distribution/desktop) -- macOS وWindows وLinux

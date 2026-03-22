---
title: الإصدارات
description: "رفع بنيات التطبيق وإدارتها في Fenfa. الرفع العادي والرفع الذكي وروابط التنزيل وتكامل CI/CD."
---

# الإصدارات

الإصدار يمثل بناءً محدداً مرفوعاً لمتغير. في كل مرة ترفع فيها IPA أو APK أو مثبّت سطح مكتب، يُنشئ Fenfa سجل إصدار.

## حقول الإصدار

| الحقل | الوصف |
|-------|-------|
| `id` | معرف الإصدار (`rel_` + سلسلة عشوائية) |
| `variant_id` | المتغير الذي ينتمي إليه هذا الإصدار |
| `version` | سلسلة الإصدار (مثلاً "1.2.0") |
| `build` | رقم البناء (عدد صحيح) |
| `changelog` | ملاحظات الإصدار |
| `min_os` | الحد الأدنى لإصدار نظام التشغيل |
| `channel` | قناة التوزيع (مثلاً "internal", "beta") |
| `size_bytes` | حجم الملف بالبايتات |
| `sha256` | مجموع SHA-256 للملف |
| `download_count` | إجمالي عدد التنزيلات |
| `file_name` | اسم الملف الأصلي |
| `file_ext` | امتداد الملف |
| `created_at` | طابع زمني للرفع |

## رفع إصدار

### الرفع العادي

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "min_os=15.0" \
  -F "changelog=إصلاح الأخطاء وتحسينات الأداء"
```

### الرفع الذكي

يستخرج الرفع الذكي البيانات الوصفية تلقائياً من ملفات IPA وAPK:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

البيانات المستخرجة تشمل:
- **IPA**: معرف الحزمة، الإصدار (`CFBundleShortVersionString`)، رقم البناء (`CFBundleVersion`)، الأيقونة، الحد الأدنى لإصدار iOS
- **APK**: اسم الحزمة، اسم الإصدار، رمز الإصدار، الأيقونة، الحد الأدنى لإصدار SDK

::: tip أولوية الحقول المصرّح بها
الحقول المصرّح بها صراحةً تتجاوز القيم المستخرجة تلقائياً. هذا يسمح لك بتجاوز البيانات الوصفية للحزمة عند الحاجة.
:::

### حقول الرفع

| الحقل | مطلوب | النوع | الوصف |
|-------|-------|-------|-------|
| `variant_id` | نعم | string | معرف المتغير الهدف |
| `app_file` | نعم | ملف | الملف الثنائي (IPA، APK، DMG، EXE، إلخ.) |
| `version` | لا | string | سلسلة الإصدار |
| `build` | لا | integer | رقم البناء |
| `channel` | لا | string | قناة التوزيع |
| `min_os` | لا | string | الحد الأدنى لإصدار نظام التشغيل |
| `changelog` | لا | string | نص ملاحظات الإصدار |

## بنية مسار تخزين الملفات

```
uploads/
  {product_id}/
    {variant_id}/
      {release_id}/
        filename.ipa
```

## روابط التنزيل

| URL | الوصف |
|-----|-------|
| `/d/:releaseID` | رابط التنزيل المباشر للملف |
| `/ios/:releaseID/manifest.plist` | ملف manifest XML لـ iOS OTA |
| `/products/:slug` | صفحة تنزيل المنتج العامة |

## حذف إصدار

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

يحذف الإصدار وملفه الثنائي المرفوع.

## تصدير CSV

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## مثال تكامل CI/CD

خطوة GitHub Actions لرفع iOS بعد البناء الناجح:

```yaml
- name: Upload to Fenfa
  run: |
    RESPONSE=$(curl -s -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_IOS_VARIANT }}" \
      -F "app_file=@build/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}")
    echo "Download URL: $(echo $RESPONSE | jq -r '.data.urls.page')"
```

## الخطوات التالية

- [نظرة عامة على التوزيع](../distribution/) -- كيف تصل الإصدارات إلى المستخدمين
- [واجهة برمجة تطبيقات الرفع](../api/upload) -- مرجع كامل لنقطة نهاية الرفع
- [توزيع iOS](../distribution/ios) -- التثبيت عبر الهواء

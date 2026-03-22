---
title: واجهة برمجة تطبيقات الرفع
description: "رفع بنيات التطبيقات إلى Fenfa عبر REST API. الرفع العادي والرفع الذكي مع استخراج البيانات الوصفية التلقائي."
---

# واجهة برمجة تطبيقات الرفع

يوفر Fenfa نقطتَي رفع: رفع عادي للبيانات الوصفية الصريحة، ورفع ذكي يكتشف البيانات الوصفية تلقائياً من الحزمة المرفوعة.

## الرفع العادي

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token or admin_token>
```

### حقول الطلب

| الحقل | مطلوب | النوع | الوصف |
|-------|-------|-------|-------|
| `variant_id` | نعم | string | معرف المتغير الهدف (مثلاً `var_def456`) |
| `app_file` | نعم | ملف | الملف الثنائي (IPA، APK، DMG، EXE، إلخ.) |
| `version` | لا | string | سلسلة الإصدار (مثلاً "1.2.0") |
| `build` | لا | integer | رقم البناء (مثلاً 120) |
| `channel` | لا | string | قناة التوزيع (مثلاً "internal", "beta") |
| `min_os` | لا | string | الحد الأدنى لإصدار نظام التشغيل (مثلاً "15.0") |
| `changelog` | لا | string | نص ملاحظات الإصدار |

### مثال

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "min_os=15.0" \
  -F "changelog=Bug fixes and performance improvements"
```

### الاستجابة (201 Created)

```json
{
  "ok": true,
  "data": {
    "app": {
      "id": "app_xxx",
      "name": "MyApp",
      "platform": "ios",
      "bundle_id": "com.example.myapp"
    },
    "release": {
      "id": "rel_b1cqa",
      "version": "1.2.0",
      "build": 120
    },
    "urls": {
      "page": "https://dist.example.com/products/myapp",
      "download": "https://dist.example.com/d/rel_b1cqa",
      "ios_manifest": "https://dist.example.com/ios/rel_b1cqa/manifest.plist",
      "ios_install": "itms-services://?action=download-manifest&url=https://dist.example.com/ios/rel_b1cqa/manifest.plist"
    }
  }
}
```

كائن `urls` يوفر روابط جاهزة للاستخدام:
- `page` -- URL صفحة تنزيل المنتج
- `download` -- URL التنزيل المباشر للملف الثنائي
- `ios_manifest` -- URL ملف manifest plist لـ iOS (لمتغيرات iOS فقط)
- `ios_install` -- رابط التثبيت `itms-services://` الكامل (لمتغيرات iOS فقط)

## الرفع الذكي

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

يقبل الرفع الذكي نفس حقول الرفع العادي لكنه يكتشف البيانات الوصفية تلقائياً من الحزمة المرفوعة.

::: tip ما يُكتشف تلقائياً
لـ **ملفات IPA**: معرف الحزمة، الإصدار (`CFBundleShortVersionString`)، رقم البناء (`CFBundleVersion`)، أيقونة التطبيق، الحد الأدنى لإصدار iOS.

لـ **ملفات APK**: اسم الحزمة، اسم الإصدار، رمز الإصدار، أيقونة التطبيق، الحد الأدنى لإصدار SDK.

صيغ سطح المكتب (DMG وEXE وDEB إلخ.) لا تدعم الكشف التلقائي. أدخل version وbuild صراحةً.
:::

### مثال

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

الحقول المصرّح بها صراحةً تتجاوز القيم المستخرجة تلقائياً:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=Release candidate 1"
```

## استجابات الأخطاء

### معرف متغير مفقود (400)

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### رمز غير صالح (401)

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### متغير غير موجود (404)

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## أمثلة CI/CD

### GitHub Actions

```yaml
- name: Upload iOS build to Fenfa
  run: |
    RESPONSE=$(curl -s -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_IOS_VARIANT }}" \
      -F "app_file=@build/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}")
    echo "Upload response: $RESPONSE"
    echo "Download URL: $(echo $RESPONSE | jq -r '.data.urls.page')"
```

### GitLab CI

```yaml
upload:
  stage: deploy
  script:
    - |
      curl -X POST ${FENFA_URL}/upload \
        -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN}" \
        -F "variant_id=${FENFA_VARIANT_ID}" \
        -F "app_file=@build/output/app-release.apk" \
        -F "version=${CI_COMMIT_TAG}" \
        -F "build=${CI_PIPELINE_IID}" \
        -F "channel=beta"
  only:
    - tags
```

### سكريبت Shell

```bash
#!/bin/bash
# upload.sh - Upload a build to Fenfa
FENFA_URL="https://dist.example.com"
TOKEN="your-upload-token"
VARIANT="var_def456"
FILE="$1"
VERSION="$2"

if [ -z "$FILE" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./upload.sh <file> <version>"
  exit 1
fi

curl -X POST "${FENFA_URL}/upload" \
  -H "X-Auth-Token: ${TOKEN}" \
  -F "variant_id=${VARIANT}" \
  -F "app_file=@${FILE}" \
  -F "version=${VERSION}" \
  -F "build=$(date +%s)"
```

## الخطوات التالية

- [واجهة برمجة تطبيقات الإدارة](./admin) -- مرجع كامل لنقاط نهاية الإدارة
- [إدارة الإصدارات](../products/releases) -- إدارة الإصدارات المرفوعة
- [نظرة عامة على التوزيع](../distribution/) -- كيف تصل الرفعات إلى المستخدمين النهائيين

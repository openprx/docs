---
title: البدء السريع
description: إنشاء أول منتج وإضافة متغير وتحميل بناء ومشاركة صفحة التنزيل في دقائق.
---

# البدء السريع

سيرشدك هذا الدليل خلال إنشاء أول توزيع تطبيق باستخدام Fenfa.

## الخطوة 1: تشغيل Fenfa

```bash
docker run -d --name fenfa -p 8000:8000 \
  -v ./data:/data -v ./uploads:/app/uploads \
  -e FENFA_ADMIN_TOKEN=admin-token \
  -e FENFA_UPLOAD_TOKEN=upload-token \
  fenfa/fenfa:latest
```

## الخطوة 2: إنشاء منتج

منتجاتك هي تطبيقاتك. أنشئ واحداً عبر لوحة الإدارة أو API:

**لوحة الإدارة:** افتح `http://localhost:8000`، اذهب إلى **المنتجات > منتج جديد**.

**API:**

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: admin-token" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "تطبيقي الرائع"}'
```

سيُستخدم `slug` في URL صفحة التنزيل العامة: `/products/myapp`.

## الخطوة 3: إضافة متغير

المتغيرات تمثل إصدارات المنصة المحددة لمنتجك (مثلاً iOS، Android):

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa"
  }'
```

## الخطوة 4: رفع البناء

**عبر لوحة الإدارة:** اذهب إلى **المنتجات > MyApp > متغيرات > iOS > تحميل بناء**.

**عبر curl:**

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: upload-token" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.0.0" \
  -F "build=100" \
  -F "changelog=الإصدار الأول"
```

**بـ smart-upload (يستخرج البيانات الوصفية تلقائياً من ملفات IPA/APK):**

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: admin-token" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

## الخطوة 5: مشاركة صفحة التنزيل

بعد تحميل البناء، صفحة المنتج العامة جاهزة على:

```
http://localhost:8000/products/myapp
```

تتضمن الصفحة:
- **كشف المنصة** -- يعرض زر التنزيل الصحيح تلقائياً
- **رمز QR** -- للمسح السريع من الهاتف
- **تاريخ الإصدارات** -- مع سجلات التغييرات
- **تثبيت iOS OTA** -- يفتح مثبّت iOS مباشرةً بالضغط على Install

## ما التالي

| المهمة | الدليل |
|--------|--------|
| إعداد المزيد من المنصات | [المتغيرات](../products/variants) |
| فهم تدفق التوزيع | [نظرة عامة على التوزيع](../distribution/) |
| توزيع iOS مع ربط UDID | [توزيع iOS](../distribution/ios) |
| أتمتة الرفع من CI/CD | [واجهة برمجة تطبيقات الرفع](../api/upload) |
| نشر Fenfa في الإنتاج | [النشر الإنتاجي](../deployment/production) |

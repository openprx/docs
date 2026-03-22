---
title: نظرة عامة على REST API
description: "يوفر OpenPR REST API شاملاً لإدارة مساحات العمل والمشاريع والمهام والحوكمة والمزيد. مبني بـ Rust وAxum."
---

# نظرة عامة على REST API

يوفر OpenPR واجهة RESTful مبنية بـ **Rust** و**Axum** للوصول البرمجي إلى جميع ميزات المنصة. يدعم API تنسيقات طلب/استجابة JSON ومصادقة مستندة إلى JWT.

## رابط الأساس

```
http://localhost:8080/api
```

في نشر الإنتاج خلف وكيل عكسي (Caddy/Nginx)، عادةً ما يُوجَّه API عبر رابط الواجهة الأمامية.

## تنسيق الاستجابة

جميع استجابات API تتبع هيكل JSON متسقاً:

### نجاح

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### خطأ

```json
{
  "code": 400,
  "message": "Detailed error description"
}
```

رموز الخطأ الشائعة:

| الرمز | المعنى |
|-------|-------|
| 400 | طلب خاطئ (خطأ تحقق) |
| 401 | غير مُصادَق (رمز مفقود أو غير صالح) |
| 403 | محظور (صلاحيات غير كافية) |
| 404 | غير موجود |
| 500 | خطأ داخلي في الخادم |

## فئات API

| الفئة | المسار الأساسي | الوصف |
|-------|--------------|-------|
| [المصادقة](./authentication) | `/api/auth/*` | تسجيل، تسجيل دخول، تحديث الرمز |
| المشاريع | `/api/workspaces/*/projects/*` | CRUD، الأعضاء، الإعدادات |
| المهام | `/api/projects/*/issues/*` | CRUD، تكليف، وسوم، تعليق |
| اللوحة | `/api/projects/*/board` | حالة لوحة الكانبان |
| السبرينت | `/api/projects/*/sprints/*` | CRUD السبرينت والتخطيط |
| الوسوم | `/api/labels/*` | CRUD الوسوم |
| البحث | `/api/search` | بحث نصي كامل |
| المقترحات | `/api/proposals/*` | إنشاء، تصويت، تقديم، أرشفة |
| الحوكمة | `/api/governance/*` | الإعداد، سجلات التدقيق |
| القرارات | `/api/decisions/*` | سجلات القرارات |
| درجات الثقة | `/api/trust-scores/*` | الدرجات، السجل، الاستئنافات |
| النقض | `/api/veto/*` | النقض، التصعيد |
| وكلاء الذكاء الاصطناعي | `/api/projects/*/ai-agents/*` | إدارة الوكيل |
| مهام الذكاء الاصطناعي | `/api/projects/*/ai-tasks/*` | تكليف المهام |
| رموز البوت | `/api/workspaces/*/bots` | CRUD رمز البوت |
| رفع الملفات | `/api/v1/upload` | رفع ملف متعدد الأجزاء |
| Webhooks | `/api/workspaces/*/webhooks/*` | CRUD webhook |
| المسؤول | `/api/admin/*` | إدارة النظام |

راجع [مرجع نقاط النهاية](./endpoints) للمرجع الكامل لـ API.

## نوع المحتوى

جميع طلبات POST/PUT/PATCH يجب أن تستخدم `Content-Type: application/json`، باستثناء رفع الملفات التي تستخدم `multipart/form-data`.

## التصفح

نقاط نهاية القوائم تدعم التصفح:

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## البحث النصي الكامل

تستخدم نقطة نهاية البحث PostgreSQL full-text search عبر المهام والتعليقات والمقترحات:

```bash
curl "http://localhost:8080/api/search?q=authentication+bug" \
  -H "Authorization: Bearer <token>"
```

## فحص الصحة

يوفر خادم API نقطة نهاية صحة لا تتطلب مصادقة:

```bash
curl http://localhost:8080/health
```

## الخطوات التالية

- [المصادقة](./authentication) -- مصادقة JWT ورموز البوت
- [مرجع نقاط النهاية](./endpoints) -- توثيق نقاط النهاية الكامل
- [خادم MCP](../mcp-server/) -- واجهة صديقة للذكاء الاصطناعي بـ 34 أداة

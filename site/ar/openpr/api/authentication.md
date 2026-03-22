---
title: المصادقة
description: "يستخدم OpenPR رموز JWT لمصادقة المستخدم ورموز البوت للوصول عبر الذكاء الاصطناعي/MCP. تعلّم عن التسجيل وتسجيل الدخول وتحديث الرمز ورموز البوت."
---

# المصادقة

يستخدم OpenPR **JWT (JSON Web Tokens)** لمصادقة المستخدم و**رموز البوت** للوصول عبر مساعد الذكاء الاصطناعي وخادم MCP.

## مصادقة المستخدم (JWT)

### التسجيل

أنشئ حساباً جديداً:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

الاستجابة:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip أول مستخدم
أول مستخدم يسجل يتلقى دور `admin` تلقائياً. جميع المستخدمين اللاحقين `user` افتراضياً.
:::

### تسجيل الدخول

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

تتضمن الاستجابة `access_token` و`refresh_token` ومعلومات المستخدم مع `role`.

### استخدام رمز الوصول

أدرج رمز الوصول في رأس `Authorization` لجميع الطلبات المُصادَق عليها:

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### تحديث الرمز

عند انتهاء صلاحية رمز الوصول، استخدم رمز التحديث للحصول على زوج جديد:

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### الحصول على المستخدم الحالي

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

يُعيد ملف المستخدم الحالي بما في ذلك `role` (admin/user).

## إعداد الرمز

مدة حياة رمز JWT مُهيَّأة عبر متغيرات البيئة:

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `JWT_SECRET` | `change-me-in-production` | المفتاح السري لتوقيع الرموز |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 يوم) | مدة حياة رمز الوصول |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 أيام) | مدة حياة رمز التحديث |

::: danger أمان الإنتاج
اضبط دائماً `JWT_SECRET` إلى قيمة قوية وعشوائية في الإنتاج. القيمة الافتراضية غير آمنة.
:::

## مصادقة رمز البوت

توفر رموز البوت مصادقة لمساعدي الذكاء الاصطناعي والأدوات الآلية. هي مُقيَّدة بمساحة العمل وتستخدم بادئة `opr_`.

### إنشاء رموز البوت

تُدار رموز البوت من خلال واجهة إعدادات مساحة العمل أو API:

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude Assistant"}'
```

### استخدام رموز البوت

تُستخدم رموز البوت بنفس طريقة رموز JWT:

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### خصائص رمز البوت

| الخاصية | الوصف |
|---------|-------|
| البادئة | `opr_` |
| النطاق | مساحة عمل واحدة |
| نوع الكيان | ينشئ كيان مستخدم `bot_mcp` |
| الصلاحيات | نفس عضو مساحة العمل |
| سجل التدقيق | جميع الإجراءات مُسجَّلة تحت مستخدم البوت |

## ملخص نقاط نهاية المصادقة

| نقطة النهاية | الطريقة | الوصف |
|------------|--------|-------|
| `/api/auth/register` | POST | إنشاء حساب |
| `/api/auth/login` | POST | تسجيل الدخول والحصول على الرموز |
| `/api/auth/refresh` | POST | تحديث زوج الرموز |
| `/api/auth/me` | GET | الحصول على معلومات المستخدم الحالي |

## الخطوات التالية

- [مرجع نقاط النهاية](./endpoints) -- توثيق API الكامل
- [خادم MCP](../mcp-server/) -- استخدام رمز البوت مع MCP
- [الأعضاء والصلاحيات](../workspace/members) -- التحكم في الوصول المستند إلى الدور

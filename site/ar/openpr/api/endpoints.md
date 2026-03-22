---
title: مرجع نقاط نهاية API
description: "مرجع كامل لجميع نقاط نهاية REST API في OpenPR بما فيها المصادقة والمشاريع والمهام والحوكمة والذكاء الاصطناعي وعمليات المسؤول."
---

# مرجع نقاط نهاية API

توفر هذه الصفحة مرجعاً كاملاً لجميع نقاط نهاية REST API في OpenPR. جميع نقاط النهاية تتطلب مصادقة ما لم يُشر إلى غير ذلك.

## المصادقة

| الطريقة | نقطة النهاية | الوصف | مصادقة |
|--------|------------|-------|-------|
| POST | `/api/auth/register` | إنشاء حساب جديد | لا |
| POST | `/api/auth/login` | تسجيل الدخول وتلقي الرموز | لا |
| POST | `/api/auth/refresh` | تحديث رمز الوصول | لا |
| GET | `/api/auth/me` | الحصول على معلومات المستخدم الحالي | نعم |

## مساحات العمل

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/workspaces` | سرد مساحات عمل المستخدم |
| POST | `/api/workspaces` | إنشاء مساحة عمل |
| GET | `/api/workspaces/:id` | الحصول على تفاصيل مساحة العمل |
| PUT | `/api/workspaces/:id` | تحديث مساحة العمل |
| DELETE | `/api/workspaces/:id` | حذف مساحة العمل (للمالك فقط) |

## أعضاء مساحة العمل

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/workspaces/:id/members` | سرد الأعضاء |
| POST | `/api/workspaces/:id/members` | إضافة عضو |
| PUT | `/api/workspaces/:id/members/:user_id` | تحديث دور العضو |
| DELETE | `/api/workspaces/:id/members/:user_id` | إزالة عضو |

## رموز البوت

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/workspaces/:id/bots` | سرد رموز البوت |
| POST | `/api/workspaces/:id/bots` | إنشاء رمز بوت |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | حذف رمز بوت |

## المشاريع

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/workspaces/:ws_id/projects` | سرد المشاريع |
| POST | `/api/workspaces/:ws_id/projects` | إنشاء مشروع |
| GET | `/api/workspaces/:ws_id/projects/:id` | الحصول على مشروع مع الأعداد |
| PUT | `/api/workspaces/:ws_id/projects/:id` | تحديث مشروع |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | حذف مشروع |

## المهام (عناصر العمل)

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/projects/:id/issues` | سرد المهام (تصفح، تصفيات) |
| POST | `/api/projects/:id/issues` | إنشاء مهمة |
| GET | `/api/issues/:id` | الحصول على مهمة بـ UUID |
| PATCH | `/api/issues/:id` | تحديث حقول المهمة |
| DELETE | `/api/issues/:id` | حذف مهمة |

### حقول المهمة (إنشاء/تحديث)

```json
{
  "title": "string (required on create)",
  "description": "string (markdown)",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "ISO 8601 datetime"
}
```

## اللوحة

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/projects/:id/board` | الحصول على حالة لوحة الكانبان |

## التعليقات

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/issues/:id/comments` | سرد تعليقات مهمة |
| POST | `/api/issues/:id/comments` | إنشاء تعليق |
| DELETE | `/api/comments/:id` | حذف تعليق |

## الوسوم

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/labels` | سرد جميع وسوم مساحة العمل |
| POST | `/api/labels` | إنشاء وسم |
| PUT | `/api/labels/:id` | تحديث وسم |
| DELETE | `/api/labels/:id` | حذف وسم |
| POST | `/api/issues/:id/labels` | إضافة وسم لمهمة |
| DELETE | `/api/issues/:id/labels/:label_id` | إزالة وسم من مهمة |

## السبرينت

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/projects/:id/sprints` | سرد السبرينتات |
| POST | `/api/projects/:id/sprints` | إنشاء سبرينت |
| PUT | `/api/sprints/:id` | تحديث سبرينت |
| DELETE | `/api/sprints/:id` | حذف سبرينت |

## المقترحات

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/proposals` | سرد المقترحات |
| POST | `/api/proposals` | إنشاء مقترح |
| GET | `/api/proposals/:id` | الحصول على تفاصيل مقترح |
| POST | `/api/proposals/:id/vote` | الإدلاء بصوت |
| POST | `/api/proposals/:id/submit` | تقديم للتصويت |
| POST | `/api/proposals/:id/archive` | أرشفة مقترح |

## الحوكمة

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/governance/config` | الحصول على إعداد الحوكمة |
| PUT | `/api/governance/config` | تحديث إعداد الحوكمة |
| GET | `/api/governance/audit-logs` | سرد سجلات تدقيق الحوكمة |

## القرارات

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/decisions` | سرد القرارات |
| GET | `/api/decisions/:id` | الحصول على تفاصيل قرار |

## درجات الثقة

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/trust-scores` | سرد درجات الثقة |
| GET | `/api/trust-scores/:user_id` | الحصول على درجة ثقة مستخدم |
| GET | `/api/trust-scores/:user_id/history` | الحصول على سجل الدرجات |
| POST | `/api/trust-scores/:user_id/appeals` | تقديم استئناف |

## النقض

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/veto` | سرد أحداث النقض |
| POST | `/api/veto` | إنشاء نقض |
| POST | `/api/veto/:id/escalate` | تصعيد نقض |

## وكلاء الذكاء الاصطناعي

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/projects/:id/ai-agents` | سرد وكلاء الذكاء الاصطناعي |
| POST | `/api/projects/:id/ai-agents` | تسجيل وكيل ذكاء اصطناعي |
| GET | `/api/projects/:id/ai-agents/:agent_id` | الحصول على تفاصيل الوكيل |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | تحديث وكيل |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | إزالة وكيل |

## مهام الذكاء الاصطناعي

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/projects/:id/ai-tasks` | سرد مهام الذكاء الاصطناعي |
| POST | `/api/projects/:id/ai-tasks` | إنشاء مهمة ذكاء اصطناعي |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | تحديث حالة المهمة |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | استدعاء المهمة |

## رفع الملفات

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| POST | `/api/v1/upload` | رفع ملف (multipart/form-data) |

الأنواع المدعومة: الصور (PNG، JPG، GIF، WebP)، الوثائق (PDF، TXT)، البيانات (JSON، CSV، XML)، الأرشيفات (ZIP، GZ)، السجلات.

## Webhooks

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/workspaces/:id/webhooks` | سرد webhooks |
| POST | `/api/workspaces/:id/webhooks` | إنشاء webhook |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | تحديث webhook |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | حذف webhook |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | سجل التسليم |

## البحث

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/search?q=<query>` | بحث نصي كامل عبر جميع الكيانات |

## المسؤول

| الطريقة | نقطة النهاية | الوصف |
|--------|------------|-------|
| GET | `/api/admin/users` | سرد جميع المستخدمين (للمسؤول فقط) |
| PUT | `/api/admin/users/:id` | تحديث مستخدم (للمسؤول فقط) |

## الصحة

| الطريقة | نقطة النهاية | الوصف | مصادقة |
|--------|------------|-------|-------|
| GET | `/health` | فحص الصحة | لا |

## الخطوات التالية

- [المصادقة](./authentication) -- إدارة الرموز ورموز البوت
- [نظرة عامة على API](./index) -- تنسيق الاستجابة والاتفاقيات
- [خادم MCP](../mcp-server/) -- واجهة صديقة للذكاء الاصطناعي

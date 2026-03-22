---
title: إدارة المشاريع
description: "المشاريع تنظّم المهام والسبرينت والوسوم داخل مساحة عمل. تعلّم كيفية إنشاء المشاريع وإدارتها في OpenPR."
---

# إدارة المشاريع

يعيش **المشروع** داخل مساحة عمل ويعمل كحاوية للمهام والسبرينت والوسوم ومقترحات الحوكمة. كل مشروع له **مفتاح** فريد (مثل `API` أو `FRONT` أو `OPS`) يضاف كبادئة لمعرفات المهام.

## إنشاء مشروع

انتقل إلى مساحة عملك وانقر **New Project**:

| الحقل | مطلوب | الوصف | مثال |
|-------|-------|-------|------|
| الاسم | نعم | اسم العرض | "Backend API" |
| المفتاح | نعم | بادئة 2-5 أحرف للمهام | "API" |
| الوصف | لا | ملخص المشروع | "REST API and business logic" |

يجب أن يكون المفتاح فريداً داخل مساحة العمل ويحدد معرفات المهام: `API-1` و`API-2` الخ.

## لوحة تحكم المشروع

كل مشروع يوفر:

- **Board** -- عرض الكانبان مع أعمدة قابلة للسحب والإسقاط (Backlog، To Do، In Progress، Done).
- **Issues** -- عرض القائمة مع التصفية والترتيب والبحث النصي الكامل.
- **Sprints** -- تخطيط السبرينت وإدارة الدورات. راجع [السبرينت](../issues/sprints).
- **Labels** -- وسوم مُقيَّدة بالمشروع للتصنيف. راجع [الوسوم](../issues/labels).
- **Settings** -- اسم المشروع ومفتاحه ووصفه وإعدادات الأعضاء.

## أعداد المهام

تُظهر نظرة عامة المشروع أعداد المهام حسب الحالة:

| الحالة | الوصف |
|--------|-------|
| Backlog | أفكار وعمل مستقبلي |
| To Do | مخطط للدورة الحالية |
| In Progress | يُعمَل عليه بفاعلية |
| Done | عمل مكتمل |

## مرجع API

```bash
# List projects in a workspace
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# Create a project
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Backend API", "key": "API"}'

# Get project with issue counts
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## أدوات MCP

| الأداة | المعاملات | الوصف |
|--------|----------|-------|
| `projects.list` | -- | سرد جميع المشاريع في مساحة العمل |
| `projects.get` | `project_id` | الحصول على تفاصيل المشروع مع أعداد المهام |
| `projects.create` | `key`, `name` | إنشاء مشروع جديد |
| `projects.update` | `project_id` | تحديث الاسم أو الوصف |
| `projects.delete` | `project_id` | حذف مشروع |

## الخطوات التالية

- [المهام](../issues/) -- إنشاء وإدارة المهام داخل المشاريع
- [الأعضاء](./members) -- إدارة الوصول للمشروع من خلال أدوار مساحة العمل

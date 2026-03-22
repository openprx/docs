---
title: المهام والتتبع
description: "مهام OpenPR هي وحدة العمل الأساسية. تتبع المهام والأخطاء والميزات بالحالات والأولويات والمُكلَّفين والوسوم والتعليقات."
---

# المهام والتتبع

المهام (تُسمى أيضاً عناصر العمل) هي وحدة العمل الأساسية في OpenPR. تمثل المهام والأخطاء والميزات أو أي قطعة عمل قابلة للتتبع داخل مشروع.

## حقول المهمة

| الحقل | النوع | مطلوب | الوصف |
|-------|-------|-------|-------|
| العنوان | string | نعم | وصف مختصر للعمل |
| الوصف | markdown | لا | وصف تفصيلي بالتنسيق |
| الحالة | enum | نعم | حالة سير العمل (راجع [سير العمل](./workflow)) |
| الأولوية | enum | لا | `low`، `medium`، `high`، `urgent` |
| المُكلَّف | مستخدم | لا | عضو الفريق المسؤول عن المهمة |
| الوسوم | قائمة | لا | وسوم التصنيف (راجع [الوسوم](./labels)) |
| السبرينت | sprint | لا | دورة السبرينت التي تنتمي إليها المهمة |
| تاريخ الاستحقاق | datetime | لا | تاريخ الإنجاز المستهدف |
| المرفقات | ملفات | لا | ملفات مرفقة (صور، وثائق، سجلات) |

## معرفات المهام

كل مهمة لها معرف مقروء من البشر مؤلف من مفتاح المشروع ورقم تسلسلي:

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

يمكنك البحث عن أي مهمة بمعرفها عبر جميع المشاريع في مساحة العمل.

## إنشاء المهام

### عبر واجهة الويب

1. انتقل إلى مشروعك.
2. انقر **New Issue**.
3. أدخل العنوان والوصف والحقول الاختيارية.
4. انقر **Create**.

### عبر REST API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implement user settings page",
    "description": "Add a settings page where users can update their profile.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### عبر MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Implement user settings page",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## التعليقات

تدعم المهام تعليقات مترابطة بتنسيق markdown ومرفقات ملفات:

```bash
# Add a comment
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Fixed in commit abc123. Ready for review."}'
```

التعليقات متاحة أيضاً عبر أدوات MCP: `comments.create` و`comments.list` و`comments.delete`.

## خلاصة النشاط

كل تغيير على مهمة يُسجَّل في خلاصة النشاط:

- تغييرات الحالة
- تغييرات المُكلَّف
- إضافة/إزالة الوسوم
- التعليقات
- تحديثات الأولوية

توفر خلاصة النشاط سجل تدقيق كاملاً لكل مهمة.

## مرفقات الملفات

تدعم المهام والتعليقات مرفقات الملفات بما فيها الصور والوثائق والسجلات والأرشيفات. رفع عبر API:

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

أو عبر MCP:

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<base64_encoded_content>"
    }
  }
}
```

أنواع الملفات المدعومة: الصور (PNG، JPG، GIF، WebP)، الوثائق (PDF، TXT)، البيانات (JSON، CSV، XML)، الأرشيفات (ZIP، GZ)، والسجلات.

## البحث

يوفر OpenPR بحثاً نصياً كاملاً عبر جميع المهام والتعليقات والمقترحات باستخدام PostgreSQL FTS:

```bash
# Search via API
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# Search via MCP
# work_items.search: search within a project
# search.all: global search across all projects
```

## أدوات MCP

| الأداة | المعاملات | الوصف |
|--------|----------|-------|
| `work_items.list` | `project_id` | سرد المهام في مشروع |
| `work_items.get` | `work_item_id` | الحصول على مهمة بـ UUID |
| `work_items.get_by_identifier` | `identifier` | الحصول بمعرف مقروء (مثل `API-42`) |
| `work_items.create` | `project_id`, `title` | إنشاء مهمة |
| `work_items.update` | `work_item_id` | تحديث أي حقل |
| `work_items.delete` | `work_item_id` | حذف مهمة |
| `work_items.search` | `query` | بحث نصي كامل |
| `comments.create` | `work_item_id`, `content` | إضافة تعليق |
| `comments.list` | `work_item_id` | سرد التعليقات |
| `comments.delete` | `comment_id` | حذف تعليق |
| `files.upload` | `filename`, `content_base64` | رفع ملف |

## الخطوات التالية

- [حالات سير العمل](./workflow) -- فهم دورة حياة المهمة
- [تخطيط السبرينت](./sprints) -- تنظيم المهام في دورات سبرينت
- [الوسوم](./labels) -- تصنيف المهام بالوسوم

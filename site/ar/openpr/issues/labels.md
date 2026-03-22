---
title: الوسوم
description: "تنظيم وتصنيف المهام بوسوم ملونة في OpenPR. يمكن أن تكون الوسوم على مستوى مساحة العمل أو المشروع."
---

# الوسوم

توفر الوسوم طريقة مرنة لتصنيف المهام وتصفيتها. كل وسم له اسم ولون ووصف اختياري.

## إنشاء الوسوم

### عبر واجهة الويب

1. انتقل إلى مشروعك أو إعدادات مساحة العمل.
2. انتقل إلى **Labels**.
3. انقر **New Label**.
4. أدخل اسماً (مثل "bug" أو "feature" أو "documentation").
5. اختر لوناً (بتنسيق hex، مثل `#ef4444` للأحمر).
6. انقر **Create**.

### عبر API

```bash
curl -X POST http://localhost:8080/api/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "bug",
    "color": "#ef4444",
    "description": "Something is not working"
  }'
```

### عبر MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "labels.create",
    "arguments": {
      "name": "bug",
      "color": "#ef4444"
    }
  }
}
```

## مخططات الوسوم الشائعة

إليك بعض تنظيمات الوسوم الشائعة:

### حسب النوع

| الوسم | اللون | الوصف |
|-------|-------|-------|
| `bug` | `#ef4444` (أحمر) | شيء معطوب |
| `feature` | `#3b82f6` (أزرق) | طلب ميزة جديدة |
| `enhancement` | `#8b5cf6` (بنفسجي) | تحسين لميزة موجودة |
| `documentation` | `#06b6d4` (سماوي) | تحديثات التوثيق |
| `refactor` | `#f59e0b` (كهرماني) | إعادة هيكلة الكود |

### حسب الأولوية

| الوسم | اللون | الوصف |
|-------|-------|-------|
| `P0-critical` | `#dc2626` (أحمر) | الإنتاج متوقف |
| `P1-high` | `#ea580c` (برتقالي) | ميزة رئيسية معطلة |
| `P2-medium` | `#eab308` (أصفر) | مشكلة غير حرجة |
| `P3-low` | `#22c55e` (أخضر) | جيد أن يتوفر |

## إضافة الوسوم للمهام

### عبر واجهة الويب

افتح مهمة وانقر حقل **Labels** لإضافة أو إزالة الوسوم.

### عبر API

```bash
# Add a label to an issue
curl -X POST http://localhost:8080/api/issues/<issue_id>/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label_id": "<label_uuid>"}'
```

### عبر MCP

| الأداة | المعاملات | الوصف |
|--------|----------|-------|
| `work_items.add_label` | `work_item_id`, `label_id` | إضافة وسم واحد |
| `work_items.add_labels` | `work_item_id`, `label_ids` | إضافة وسوم متعددة |
| `work_items.remove_label` | `work_item_id`, `label_id` | إزالة وسم |
| `work_items.list_labels` | `work_item_id` | سرد وسوم مهمة |

## أدوات MCP لإدارة الوسوم

| الأداة | المعاملات | الوصف |
|--------|----------|-------|
| `labels.list` | -- | سرد جميع وسوم مساحة العمل |
| `labels.list_by_project` | `project_id` | سرد وسوم مشروع |
| `labels.create` | `name`, `color` | إنشاء وسم |
| `labels.update` | `label_id` | تحديث الاسم أو اللون أو الوصف |
| `labels.delete` | `label_id` | حذف وسم |

## الخطوات التالية

- [نظرة عامة على المهام](./index) -- مرجع حقول المهام الكاملة
- [حالات سير العمل](./workflow) -- إدارة دورة حياة المهمة
- [تخطيط السبرينت](./sprints) -- تنظيم المهام الموسومة في سبرينت

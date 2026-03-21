---
title: 标签
description: 使用彩色标签在 OpenPR 中组织和分类 Issue。标签可以是工作区级别或项目级别。
---

# 标签

标签提供了灵活的方式来分类和筛选 Issue。每个标签有名称、颜色和可选描述。

## 创建标签

### 通过网页 UI

1. 进入项目或工作区设置。
2. 进入 **标签**。
3. 点击 **新建标签**。
4. 输入名称（如"bug"、"feature"、"documentation"）。
5. 选择颜色（十六进制格式，如 `#ef4444` 红色）。
6. 点击 **创建**。

### 通过 API

```bash
curl -X POST http://localhost:8080/api/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "bug",
    "color": "#ef4444",
    "description": "有问题需要修复"
  }'
```

### 通过 MCP

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

## 常见标签方案

以下是一些常用的标签组织方式：

### 按类型

| 标签 | 颜色 | 说明 |
|------|------|------|
| `bug` | `#ef4444`（红色） | 有问题需要修复 |
| `feature` | `#3b82f6`（蓝色） | 新功能请求 |
| `enhancement` | `#8b5cf6`（紫色） | 现有功能改进 |
| `documentation` | `#06b6d4`（青色） | 文档更新 |
| `refactor` | `#f59e0b`（琥珀色） | 代码重构 |

### 按优先级

| 标签 | 颜色 | 说明 |
|------|------|------|
| `P0-critical` | `#dc2626`（红色） | 生产环境故障 |
| `P1-high` | `#ea580c`（橙色） | 主要功能损坏 |
| `P2-medium` | `#eab308`（黄色） | 非关键问题 |
| `P3-low` | `#22c55e`（绿色） | 可有可无 |

## 为 Issue 添加标签

### 通过网页 UI

打开 Issue 并点击 **标签** 字段来添加或移除标签。

### 通过 API

```bash
# 为 Issue 添加标签
curl -X POST http://localhost:8080/api/issues/<issue_id>/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label_id": "<label_uuid>"}'
```

### 通过 MCP

| 工具 | 参数 | 说明 |
|------|------|------|
| `work_items.add_label` | `work_item_id`, `label_id` | 添加一个标签 |
| `work_items.add_labels` | `work_item_id`, `label_ids` | 添加多个标签 |
| `work_items.remove_label` | `work_item_id`, `label_id` | 移除标签 |
| `work_items.list_labels` | `work_item_id` | 列出 Issue 上的标签 |

## 标签管理 MCP 工具

| 工具 | 参数 | 说明 |
|------|------|------|
| `labels.list` | -- | 列出所有工作区标签 |
| `labels.list_by_project` | `project_id` | 列出项目标签 |
| `labels.create` | `name`, `color` | 创建标签 |
| `labels.update` | `label_id` | 更新名称、颜色或描述 |
| `labels.delete` | `label_id` | 删除标签 |

## 下一步

- [Issue 概述](./index) -- 完整的 Issue 字段参考
- [工作流状态](./workflow) -- Issue 生命周期管理
- [Sprint 计划](./sprints) -- 将带标签的 Issue 组织到 Sprint

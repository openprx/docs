---
title: 项目管理
description: 项目在工作区内组织 Issue、Sprint 和标签。了解如何在 OpenPR 中创建和管理项目。
---

# 项目管理

**项目** 存在于工作区内，是 Issue、Sprint、标签和治理提案的容器。每个项目有唯一的 **键**（如 `API`、`FRONT`、`OPS`），作为 Issue 标识符的前缀。

## 创建项目

进入工作区并点击 **新建项目**：

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| 名称 | 是 | 显示名称 | "后端 API" |
| 键 | 是 | 2-5 字符的 Issue 前缀 | "API" |
| 描述 | 否 | 项目摘要 | "REST API 和业务逻辑" |

键在工作区内必须唯一，决定 Issue 标识符：`API-1`、`API-2` 等。

## 项目面板

每个项目提供：

- **面板** -- 可拖放的看板视图（Backlog、To Do、In Progress、Done）。
- **Issue** -- 列表视图，支持筛选、排序和全文搜索。
- **Sprint** -- Sprint 计划和周期管理。参阅 [Sprint](../issues/sprints)。
- **标签** -- 项目范围的分类标签。参阅 [标签](../issues/labels)。
- **设置** -- 项目名称、键、描述和成员设置。

## Issue 统计

项目概览按状态显示 Issue 数量：

| 状态 | 说明 |
|------|------|
| Backlog | 想法和未来工作 |
| To Do | 当前周期计划 |
| In Progress | 正在进行中 |
| Done | 已完成 |

## API 参考

```bash
# 列出工作区中的项目
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# 创建项目
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "后端 API", "key": "API"}'

# 获取项目及 Issue 统计
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## MCP 工具

| 工具 | 参数 | 说明 |
|------|------|------|
| `projects.list` | -- | 列出工作区所有项目 |
| `projects.get` | `project_id` | 获取项目详情及 Issue 统计 |
| `projects.create` | `key`, `name` | 创建新项目 |
| `projects.update` | `project_id` | 更新名称或描述 |
| `projects.delete` | `project_id` | 删除项目 |

## 下一步

- [Issue](../issues/) -- 在项目内创建和管理 Issue
- [成员](./members) -- 通过工作区角色管理项目访问

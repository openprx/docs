---
title: Sprint 管理
description: 使用 OpenPR 的 Sprint 在时间盒迭代中计划和跟踪工作。创建 Sprint、分配 Issue 并监控进度。
---

# Sprint 管理

Sprint 是用于组织和跟踪工作的时间盒迭代。每个 Sprint 属于一个项目，有开始日期、结束日期和一组分配的 Issue。

## 创建 Sprint

### 通过网页 UI

1. 进入项目。
2. 进入 **Sprint** 部分。
3. 点击 **新建 Sprint**。
4. 输入 Sprint 名称、开始日期和结束日期。

### 通过 API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sprint 1",
    "start_date": "2026-03-24",
    "end_date": "2026-04-07"
  }'
```

### 通过 MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "sprints.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "name": "Sprint 1",
      "start_date": "2026-03-24",
      "end_date": "2026-04-07"
    }
  }
}
```

## Sprint 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 名称 | 字符串 | 是 | Sprint 名称（如"Sprint 1"、"Q1 第3周"） |
| 开始日期 | 日期 | 否 | Sprint 开始日期 |
| 结束日期 | 日期 | 否 | Sprint 结束日期 |
| 状态 | 枚举 | 自动 | 活跃、已完成或已计划 |

## 分配 Issue 到 Sprint

通过更新 Issue 的 `sprint_id` 将其分配到 Sprint：

```bash
curl -X PATCH http://localhost:8080/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sprint_id": "<sprint_uuid>"}'
```

或在网页 UI 中，将 Issue 拖入 Sprint 区域或使用 Issue 详情面板。

## Sprint 计划流程

典型的 Sprint 计划流程：

1. **创建 Sprint**，设置开始和结束日期。
2. **审查 Backlog**——确定要纳入的 Issue。
3. **移动 Issue** 从 Backlog/To Do 到 Sprint 中。
4. **设置优先级** 和 Sprint Issue 的负责人。
5. **开始 Sprint**——团队开始工作。
6. **跟踪进度** 在面板和 Sprint 视图中。
7. **完成 Sprint**——审查已完成/剩余项目。

## MCP 工具

| 工具 | 参数 | 说明 |
|------|------|------|
| `sprints.list` | `project_id` | 列出项目中的 Sprint |
| `sprints.create` | `project_id`, `name` | 创建 Sprint（可选日期） |
| `sprints.update` | `sprint_id` | 更新名称、日期或状态 |
| `sprints.delete` | `sprint_id` | 删除 Sprint |

## 下一步

- [工作流状态](./workflow) -- 了解 Issue 状态流转
- [标签](./labels) -- 分类 Sprint Issue
- [Issue 概述](./index) -- 完整的 Issue 字段参考

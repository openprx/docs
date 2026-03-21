---
title: Issue 与跟踪
description: OpenPR 的 Issue 是核心工作单元。使用状态、优先级、负责人、标签和评论跟踪任务、Bug 和功能。
---

# Issue 与跟踪

Issue（也称为工作项）是 OpenPR 的核心工作单元。它们代表项目中的任务、Bug、功能或任何可跟踪的工作。

## Issue 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 标题 | 字符串 | 是 | 工作的简短描述 |
| 描述 | Markdown | 否 | 带格式的详细描述 |
| 状态 | 枚举 | 是 | 工作流状态（参阅 [工作流](./workflow)） |
| 优先级 | 枚举 | 否 | `low`、`medium`、`high`、`urgent` |
| 负责人 | 用户 | 否 | 负责该 Issue 的团队成员 |
| 标签 | 列表 | 否 | 分类标签（参阅 [标签](./labels)） |
| Sprint | Sprint | 否 | Issue 所属的 Sprint 周期 |
| 截止日期 | 日期时间 | 否 | 目标完成日期 |
| 附件 | 文件 | 否 | 附加文件（图片、文档、日志） |

## Issue 标识符

每个 Issue 有一个由项目键和序号组成的可读标识符：

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

你可以通过标识符在工作区所有项目中查找任何 Issue。

## 创建 Issue

### 通过网页 UI

1. 进入项目。
2. 点击 **新建 Issue**。
3. 填写标题、描述和可选字段。
4. 点击 **创建**。

### 通过 REST API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "实现用户设置页面",
    "description": "添加用户可以更新个人资料的设置页面。",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### 通过 MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "实现用户设置页面",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## 评论

Issue 支持带 Markdown 格式和文件附件的评论：

```bash
# 添加评论
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "已在 commit abc123 修复。准备评审。"}'
```

评论也可通过 MCP 工具操作：`comments.create`、`comments.list`、`comments.delete`。

## 活动流

Issue 的每次变更都记录在活动流中：

- 状态变更
- 负责人变更
- 标签添加/移除
- 评论
- 优先级更新

活动流为每个 Issue 提供完整的审计追踪。

## 文件附件

Issue 和评论支持文件附件，包括图片、文档、日志和压缩包。通过 API 上传：

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

或通过 MCP：

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<base64编码内容>"
    }
  }
}
```

支持的文件类型：图片（PNG、JPG、GIF、WebP）、文档（PDF、TXT）、数据（JSON、CSV、XML）、压缩包（ZIP、GZ）和日志。

## 搜索

OpenPR 使用 PostgreSQL 全文搜索，支持跨 Issue、评论和提案搜索：

```bash
# 通过 API 搜索
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=认证+bug"

# 通过 MCP 搜索
# work_items.search：在项目内搜索
# search.all：跨所有项目全局搜索
```

## MCP 工具

| 工具 | 参数 | 说明 |
|------|------|------|
| `work_items.list` | `project_id` | 列出项目中的 Issue |
| `work_items.get` | `work_item_id` | 通过 UUID 获取 Issue |
| `work_items.get_by_identifier` | `identifier` | 通过标识符获取（如 `API-42`） |
| `work_items.create` | `project_id`, `title` | 创建 Issue |
| `work_items.update` | `work_item_id` | 更新任意字段 |
| `work_items.delete` | `work_item_id` | 删除 Issue |
| `work_items.search` | `query` | 全文搜索 |
| `comments.create` | `work_item_id`, `content` | 添加评论 |
| `comments.list` | `work_item_id` | 列出评论 |
| `comments.delete` | `comment_id` | 删除评论 |
| `files.upload` | `filename`, `content_base64` | 上传文件 |

## 下一步

- [工作流状态](./workflow) -- 了解 Issue 生命周期
- [Sprint 计划](./sprints) -- 将 Issue 组织到 Sprint 周期
- [标签](./labels) -- 使用标签分类 Issue

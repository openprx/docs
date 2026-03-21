---
title: API 端点参考
description: OpenPR REST API 所有端点的完整参考，包括认证、项目、Issue、治理、AI 和管理操作。
---

# API 端点参考

本页提供 OpenPR REST API 所有端点的完整参考。除特别注明外，所有端点需要认证。

## 认证

| 方法 | 端点 | 说明 | 需要认证 |
|------|------|------|----------|
| POST | `/api/auth/register` | 创建新账号 | 否 |
| POST | `/api/auth/login` | 登录获取令牌 | 否 |
| POST | `/api/auth/refresh` | 刷新访问令牌 | 否 |
| GET | `/api/auth/me` | 获取当前用户信息 | 是 |

## 工作区

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/workspaces` | 列出用户的工作区 |
| POST | `/api/workspaces` | 创建工作区 |
| GET | `/api/workspaces/:id` | 获取工作区详情 |
| PUT | `/api/workspaces/:id` | 更新工作区 |
| DELETE | `/api/workspaces/:id` | 删除工作区（仅 Owner） |

## 工作区成员

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/workspaces/:id/members` | 列出成员 |
| POST | `/api/workspaces/:id/members` | 添加成员 |
| PUT | `/api/workspaces/:id/members/:user_id` | 更新成员角色 |
| DELETE | `/api/workspaces/:id/members/:user_id` | 移除成员 |

## Bot Token

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/workspaces/:id/bots` | 列出 Bot Token |
| POST | `/api/workspaces/:id/bots` | 创建 Bot Token |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | 删除 Bot Token |

## 项目

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/workspaces/:ws_id/projects` | 列出项目 |
| POST | `/api/workspaces/:ws_id/projects` | 创建项目 |
| GET | `/api/workspaces/:ws_id/projects/:id` | 获取项目及统计 |
| PUT | `/api/workspaces/:ws_id/projects/:id` | 更新项目 |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | 删除项目 |

## Issue（工作项）

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/issues` | 列出 Issue（分页、筛选） |
| POST | `/api/projects/:id/issues` | 创建 Issue |
| GET | `/api/issues/:id` | 通过 UUID 获取 Issue |
| PATCH | `/api/issues/:id` | 更新 Issue 字段 |
| DELETE | `/api/issues/:id` | 删除 Issue |

### Issue 字段（创建/更新）

```json
{
  "title": "字符串（创建时必填）",
  "description": "字符串（Markdown）",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "ISO 8601 日期时间"
}
```

## 面板

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/board` | 获取看板面板状态 |

## 评论

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/issues/:id/comments` | 列出 Issue 评论 |
| POST | `/api/issues/:id/comments` | 创建评论 |
| DELETE | `/api/comments/:id` | 删除评论 |

## 标签

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/labels` | 列出所有工作区标签 |
| POST | `/api/labels` | 创建标签 |
| PUT | `/api/labels/:id` | 更新标签 |
| DELETE | `/api/labels/:id` | 删除标签 |
| POST | `/api/issues/:id/labels` | 为 Issue 添加标签 |
| DELETE | `/api/issues/:id/labels/:label_id` | 移除 Issue 标签 |

## Sprint

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/sprints` | 列出 Sprint |
| POST | `/api/projects/:id/sprints` | 创建 Sprint |
| PUT | `/api/sprints/:id` | 更新 Sprint |
| DELETE | `/api/sprints/:id` | 删除 Sprint |

## 提案

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/proposals` | 列出提案 |
| POST | `/api/proposals` | 创建提案 |
| GET | `/api/proposals/:id` | 获取提案详情 |
| POST | `/api/proposals/:id/vote` | 投票 |
| POST | `/api/proposals/:id/submit` | 提交投票 |
| POST | `/api/proposals/:id/archive` | 归档提案 |

## 治理

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/governance/config` | 获取治理配置 |
| PUT | `/api/governance/config` | 更新治理配置 |
| GET | `/api/governance/audit-logs` | 列出治理审计日志 |

## 决策

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/decisions` | 列出决策 |
| GET | `/api/decisions/:id` | 获取决策详情 |

## 信任分

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/trust-scores` | 列出信任分 |
| GET | `/api/trust-scores/:user_id` | 获取用户信任分 |
| GET | `/api/trust-scores/:user_id/history` | 获取评分历史 |
| POST | `/api/trust-scores/:user_id/appeals` | 提出申诉 |

## 否决

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/veto` | 列出否决事件 |
| POST | `/api/veto` | 创建否决 |
| POST | `/api/veto/:id/escalate` | 升级否决 |

## AI 代理

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/ai-agents` | 列出 AI 代理 |
| POST | `/api/projects/:id/ai-agents` | 注册 AI 代理 |
| GET | `/api/projects/:id/ai-agents/:agent_id` | 获取代理详情 |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | 更新代理 |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | 移除代理 |

## AI 任务

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/ai-tasks` | 列出 AI 任务 |
| POST | `/api/projects/:id/ai-tasks` | 创建 AI 任务 |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | 更新任务状态 |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | 任务回调 |

## 文件上传

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/v1/upload` | 上传文件（multipart/form-data） |

支持类型：图片（PNG、JPG、GIF、WebP）、文档（PDF、TXT）、数据（JSON、CSV、XML）、压缩包（ZIP、GZ）、日志。

## Webhook

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/workspaces/:id/webhooks` | 列出 Webhook |
| POST | `/api/workspaces/:id/webhooks` | 创建 Webhook |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | 更新 Webhook |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | 删除 Webhook |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | 投递日志 |

## 搜索

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/search?q=<query>` | 跨所有实体全文搜索 |

## 管理

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 列出所有用户（仅管理员） |
| PUT | `/api/admin/users/:id` | 更新用户（仅管理员） |

## 健康检查

| 方法 | 端点 | 说明 | 需要认证 |
|------|------|------|----------|
| GET | `/health` | 健康检查 | 否 |

## 下一步

- [认证](./authentication) -- 令牌管理和 Bot Token
- [API 概述](./index) -- 响应格式和约定
- [MCP 服务器](../mcp-server/) -- AI 友好接口

---
title: REST API 概述
description: OpenPR 提供全面的 REST API 用于管理工作区、项目、Issue、治理等。使用 Rust 和 Axum 构建。
---

# REST API 概述

OpenPR 提供使用 **Rust** 和 **Axum** 构建的 RESTful API，支持对所有平台功能的编程访问。API 使用 JSON 请求/响应格式和基于 JWT 的认证。

## 基础 URL

```
http://localhost:8080/api
```

在使用反向代理（Caddy/Nginx）的生产部署中，API 通常通过前端 URL 代理。

## 响应格式

所有 API 响应遵循一致的 JSON 结构：

### 成功

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 错误

```json
{
  "code": 400,
  "message": "详细错误描述"
}
```

常见错误码：

| 错误码 | 含义 |
|--------|------|
| 400 | 请求错误（验证错误） |
| 401 | 未授权（缺少或无效令牌） |
| 403 | 禁止（权限不足） |
| 404 | 未找到 |
| 500 | 内部服务器错误 |

## API 分类

| 类别 | 基础路径 | 说明 |
|------|----------|------|
| [认证](./authentication) | `/api/auth/*` | 注册、登录、令牌刷新 |
| 项目 | `/api/workspaces/*/projects/*` | CRUD、成员、设置 |
| Issue | `/api/projects/*/issues/*` | CRUD、分配、标签、评论 |
| 面板 | `/api/projects/*/board` | 看板面板状态 |
| Sprint | `/api/projects/*/sprints/*` | Sprint CRUD 和计划 |
| 标签 | `/api/labels/*` | 标签 CRUD |
| 搜索 | `/api/search` | 全文搜索 |
| 提案 | `/api/proposals/*` | 创建、投票、提交、归档 |
| 治理 | `/api/governance/*` | 配置、审计日志 |
| 决策 | `/api/decisions/*` | 决策记录 |
| 信任分 | `/api/trust-scores/*` | 评分、历史、申诉 |
| 否决 | `/api/veto/*` | 否决、升级 |
| AI 代理 | `/api/projects/*/ai-agents/*` | 代理管理 |
| AI 任务 | `/api/projects/*/ai-tasks/*` | 任务分配 |
| Bot Token | `/api/workspaces/*/bots` | Bot Token CRUD |
| 文件上传 | `/api/v1/upload` | 多部分文件上传 |
| Webhook | `/api/workspaces/*/webhooks/*` | Webhook CRUD |
| 管理 | `/api/admin/*` | 系统管理 |

参阅 [端点参考](./endpoints) 获取完整 API 参考。

## Content Type

所有 POST/PUT/PATCH 请求必须使用 `Content-Type: application/json`，文件上传除外，使用 `multipart/form-data`。

## 分页

列表端点支持分页：

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## 全文搜索

搜索端点使用 PostgreSQL 全文搜索，跨 Issue、评论和提案：

```bash
curl "http://localhost:8080/api/search?q=认证+bug" \
  -H "Authorization: Bearer <token>"
```

## 健康检查

API 服务器提供不需要认证的健康端点：

```bash
curl http://localhost:8080/health
```

## 下一步

- [认证](./authentication) -- JWT 认证和 Bot Token
- [端点参考](./endpoints) -- 完整的端点文档
- [MCP 服务器](../mcp-server/) -- AI 友好的 34 工具接口

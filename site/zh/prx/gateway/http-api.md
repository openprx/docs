---
title: HTTP API
description: PRX 网关的 RESTful HTTP API 参考。
---

# HTTP API

PRX 网关暴露 RESTful HTTP API，用于管理 Agent 会话、发送消息和查询系统状态。

## 基础 URL

默认情况下，API 可在 `http://127.0.0.1:3120/api/v1` 访问。

## 端点

### 会话

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/sessions` | 创建新的 Agent 会话 |
| `GET` | `/sessions` | 列出活跃会话 |
| `GET` | `/sessions/:id` | 获取会话详情 |
| `DELETE` | `/sessions/:id` | 终止会话 |

### 消息

| 方法 | 路径 | 描述 |
|------|------|------|
| `POST` | `/sessions/:id/messages` | 向 Agent 发送消息 |
| `GET` | `/sessions/:id/messages` | 获取消息历史 |

### 系统

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/health` | 健康检查 |
| `GET` | `/info` | 系统信息 |
| `GET` | `/metrics` | Prometheus 指标 |

## 认证

API 请求需要 Bearer Token：

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/sessions
```

## 相关页面

- [网关概览](./)
- [WebSocket](./websocket)
- [中间件](./middleware)

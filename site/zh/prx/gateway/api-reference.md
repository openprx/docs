---
title: REST API 完整参考
description: PRX 网关所有 REST API 端点的完整参考，包含请求/响应示例。
---

# REST API 完整参考

本页列出 PRX 网关暴露的所有 REST API 端点，包括请求参数、响应格式和示例。

## 基础信息

- **Base URL**: `http://127.0.0.1:16830/api/v1`
- **认证**: 除 `/health` 外，所有端点需要 Bearer Token
- **内容类型**: `application/json`
- **字符编码**: UTF-8

### 认证方式

```bash
curl -H "Authorization: Bearer <token>" http://localhost:16830/api/v1/...
```

### 通用错误响应

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or expired token"
  }
}
```

| HTTP 状态码 | 说明 |
|-------------|------|
| `400` | 请求参数无效 |
| `401` | 未认证或 Token 无效 |
| `403` | 权限不足 |
| `404` | 资源不存在 |
| `429` | 请求速率超限 |
| `500` | 服务器内部错误 |

## 会话 (Sessions)

### POST /sessions

创建新的 Agent 会话。

**请求**

```bash
curl -X POST http://localhost:16830/api/v1/sessions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "api",
    "user_id": "user_123",
    "system_prompt": "You are a helpful assistant.",
    "model": "claude-sonnet-4-6"
  }'
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `channel` | String | 否 | 渠道标识，默认 `"api"` |
| `user_id` | String | 否 | 用户标识符 |
| `system_prompt` | String | 否 | 覆盖默认系统提示词 |
| `model` | String | 否 | 覆盖默认模型 |

**响应** `201 Created`

```json
{
  "session_id": "ses_abc123def456",
  "created_at": "2026-03-21T10:00:00Z",
  "channel": "api",
  "status": "active"
}
```

### GET /sessions

列出活跃会话。

```bash
curl http://localhost:16830/api/v1/sessions \
  -H "Authorization: Bearer <token>"
```

| 查询参数 | 类型 | 说明 |
|----------|------|------|
| `status` | String | 按状态过滤：`active` / `completed` / `all` |
| `limit` | usize | 最大返回数量（默认 50） |
| `offset` | usize | 分页偏移量 |

**响应** `200 OK`

```json
{
  "sessions": [
    {
      "session_id": "ses_abc123def456",
      "created_at": "2026-03-21T10:00:00Z",
      "channel": "api",
      "status": "active",
      "message_count": 5
    }
  ],
  "total": 1
}
```

### GET /sessions/:id

获取会话详情。

```bash
curl http://localhost:16830/api/v1/sessions/ses_abc123def456 \
  -H "Authorization: Bearer <token>"
```

**响应** `200 OK`

```json
{
  "session_id": "ses_abc123def456",
  "created_at": "2026-03-21T10:00:00Z",
  "channel": "api",
  "status": "active",
  "model": "claude-sonnet-4-6",
  "message_count": 5,
  "total_tokens": 2340
}
```

### DELETE /sessions/:id

终止会话。

```bash
curl -X DELETE http://localhost:16830/api/v1/sessions/ses_abc123def456 \
  -H "Authorization: Bearer <token>"
```

**响应** `204 No Content`

### POST /sessions/:id/messages

向 Agent 发送消息。

```bash
curl -X POST http://localhost:16830/api/v1/sessions/ses_abc123def456/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "帮我分析这段代码的性能问题",
    "attachments": []
  }'
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | String | 是 | 消息文本 |
| `attachments` | Vec\<Attachment\> | 否 | 附件列表（图片、文件等） |

**响应** `200 OK`

```json
{
  "message_id": "msg_xyz789",
  "role": "assistant",
  "content": "我来分析一下这段代码...",
  "tool_calls": [],
  "tokens_used": 156,
  "model": "claude-sonnet-4-6"
}
```

### GET /sessions/:id/messages

获取消息历史。

```bash
curl http://localhost:16830/api/v1/sessions/ses_abc123def456/messages \
  -H "Authorization: Bearer <token>"
```

| 查询参数 | 类型 | 说明 |
|----------|------|------|
| `limit` | usize | 最大返回数量（默认 100） |
| `before` | String | 在此消息 ID 之前 |

## 渠道 (Channels)

### GET /channels

列出已配置的渠道及其状态。

```bash
curl http://localhost:16830/api/v1/channels \
  -H "Authorization: Bearer <token>"
```

**响应** `200 OK`

```json
{
  "channels": [
    {
      "name": "telegram",
      "enabled": true,
      "status": "connected",
      "active_sessions": 3
    },
    {
      "name": "discord",
      "enabled": true,
      "status": "connected",
      "active_sessions": 1
    }
  ]
}
```

### POST /channels/:name/test

测试渠道连通性。

```bash
curl -X POST http://localhost:16830/api/v1/channels/telegram/test \
  -H "Authorization: Bearer <token>"
```

## Webhook

### GET /hooks

列出已注册的 Webhook。

```bash
curl http://localhost:16830/api/v1/hooks \
  -H "Authorization: Bearer <token>"
```

### POST /hooks

注册新的 Webhook。

```bash
curl -X POST http://localhost:16830/api/v1/hooks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/webhook",
    "events": ["session.completed", "error.occurred"],
    "secret": "webhook-secret-key"
  }'
```

### DELETE /hooks/:id

删除 Webhook。

```bash
curl -X DELETE http://localhost:16830/api/v1/hooks/hook_123 \
  -H "Authorization: Bearer <token>"
```

## MCP

### GET /mcp/servers

列出已配置的 MCP 服务器。

```bash
curl http://localhost:16830/api/v1/mcp/servers \
  -H "Authorization: Bearer <token>"
```

**响应** `200 OK`

```json
{
  "servers": [
    {
      "name": "filesystem",
      "status": "running",
      "tools": ["read_file", "write_file", "list_directory"]
    }
  ]
}
```

### GET /mcp/tools

列出所有可用的 MCP 工具。

```bash
curl http://localhost:16830/api/v1/mcp/tools \
  -H "Authorization: Bearer <token>"
```

## 插件 (Plugins)

### GET /plugins

列出已安装的插件。

```bash
curl http://localhost:16830/api/v1/plugins \
  -H "Authorization: Bearer <token>"
```

**响应** `200 OK`

```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "version": "1.0.0",
      "enabled": true,
      "type": "tool",
      "memory_usage_mb": 12
    }
  ]
}
```

### POST /plugins/:name/enable

启用插件。

### POST /plugins/:name/disable

禁用插件。

## Skills

### GET /skills

列出 Agent 可用的 Skills。

```bash
curl http://localhost:16830/api/v1/skills \
  -H "Authorization: Bearer <token>"
```

**响应** `200 OK`

```json
{
  "skills": [
    {
      "name": "code_review",
      "description": "Analyze and review code",
      "tools_required": ["fs_read", "shell"]
    }
  ]
}
```

## 系统状态 (Status)

### GET /health

健康检查（无需认证）。

```bash
curl http://localhost:16830/api/v1/health
```

**响应** `200 OK`

```json
{
  "status": "healthy",
  "version": "0.12.0",
  "uptime_secs": 86400
}
```

### GET /info

系统详细信息。

```bash
curl http://localhost:16830/api/v1/info \
  -H "Authorization: Bearer <token>"
```

**响应** `200 OK`

```json
{
  "version": "0.12.0",
  "build": "2026-03-20T12:00:00Z",
  "default_provider": "anthropic",
  "default_model": "claude-sonnet-4-6",
  "active_sessions": 4,
  "active_channels": 3,
  "plugins_loaded": 2,
  "memory_backend": "sqlite",
  "sandbox_backend": "landlock"
}
```

### GET /metrics

Prometheus 格式指标端点。

```bash
curl http://localhost:16830/api/v1/metrics
```

**响应** `200 OK` (text/plain)

```
# HELP prx_sessions_active Active agent sessions
# TYPE prx_sessions_active gauge
prx_sessions_active 4

# HELP prx_requests_total Total API requests
# TYPE prx_requests_total counter
prx_requests_total{method="POST",path="/sessions"} 142
```

## 配置 (Config)

### GET /config

获取当前运行时配置（敏感字段已脱敏）。

```bash
curl http://localhost:16830/api/v1/config \
  -H "Authorization: Bearer <token>"
```

### POST /config/reload

触发配置热重载。

```bash
curl -X POST http://localhost:16830/api/v1/config/reload \
  -H "Authorization: Bearer <token>"
```

**响应** `200 OK`

```json
{
  "reloaded": true,
  "changes": ["channels_config.telegram.mention_only"]
}
```

## 日志 (Logs)

### GET /logs

查询系统日志。

```bash
curl "http://localhost:16830/api/v1/logs?level=warn&limit=50" \
  -H "Authorization: Bearer <token>"
```

| 查询参数 | 类型 | 说明 |
|----------|------|------|
| `level` | String | 最低日志级别：`debug` / `info` / `warn` / `error` |
| `limit` | usize | 最大返回条数（默认 100） |
| `since` | String | 起始时间（ISO 8601） |
| `component` | String | 组件过滤（如 `agent`, `gateway`, `memory`） |

## 相关文档

- [网关概览](./)
- [HTTP API](./http-api) -- 快速参考
- [WebSocket](./websocket) -- 实时双向通信
- [Webhook](./webhooks) -- 出站事件通知
- [中间件](./middleware) -- 认证、速率限制、CORS
- [完整配置参考](/zh/prx/config/reference)

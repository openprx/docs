---
title: Webhook
description: PRX 事件和集成的出站 Webhook 通知。
---

# Webhook

PRX 支持出站 Webhook，在 Agent 事件发生时通知外部服务。Webhook 支持与 CI/CD 系统、监控工具和自定义工作流的集成。

## 概述

配置后，PRX 在特定事件发生时向注册的 Webhook URL 发送 HTTP POST 请求：

- **session.created** -- 新的 Agent 会话已启动
- **session.completed** -- Agent 会话已完成
- **tool.executed** -- 工具已调用并完成
- **error.occurred** -- 遇到错误

## 配置

```toml
[[gateway.webhooks]]
url = "https://example.com/webhook"
secret = "your-webhook-secret"
events = ["session.completed", "error.occurred"]
timeout_secs = 10
max_retries = 3
```

## 负载格式

Webhook 负载是带有标准字段的 JSON 对象：

```json
{
  "event": "session.completed",
  "timestamp": "2026-03-21T10:00:00Z",
  "data": { }
}
```

## 签名验证

每个 Webhook 请求包含 `X-PRX-Signature` 头，其中包含使用配置密钥对负载的 HMAC-SHA256 签名。

## 相关页面

- [网关概览](./)
- [HTTP API](./http-api)

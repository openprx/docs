---
title: 网关
description: PRX 网关层概览，提供 HTTP API、WebSocket 和 Webhook 接口。
---

# 网关

PRX 网关是面向网络的层，通过多种协议暴露 Agent 能力。它提供 HTTP REST API、用于实时流式传输的 WebSocket 连接，以及用于事件驱动集成的 Webhook 端点。

## 概述

网关作为 PRX 守护进程的一部分运行，处理：

- **HTTP API** -- 用于会话管理、工具执行和配置的 RESTful 端点
- **WebSocket** -- 用于实时 Agent 交互的双向流
- **Webhook** -- 用于集成的出站事件通知
- **中间件** -- 认证、速率限制、CORS 和请求日志

## 架构

```
┌─────────────────────────────────┐
│             网关                 │
│  ┌──────────┐  ┌─────────────┐  │
│  │ HTTP API │  │  WebSocket  │  │
│  └────┬─────┘  └──────┬──────┘  │
│       │               │         │
│  ┌────┴───────────────┴──────┐  │
│  │        中间件栈            │  │
│  └────────────┬──────────────┘  │
│               │                  │
│  ┌────────────┴──────────────┐  │
│  │       Agent 运行时         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## 配置

```toml
[gateway]
bind = "127.0.0.1:3120"
tls_cert = ""
tls_key = ""

[gateway.cors]
allowed_origins = ["*"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
```

## 相关页面

- [HTTP API](./http-api)
- [WebSocket](./websocket)
- [Webhook](./webhooks)
- [中间件](./middleware)

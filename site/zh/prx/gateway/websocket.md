---
title: WebSocket
description: 用于实时流式 Agent 交互的 WebSocket 接口。
---

# WebSocket

PRX 网关提供 WebSocket 端点，用于与 Agent 会话进行实时双向通信。这支持流式响应、实时工具执行更新和交互式对话。

## 连接

连接到 WebSocket 端点：

```
ws://127.0.0.1:3120/ws/sessions/:id
```

## 消息协议

消息以带 `type` 字段的 JSON 对象交换：

### 客户端到服务端

- `message` -- 发送用户消息
- `cancel` -- 取消当前 Agent 操作
- `ping` -- 保活心跳

### 服务端到客户端

- `token` -- 流式响应 token
- `tool_call` -- Agent 正在调用工具
- `tool_result` -- 工具执行完成
- `done` -- Agent 响应完成
- `error` -- 发生错误
- `pong` -- 保活响应

## 配置

```toml
[gateway.websocket]
max_connections = 100
ping_interval_secs = 30
max_message_size_kb = 1024
```

## 相关页面

- [网关概览](./)
- [HTTP API](./http-api)

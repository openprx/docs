# OpenPR-Webhook

OpenPR-Webhook 是 [OpenPR](https://github.com/openprx/openpr) 平台的 Webhook 事件分发服务。它接收来自 OpenPR 的 Webhook 事件，根据机器人上下文过滤后，将事件路由到一个或多个已配置的代理（Agent）进行处理。

## 核心功能

当 OpenPR 平台发生事件（如创建或更新工单）时，平台会向本服务发送 Webhook POST 请求。OpenPR-Webhook 随后执行以下流程：

1. **验证请求** -- 使用 HMAC-SHA256 签名校验请求合法性
2. **过滤事件** -- 仅处理 `bot_context.is_bot_task = true` 的事件
3. **路由到代理** -- 根据名称或类型匹配已配置的代理
4. **执行分发** -- 执行代理动作（发送消息、调用 CLI 工具、转发到其他 Webhook 等）

## 架构概览

```
OpenPR 平台
    |
    | POST /webhook (HMAC-SHA256 签名)
    v
+-------------------+
| openpr-webhook    |
|                   |
| 签名验证          |
| 事件过滤          |
| 代理匹配          |
+-------------------+
    |           |           |
    v           v           v
 openclaw    webhook     cli 代理
 (Signal/    (HTTP       (codex /
  Telegram)  转发)       claude-code)
```

## 核心特性

- **HMAC-SHA256 签名验证** -- 支持多密钥轮换的入站 Webhook 签名校验
- **机器人任务过滤** -- 自动忽略非机器人任务的事件
- **5 种代理/执行器类型** -- openclaw、openprx、webhook、custom、cli
- **消息模板** -- 支持占位符变量的灵活通知格式化
- **状态转换** -- 任务开始、成功或失败时自动更新工单状态
- **WSS 隧道**（Phase B） -- 与控制面建立持久 WebSocket 连接，支持推送式任务下发
- **安全优先的默认值** -- 危险功能（隧道、CLI、回调）默认关闭，需显式开启特性标志

## 支持的代理类型

| 类型 | 用途 | 协议 |
|------|------|------|
| `openclaw` | 通过 OpenClaw CLI 发送 Signal/Telegram 通知 | Shell 命令 |
| `openprx` | 通过 OpenPRX Signal API 或 CLI 发送消息 | HTTP API / Shell |
| `webhook` | 将完整事件负载转发到 HTTP 端点 | HTTP POST |
| `custom` | 执行自定义 Shell 命令 | Shell 命令 |
| `cli` | 运行 AI 编码代理处理工单（codex、claude-code、opencode） | 子进程 |

## 快速导航

- [安装指南](getting-started/installation.md)
- [快速上手](getting-started/quickstart.md)
- [代理类型](agents/index.md)
- [执行器详解](agents/executors.md)
- [WSS 隧道](tunnel/index.md)
- [配置参考](configuration/index.md)
- [故障排查](troubleshooting/index.md)

## 代码仓库

源码地址: [github.com/openprx/openpr-webhook](https://github.com/openprx/openpr-webhook)

许可证: MIT OR Apache-2.0

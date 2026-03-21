---
title: 消息发送
description: PRX 的消息工具通过 message_send 和 gateway 实现多渠道消息发送，支持文本、媒体和语音消息的自动路由。
---

# 消息发送

PRX 的消息工具使 Agent 能够通过各种通信渠道发送消息。`message_send` 是高层抽象工具，自动路由到当前活跃的通信渠道（Telegram、Discord、WhatsApp、iMessage 等）；`gateway` 是底层工具，直接通过 Axum HTTP/WebSocket 网关发送原始消息。

消息工具是 PRX 作为个人 AI 助手的核心能力之一。Agent 不仅能在对话中回复用户，还能主动发送通知、定期报告、提醒和告警。结合定时任务工具，Agent 可以实现"每天早上发送天气预报"、"代码构建失败时发送告警"等自动化消息场景。

`message_send` 在渠道活跃时自动注册，`gateway` 在 `all_tools()` 模式下始终可用。

## 配置

消息工具的行为由渠道配置决定。以下是常见渠道的配置示例：

```toml
# Telegram 渠道
[channels.telegram]
enabled = true
bot_token = "123456:ABC-DEF..."
allowed_chat_ids = [12345678, -1001234567890]

# Discord 渠道
[channels.discord]
enabled = true
bot_token = "MTIzNDU2..."
guild_id = "123456789"

# 网关配置
[gateway]
host = "0.0.0.0"
port = 3120
websocket_enabled = true
cors_origins = ["http://localhost:3000"]
```

工具策略控制：

```toml
[security.tool_policy.tools]
message_send = "allow"     # 允许消息发送
gateway = "supervised"     # 底层网关操作需审批
```

## 使用方法

### message_send — 发送消息

发送文本消息到当前渠道：

```json
{
  "tool": "message_send",
  "arguments": {
    "content": "构建完成！所有测试通过，共 142 个测试用例。",
    "type": "text"
  }
}
```

发送到指定渠道和接收者：

```json
{
  "tool": "message_send",
  "arguments": {
    "content": "紧急：服务器 CPU 使用率超过 90%",
    "channel": "telegram",
    "recipient": "12345678",
    "type": "text"
  }
}
```

发送媒体消息：

```json
{
  "tool": "message_send",
  "arguments": {
    "type": "media",
    "media_path": "/tmp/screenshot.png",
    "caption": "当前系统监控截图"
  }
}
```

发送语音消息：

```json
{
  "tool": "message_send",
  "arguments": {
    "type": "voice",
    "content": "今天天气晴朗，最高温度 25 度。",
    "voice_provider": "tts"
  }
}
```

### gateway — 底层网关访问

通过 HTTP 网关发送原始消息：

```json
{
  "tool": "gateway",
  "arguments": {
    "action": "send",
    "method": "POST",
    "path": "/api/messages",
    "body": {
      "channel": "telegram",
      "chat_id": "12345678",
      "text": "来自 Agent 的消息",
      "parse_mode": "Markdown"
    }
  }
}
```

通过 WebSocket 推送：

```json
{
  "tool": "gateway",
  "arguments": {
    "action": "ws_send",
    "topic": "notifications",
    "data": {
      "type": "alert",
      "message": "磁盘空间不足",
      "level": "warning"
    }
  }
}
```

## 参数

### message_send 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `content` | string | 条件 | — | 消息内容（`text` 和 `voice` 类型必填） |
| `type` | string | 否 | `"text"` | 消息类型：`text`、`media`、`voice` |
| `channel` | string | 否 | 当前渠道 | 目标渠道名称（如 `telegram`、`discord`） |
| `recipient` | string | 否 | 当前对话 | 接收者 ID |
| `media_path` | string | 条件 | — | 媒体文件路径（`media` 类型必填） |
| `caption` | string | 否 | — | 媒体附件的说明文字 |
| `parse_mode` | string | 否 | — | 文本解析模式（`Markdown`、`HTML`） |
| `voice_provider` | string | 否 | `"tts"` | 语音合成提供商 |

### gateway 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型：`send`（HTTP）、`ws_send`（WebSocket） |
| `method` | string | 条件 | HTTP 方法（`send` 操作必填） |
| `path` | string | 条件 | API 路径（`send` 操作必填） |
| `body` | object | 否 | 请求体 |
| `topic` | string | 条件 | WebSocket 主题（`ws_send` 操作必填） |
| `data` | object | 条件 | WebSocket 数据（`ws_send` 操作必填） |

## 消息路由

`message_send` 的自动路由逻辑：

```
message_send 调用
  │
  ├─ 指定了 channel？
  │     是 → 路由到指定渠道
  │     否 → 使用当前活跃渠道
  │
  ├─ 指定了 recipient？
  │     是 → 发送到指定接收者
  │     否 → 发送到当前对话
  │
  └─ 根据 type 选择发送方式
        text  → 纯文本消息
        media → 文件/图片附件
        voice → TTS 转语音后发送
```

### 支持的渠道

| 渠道 | 标识 | 消息类型 |
|------|------|----------|
| Telegram | `telegram` | text、media、voice |
| Discord | `discord` | text、media |
| WhatsApp | `whatsapp` | text、media |
| WhatsApp Web | `whatsapp_web` | text、media |
| iMessage | `imessage` | text、media |
| Signal | `signal` | text、media |
| Matrix | `matrix` | text、media |
| Email | `email` | text（HTML）、media（附件） |
| CLI | `cli` | text |
| Lark | `lark` | text、media |
| DingTalk | `dingtalk` | text、media |

## 安全性

### 消息发送控制

消息发送可能泄露 Agent 处理的信息。安全建议：

| 风险 | 说明 | 缓解措施 |
|------|------|----------|
| 信息泄露 | Agent 可能将敏感信息发送到不当渠道 | 限制可用渠道和接收者 |
| 垃圾消息 | Agent 可能发送过多消息 | 速率限制 |
| 社会工程 | Agent 可能被诱导发送误导性消息 | 监督模式 |

### 渠道权限

通过 `allowed_chat_ids`（Telegram）等渠道级配置限制消息接收者：

```toml
[channels.telegram]
allowed_chat_ids = [12345678]  # 仅允许向指定聊天发送
```

### 网关安全

`gateway` 工具提供底层网关访问，安全风险更高。建议：

```toml
[security.tool_policy.tools]
gateway = "supervised"    # 底层操作需审批
```

网关支持 CORS 配置，限制 WebSocket 连接的来源：

```toml
[gateway]
cors_origins = ["http://localhost:3000"]
```

### 语音消息安全

语音消息涉及 TTS（文字转语音）处理。PRX 自动处理 MP3 生成和 M4A 转换，但需注意：

- TTS 可能调用外部 API（如 OpenAI TTS）
- 生成的音频文件存储在临时目录
- 发送完成后自动清理临时文件

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [渠道概览](/zh/prx/channels/) — 所有支持的通信渠道
- [Telegram 渠道](/zh/prx/channels/telegram/) — Telegram Bot 配置
- [Discord 渠道](/zh/prx/channels/discord/) — Discord Bot 配置
- [网关概览](/zh/prx/gateway/) — HTTP/WebSocket 网关架构
- [WebSocket](/zh/prx/gateway/websocket/) — WebSocket 协议和消息格式

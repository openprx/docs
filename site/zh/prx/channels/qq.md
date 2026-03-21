---
title: QQ 频道
description: 将 PRX 连接到 QQ 官方机器人平台，支持 QQ 频道和群聊消息。
---

# QQ 频道

> 通过 QQ 官方机器人 API 将 PRX 接入 QQ，支持频道消息、私信和富文本内容。

## 概述

QQ 渠道基于腾讯 QQ 开放平台官方 Bot API 实现，通过 WebSocket 长连接接收消息事件，并通过 HTTP API 发送回复。与其他国内渠道类似，QQ 渠道使用 Stream 模式，无需公网回调地址。

主要特性：

- **频道消息** -- 在 QQ 频道（Guild）的子频道中接收和回复消息
- **群聊支持** -- 支持 QQ 群中的 @机器人 交互
- **私信对话** -- 支持与用户的一对一私信
- **富文本消息** -- 支持 Markdown、Embed 和 Ark 模板消息
- **事件驱动** -- 基于 WebSocket Gateway 的实时事件推送

## 前置条件

- QQ 开放平台账号（[QQ 开放平台](https://q.qq.com/)）
- 已创建的 QQ 机器人应用
- 应用的 AppID 和 Token（或 AppSecret）
- PRX 守护进程已运行

## 快速配置

### 1. 创建机器人

1. 登录 [QQ 开放平台](https://q.qq.com/)
2. 进入 **机器人** > **创建机器人**
3. 填写机器人信息，选择使用场景（频道/群聊/私信）
4. 在 **开发设置** 中获取 **AppID** 和 **Token**
5. 如需沙箱测试，在 **沙箱配置** 中添加测试频道

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.qq]
app_id = "102012345"
token = "your-bot-token-here"
app_secret = "your-app-secret"
sandbox = false
allowed_users = ["*"]
mention_only = true
intents = ["guild_messages", "direct_messages", "group_messages"]
```

也可以通过环境变量设置凭据：

```bash
export OPENPRX_QQ_APP_ID="102012345"
export OPENPRX_QQ_TOKEN="your-bot-token-here"
export OPENPRX_QQ_APP_SECRET="your-app-secret"
```

### 3. 验证

```bash
prx channel doctor qq
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `app_id` | String | 必填 | QQ 机器人的 AppID |
| `token` | String | 必填 | QQ 机器人的 Token |
| `app_secret` | String | 必填 | QQ 机器人的 AppSecret，用于鉴权 |
| `sandbox` | bool | `false` | 是否使用沙箱环境（测试用） |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的用户 openid 列表（`"*"` 允许全部） |
| `mention_only` | bool | `true` | 在频道/群聊中是否只响应 @机器人 的消息 |
| `intents` | Vec\<String\> | `["guild_messages"]` | 订阅的事件类型列表 |
| `reply_as_reference` | bool | `true` | 回复时是否引用原消息 |
| `message_format` | String | `"text"` | 默认消息格式：`"text"` / `"markdown"` / `"embed"` |

### Intent 事件类型

| Intent | 说明 |
|--------|------|
| `guild_messages` | 频道消息事件（公域机器人需要审核） |
| `direct_messages` | 私信消息事件 |
| `group_messages` | QQ 群消息事件 |
| `guild_message_reactions` | 频道消息表情回应事件 |
| `interaction` | 按钮交互事件 |

## 功能特性

- **WebSocket Gateway** -- 使用 QQ 官方 WebSocket 网关接收事件，自动维护心跳和断线重连
- **频道和群聊** -- 同时支持 QQ 频道子频道消息和 QQ 群消息
- **私信** -- 支持 DMS（Direct Message Session）一对一私信
- **富文本** -- 支持发送 Markdown 格式、Embed 卡片和 Ark 模板消息
- **配对认证** -- 支持 `prx channel pair qq` 进行安全配对
- **沙箱模式** -- 开发阶段可启用沙箱环境，仅对指定频道生效

## 消息格式

### 纯文本

```toml
message_format = "text"
```

### Markdown

QQ 频道支持有限的 Markdown 子集（加粗、斜体、链接等）：

```toml
message_format = "markdown"
```

### Embed 卡片

适合结构化信息展示：

```toml
message_format = "embed"
```

## 限制

- QQ Bot API 对消息发送有速率限制（频道约 5 条/秒，私信约 2 条/秒）
- 公域机器人（非私域）在频道中发送消息需通过审核
- 群消息仅在用户主动 @机器人 后机器人才能回复（被动回复模式）
- 群消息的被动回复有效期为 5 分钟，超时后无法回复
- 单条消息最大长度受 QQ API 限制
- 沙箱环境仅对配置的测试频道生效

## 故障排除

**机器人无响应**

1. 检查 `app_id`、`token` 和 `app_secret` 是否正确
2. 确认 `intents` 中包含了需要的事件类型
3. 运行 `prx channel doctor qq` 查看诊断信息
4. 检查网络连接是否正常（QQ API 需要访问 `api.sgroup.qq.com`）

**频道中不回复**

- 如果启用了 `mention_only = true`，需要在消息中 @机器人
- 公域机器人检查是否已通过消息审核
- 确认机器人已被添加到目标频道

**群聊中不回复**

- QQ 群消息为被动回复模式，用户必须先 @机器人
- 检查 `intents` 中是否包含 `"group_messages"`
- 确认机器人已被添加到目标 QQ 群

**沙箱模式问题**

- 设置 `sandbox = true` 后，仅在沙箱配置中添加的频道内可用
- 正式环境需设置 `sandbox = false` 并完成审核

## 相关文档

- [消息渠道概览](./)
- [钉钉](./dingtalk)
- [飞书 / Lark](./lark)
- [配对认证](/zh/prx/security/pairing)
- [完整配置参考](/zh/prx/config/reference)

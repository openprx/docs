---
title: Discord 机器人
description: 将 PRX 连接到 Discord 机器人渠道
---

# Discord 机器人

> 通过 Discord Bot API 将 PRX 接入 Discord 服务器，支持私聊、频道消息和 @提及过滤。

## 前置条件

- 一个 Discord 账号
- 在 [Discord Developer Portal](https://discord.com/developers/applications) 创建的应用和 Bot Token
- PRX 守护进程已运行

## 快速配置

### 1. 获取 Bot Token

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications)
2. 点击 **New Application**，填入名称并创建
3. 进入左侧 **Bot** 页面，点击 **Reset Token** 获取 Token
4. 在 **Privileged Gateway Intents** 中启用 **Message Content Intent**
5. 进入 **OAuth2 > URL Generator**，勾选 `bot` 权限并选择所需权限
6. 使用生成的 URL 邀请 Bot 到你的服务器

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.discord]
bot_token = "MTIzNDU2Nzg5..."
guild_id = "123456789012345678"
allowed_users = ["your_discord_user_id"]
listen_to_bots = false
mention_only = false
```

### 3. 验证

```bash
prx channel doctor discord
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bot_token` | String | 必填 | Discord Bot Token（来自 Developer Portal） |
| `guild_id` | String? | `null` | 限制 Bot 仅在指定服务器内工作 |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的 Discord 用户 ID 列表 |
| `listen_to_bots` | bool | `false` | 是否处理其他 Bot 发送的消息 |
| `mention_only` | bool | `false` | 在服务器频道中是否只响应 @bot 的消息 |

## 功能特性

- **服务器和私聊** — 同时支持服务器频道和 DM 私聊
- **@提及过滤** — 可配置为仅响应 @提及 的消息，避免干扰
- **Bot 消息过滤** — 默认忽略其他 Bot 的消息，防止循环
- **Guild 隔离** — 可限制 Bot 仅在指定服务器工作

## 限制

- 需要在 Developer Portal 中手动启用 **Message Content Intent**
- Discord 对消息发送有速率限制
- 单条消息最大 2000 字符，超长响应会自动分割

## 故障排除

**Bot 在线但不响应消息**

1. 确认已启用 **Message Content Intent**
2. 检查 `allowed_users` 是否包含你的 Discord 用户 ID（非用户名）
3. 如果在群组中，检查 `mention_only` 设置

**Bot 不在线**

- 确认 `bot_token` 正确
- 运行 `prx channel doctor discord` 检查连接状态
- 检查 PRX 守护进程日志：`prx daemon logs --follow`

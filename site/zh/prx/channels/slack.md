---
title: Slack 应用
description: 将 PRX 连接到 Slack 工作区
---

# Slack 应用

> 通过 Slack Bot OAuth Token 和 Socket Mode 将 PRX 接入 Slack 工作区。

## 前置条件

- 一个 Slack 工作区的管理员权限
- 在 [Slack API](https://api.slack.com/apps) 创建的应用
- PRX 守护进程已运行

## 快速配置

### 1. 获取凭证

1. 前往 [Slack API](https://api.slack.com/apps) 点击 **Create New App**
2. 在 **OAuth & Permissions** 中添加 Bot Token Scopes：`chat:write`、`channels:history`、`groups:history`、`im:history`、`app_mentions:read`
3. 安装应用到工作区，获取 **Bot User OAuth Token**（`xoxb-...`）
4. 在 **Basic Information > App-Level Tokens** 中创建 Token（需 `connections:write` 权限），获取 `xapp-...` Token
5. 在 **Socket Mode** 中启用 Socket Mode

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.slack]
bot_token = "xoxb-..."
app_token = "xapp-..."
channel_id = "C0123456789"
allowed_users = ["U0123456789"]
mention_only = false
```

### 3. 验证

```bash
prx channel doctor slack
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bot_token` | String | 必填 | Slack Bot OAuth Token（`xoxb-...`） |
| `app_token` | String? | `null` | Slack App-Level Token（`xapp-...`），用于 Socket Mode |
| `channel_id` | String? | `null` | 限制 Bot 仅在指定频道工作 |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的 Slack 用户 ID 列表 |
| `mention_only` | bool | `false` | 在频道中是否只响应 @bot 的消息 |

## 功能特性

- **Socket Mode** — 通过 WebSocket 接收事件，无需公网 URL
- **频道和私聊** — 支持公共频道、私有频道和 DM
- **@提及过滤** — 可配置为仅响应 @提及 消息
- **频道隔离** — 可限制 Bot 仅在指定频道工作

## 限制

- Socket Mode 需要 App-Level Token
- 单条消息最大 40,000 字符（含格式化标记）
- 需要工作区管理员批准应用安装

## 故障排除

**Bot 未响应**

1. 确认 Socket Mode 已启用
2. 检查 `app_token` 是否正确（必须是 `xapp-` 开头）
3. 确认 Bot 已被邀请到目标频道

**权限不足**

- 检查 Bot Token Scopes 是否包含所需权限
- 重新安装应用到工作区以应用新权限

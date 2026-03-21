---
title: Mattermost
description: 将 PRX 连接到 Mattermost 团队协作平台
---

# Mattermost

> 通过 Mattermost Bot API 将 PRX 接入自托管或云端的 Mattermost 实例。

## 前置条件

- 一个 Mattermost 实例（自托管或 Mattermost Cloud）
- 系统管理员权限（用于创建 Bot 账号）
- PRX 守护进程已运行

## 快速配置

### 1. 创建 Bot 账号

1. 在 Mattermost 中进入 **系统控制台 > 集成 > Bot 账号**
2. 启用 Bot 账号功能
3. 进入 **集成 > Bot 账号 > 添加 Bot 账号**
4. 记录生成的 Bot Access Token

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.mattermost]
url = "https://mattermost.example.com"
bot_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
channel_id = "abc123def456"
allowed_users = ["user_id_1"]
thread_replies = true
mention_only = false
```

### 3. 验证

```bash
prx channel doctor mattermost
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `url` | String | 必填 | Mattermost 服务器 URL |
| `bot_token` | String | 必填 | Bot Access Token |
| `channel_id` | String? | `null` | 限制 Bot 仅在指定频道工作 |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的用户 ID 列表 |
| `thread_replies` | bool? | `null` | 回复时是否使用消息线程 |
| `mention_only` | bool? | `null` | 在频道中是否只响应 @bot 的消息 |

## 功能特性

- **自托管** — 完美适配 Mattermost 自托管环境，数据不出企业
- **WebSocket 实时通信** — 通过 WebSocket 实时接收消息事件
- **消息线程** — 支持在消息线程中回复，保持对话上下文
- **频道隔离** — 可限制 Bot 仅在指定频道工作

## 限制

- 需要系统管理员权限创建 Bot 账号
- 不支持 Mattermost 的 Playbooks 和 Boards 集成

## 故障排除

**无法连接服务器**

1. 确认 `url` 正确且可达
2. 检查 `bot_token` 是否有效
3. 确认 Mattermost 的 WebSocket 端口已开放

**消息线程不生效**

- 确认 `thread_replies = true`
- 部分旧版 Mattermost 可能对线程回复的 API 支持不完善

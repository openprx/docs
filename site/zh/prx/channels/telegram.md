---
title: Telegram 机器人
description: 将 PRX 连接到 Telegram 机器人渠道
---

# Telegram 机器人

> 通过 Telegram Bot API 将 PRX 接入 Telegram，支持私聊、群聊、流式输出和媒体消息。

## 前置条件

- 一个 Telegram 账号
- 通过 [@BotFather](https://t.me/BotFather) 创建的 Bot Token
- PRX 守护进程已运行

## 快速配置

### 1. 获取 Bot Token

1. 在 Telegram 中搜索 `@BotFather` 并打开对话
2. 发送 `/newbot`，按提示设置 bot 名称和用户名
3. 记录返回的 Bot Token（格式如 `123456789:ABCdefGHI...`）

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.telegram]
bot_token = "123456789:ABCdefGHI..."
allowed_users = ["your_username"]
stream_mode = "edit"
draft_update_interval_ms = 1000
interrupt_on_new_message = false
mention_only = false
```

也可以通过环境变量设置 Token：

```bash
export OPENPRX_TELEGRAM_BOT_TOKEN="123456789:ABCdefGHI..."
```

### 3. 验证

```bash
prx channel doctor telegram
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bot_token` | String | 必填 | Telegram Bot API Token（来自 @BotFather） |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的 Telegram 用户名或用户 ID 列表 |
| `stream_mode` | String | `"none"` | 流式输出模式：`"none"` / `"edit"` / `"live"` |
| `draft_update_interval_ms` | u64 | `1000` | 流式编辑消息的最小间隔（毫秒），避免触发速率限制 |
| `interrupt_on_new_message` | bool | `false` | 同一用户发新消息时是否取消正在处理的请求 |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @bot 的消息 |

## 功能特性

- **流式输出** — 支持通过消息编辑实时展示 LLM 生成进度
- **媒体消息** — 支持接收和发送图片、文件、语音消息
- **群聊支持** — 可配置为仅响应 @提及 的消息
- **中断机制** — 用户发送新消息可自动取消当前处理中的请求
- **配对认证** — 支持 `prx channel pair telegram` 进行安全配对

## 限制

- Telegram Bot API 对消息编辑有速率限制（约每秒 1 次），`draft_update_interval_ms` 不宜设置过低
- 单条消息最大长度 4096 字符，超长响应会自动分割
- Bot 无法主动发起对话，需用户先发送消息

## 故障排除

**Bot 无响应**

1. 检查 `bot_token` 是否正确
2. 确认 `allowed_users` 中包含你的用户名或 ID
3. 运行 `prx channel doctor telegram` 查看诊断信息

**群聊中 Bot 不回复**

- 如果启用了 `mention_only = true`，需要在消息中 @bot
- 确认 Bot 已被添加到群组且具有读取消息权限

**消息延迟较大**

- 检查网络连接是否畅通（Telegram API 需要访问外网）
- 如果使用代理，请在 `[proxy]` 中配置

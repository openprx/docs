---
title: prx channel — 渠道管理
description: 管理 OpenPRX 消息渠道，支持添加、删除、列出、诊断和启动操作。
---

# prx channel

管理 OpenPRX 的消息渠道。渠道是连接 OpenPRX 到各消息平台（Telegram/Discord/Slack/WhatsApp/Matrix/iMessage/Email 等）的桥梁。

## 用法

```bash
prx channel <COMMAND>
```

## 子命令

| 子命令 | 说明 |
|--------|------|
| `list` | 列出所有已配置的渠道 |
| `start` | 启动所有已配置的渠道 |
| `doctor` | 对所有已配置的渠道运行健康检查 |
| `add <TYPE> <CONFIG>` | 添加新渠道 |
| `remove <NAME>` | 删除指定渠道 |
| `bind-telegram <IDENTITY>` | 将 Telegram 身份绑定到允许列表 |

## prx channel list

列出所有已配置的渠道及其状态。

```bash
prx channel list
```

## prx channel start

启动所有已配置的渠道连接。通常不需要手动调用，`prx daemon` 会自动启动所有渠道。

```bash
prx channel start
```

## prx channel doctor

对所有已配置的渠道运行健康检查，验证 Token 有效性、网络连通性等。

```bash
prx channel doctor
```

## prx channel add

添加新的消息渠道。

```bash
prx channel add <TYPE> <CONFIG>
```

### 参数

| 参数 | 说明 |
|------|------|
| `TYPE` | 渠道类型：telegram/discord/slack/whatsapp/matrix/imessage/email |
| `CONFIG` | JSON 格式的渠道配置 |

### 示例

#### 添加 Telegram 渠道

```bash
prx channel add telegram '{"bot_token":"123456:ABC-DEF","name":"my-bot"}'
```

#### 添加 Discord 渠道

```bash
prx channel add discord '{"bot_token":"MTIz...","name":"my-discord-bot"}'
```

#### 添加 Slack 渠道

```bash
prx channel add slack '{"bot_token":"xoxb-...","app_token":"xapp-...","name":"my-slack-bot"}'
```

## prx channel remove

删除已配置的渠道。

```bash
prx channel remove <NAME>
```

### 示例

```bash
prx channel remove my-bot
```

## prx channel bind-telegram

将 Telegram 用户身份（用户名或数字 ID）添加到允许列表。只有在允许列表中的用户才能与 Bot 交互。

```bash
prx channel bind-telegram <IDENTITY>
```

### 参数

| 参数 | 说明 |
|------|------|
| `IDENTITY` | Telegram 用户名（不含 `@`）或数字用户 ID |

### 示例

```bash
# 按用户名绑定
prx channel bind-telegram john_doe

# 按数字 ID 绑定
prx channel bind-telegram 123456789
```

## 支持的渠道类型

| 类型 | 说明 | 配置要点 |
|------|------|----------|
| `telegram` | Telegram Bot | `bot_token` |
| `discord` | Discord Bot | `bot_token` |
| `slack` | Slack App | `bot_token` + `app_token` |
| `whatsapp` | WhatsApp Business | 需 Cloud API 配置 |
| `matrix` | Matrix/Element | homeserver + token |
| `imessage` | iMessage | macOS 专用 |
| `email` | 邮件 | IMAP/SMTP 配置 |

完整渠道配置说明请参阅 [消息渠道](../channels/) 文档。

## 相关链接

- [消息渠道](../channels/) — 19 个渠道的详细配置指南
- [prx daemon](./daemon) — 守护进程（自动启动渠道）
- [prx onboard](./onboard) — 通过向导配置渠道
- [prx doctor](./doctor) — 系统诊断

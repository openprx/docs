---
title: 消息渠道概述
description: PRX 支持 19 个消息渠道，覆盖国内外主流通讯平台。统一的渠道抽象层让你一次配置、全平台可用。
---

# 消息渠道

PRX 的消息渠道（Channel）是连接 AI 助手与用户的桥梁。通过统一的渠道抽象层，PRX 将 19 个不同平台的消息协议归一化，让 Agent 逻辑只需编写一次，就能在所有平台上运行。

## 什么是消息渠道

消息渠道是 PRX 与外部通讯平台之间的适配器。每个渠道负责：

- **消息收发** — 接收用户消息、发送 Agent 回复
- **协议转换** — 将平台特有的消息格式转换为 PRX 内部统一格式
- **媒体处理** — 处理图片、文件、语音等多媒体内容
- **身份管理** — 管理用户身份、配对认证和权限
- **会话管理** — 维护私聊和群聊的会话状态

## 渠道对比矩阵

| 渠道 | 私聊 | 群聊 | 媒体 | 语音 | 端到端加密 | 平台 |
|:-----|:----:|:----:|:----:|:----:|:----------:|:-----|
| [Telegram](./telegram) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | 跨平台 |
| [Discord](./discord) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | 跨平台 |
| [Slack](./slack) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | 跨平台 |
| [WhatsApp](./whatsapp) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | 跨平台 |
| [WhatsApp Web](./whatsapp-web) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | 跨平台 |
| [Signal](./signal) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | 跨平台 |
| [iMessage](./imessage) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: | macOS |
| [Matrix](./matrix) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | 跨平台 |
| [邮件 (IMAP/SMTP)](./email) | :white_check_mark: | :x: | :white_check_mark: | :x: | :x: | 跨平台 |
| [飞书 / Lark](./lark) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | 跨平台 |
| [钉钉](./dingtalk) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | 跨平台 |
| [Mattermost](./mattermost) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | 跨平台 |
| [Nextcloud Talk](./nextcloud-talk) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: | 跨平台 |
| [IRC](./irc) | :white_check_mark: | :white_check_mark: | :x: | :x: | :x: | 跨平台 |
| [LINQ](./linq) | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | 跨平台 |
| [命令行 (CLI)](./cli) | :white_check_mark: | :x: | :x: | :x: | :x: | 本地 |
| Gateway API | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: | :x: | HTTP/WS |
| Webhook (入站) | :white_check_mark: | :x: | :white_check_mark: | :x: | :x: | HTTP |
| Webhook (出站) | :white_check_mark: | :x: | :white_check_mark: | :x: | :x: | HTTP |

## 渠道成熟度

每个渠道标注了当前的成熟度状态：

### 稳定

生产环境可用，经过充分测试：

- Telegram
- Discord
- Slack
- Matrix
- CLI
- 邮件 (IMAP/SMTP)
- Gateway API

### 测试

功能完整，正在进行更广泛的测试：

- WhatsApp
- WhatsApp Web
- Signal
- 飞书 / Lark
- 钉钉
- Mattermost
- IRC
- Webhook (入站/出站)

### 实验

基本功能可用，API 可能变化：

- iMessage（需要 macOS + 特定权限）
- Nextcloud Talk
- LINQ

## 通用配置模式

所有渠道遵循统一的配置模式。在 `~/.config/openprx/openprx.toml` 中添加渠道配置：

### 基础配置

```toml
[channels.telegram]
# 是否启用此渠道
enabled = true

# Token / 凭据（通过环境变量引用，不明文存储）
token_env = "TELEGRAM_BOT_TOKEN"

# DM（私聊）策略
dm_policy = "pairing"

# 群聊行为
group_mode = "mention"       # mention: @提及时回复, all: 所有消息, none: 不回复

# 速率限制
rate_limit_rpm = 60          # 每分钟最大请求数
rate_limit_burst = 10        # 突发请求上限
```

### 多渠道配置示例

```toml
# ─── Telegram ──────────────────────────────
[channels.telegram]
enabled = true
token_env = "TELEGRAM_BOT_TOKEN"
dm_policy = "pairing"
group_mode = "mention"

# ─── Discord ──────────────────────────────
[channels.discord]
enabled = true
token_env = "DISCORD_BOT_TOKEN"
dm_policy = "allowlist"
group_mode = "mention"
# 仅允许指定服务器
allowed_guilds = ["1234567890"]

# ─── Slack ────────────────────────────────
[channels.slack]
enabled = true
app_token_env = "SLACK_APP_TOKEN"
bot_token_env = "SLACK_BOT_TOKEN"
dm_policy = "open"

# ─── 飞书 ────────────────────────────────
[channels.lark]
enabled = true
app_id_env = "LARK_APP_ID"
app_secret_env = "LARK_APP_SECRET"
dm_policy = "pairing"

# ─── 钉钉 ────────────────────────────────
[channels.dingtalk]
enabled = true
app_key_env = "DINGTALK_APP_KEY"
app_secret_env = "DINGTALK_APP_SECRET"
dm_policy = "allowlist"

# ─── 邮件 ────────────────────────────────
[channels.email]
enabled = true
imap_host = "imap.example.com"
imap_port = 993
smtp_host = "smtp.example.com"
smtp_port = 465
username_env = "EMAIL_USERNAME"
password_env = "EMAIL_PASSWORD"
dm_policy = "allowlist"
# 轮询间隔（秒）
poll_interval_secs = 30

# ─── Matrix ──────────────────────────────
[channels.matrix]
enabled = true
homeserver = "https://matrix.org"
username = "@prx-bot:matrix.org"
password_env = "MATRIX_PASSWORD"
dm_policy = "pairing"

# ─── CLI（始终可用）─────────────────────
[channels.cli]
enabled = true
```

## DM 策略

DM（Direct Message，私聊）策略控制谁可以与 PRX 进行私聊对话：

### `pairing` — 配对认证（推荐）

用户需要输入一次性配对码才能开始对话，最安全：

```toml
[channels.telegram]
dm_policy = "pairing"
# 配对码有效期（秒），0 = 不过期
pairing_ttl_secs = 300
```

生成配对码：

```bash
# 为 Telegram 渠道生成配对码
prx channel pair telegram
# 输出: 配对码: A3F7-K9X2（5 分钟内有效）
```

用户在 Telegram 中发送 `/pair A3F7-K9X2` 即可完成配对。

### `allowlist` — 白名单

仅允许指定用户对话：

```toml
[channels.telegram]
dm_policy = "allowlist"

# 按平台用户 ID 指定
allowed_users = [
  "123456789",    # Telegram user ID
  "987654321",
]
```

### `open` — 开放

任何人都可以直接对话，适合公开服务场景：

```toml
[channels.slack]
dm_policy = "open"
# 建议同时启用速率限制
rate_limit_rpm = 30
```

::: warning 安全警告
`open` 策略允许任何人使用你的 AI 助手（消耗你的 API 额度）。仅在受控环境（如公司 Slack 工作区）中使用，或务必配合严格的速率限制。
:::

### `disabled` — 禁用私聊

完全禁止私聊，仅在群组中响应（通常配合 `group_mode = "mention"` 使用）：

```toml
[channels.discord]
dm_policy = "disabled"
group_mode = "mention"
```

## 渠道管理命令

```bash
# 列出所有渠道及状态
prx channel list

# 启用/禁用渠道
prx channel enable telegram
prx channel disable telegram

# 生成配对码
prx channel pair telegram

# 查看渠道详情
prx channel info telegram

# 测试渠道连通性
prx channel test telegram
```

## 热重载

修改渠道配置后，PRX 支持热重载，无需重启守护进程：

```bash
# 自动检测配置变化并重载
# 大多数情况下修改 TOML 文件后会自动生效

# 手动触发重载
prx config reload
```

::: info 注意
修改 `token_env` 或 `*_secret_env` 等凭据引用时，需要先设置对应的环境变量，然后重启守护进程才能生效。热重载仅适用于非凭据类配置变更。
:::

## 下一步

选择你要接入的渠道，查看详细配置文档：

- **即时通讯**: [Telegram](./telegram) | [Discord](./discord) | [Slack](./slack) | [Matrix](./matrix)
- **端到端加密**: [WhatsApp](./whatsapp) | [Signal](./signal) | [iMessage](./imessage)
- **中国平台**: [飞书 / Lark](./lark) | [钉钉](./dingtalk)
- **企业协作**: [Mattermost](./mattermost) | [Nextcloud Talk](./nextcloud-talk)
- **传统协议**: [邮件](./email) | [IRC](./irc)
- **开发调试**: [命令行](./cli)

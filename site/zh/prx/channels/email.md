---
title: 邮件 (IMAP + SMTP)
description: 将 PRX 连接到邮件渠道，通过 IMAP 接收、SMTP 发送
---

# 邮件 (IMAP + SMTP)

> 通过 IMAP IDLE 实时监听收件箱，通过 SMTP 自动回复邮件，将 PRX 接入任何标准邮件服务。

## 前置条件

- 一个支持 IMAP 和 SMTP 的邮箱账号
- 邮箱的应用专用密码（如果启用了两步验证）
- PRX 守护进程已运行

## 快速配置

### 1. 获取凭证

以 Gmail 为例：
1. 启用两步验证
2. 在 [Google 账号安全设置](https://myaccount.google.com/apppasswords) 中生成应用专用密码
3. IMAP 服务器：`imap.gmail.com:993`，SMTP 服务器：`smtp.gmail.com:465`

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.email]
imap_host = "imap.gmail.com"
imap_port = 993
imap_folder = "INBOX"
smtp_host = "smtp.gmail.com"
smtp_port = 465
smtp_tls = true
username = "your-email@gmail.com"
password = "your-app-password"
from_address = "your-email@gmail.com"
idle_timeout_secs = 1740
allowed_senders = ["friend@example.com", "*@company.com"]
```

### 3. 验证

```bash
prx channel doctor email
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `imap_host` | String | 必填 | IMAP 服务器地址 |
| `imap_port` | u16 | `993` | IMAP 端口（993 为 TLS） |
| `imap_folder` | String | `"INBOX"` | 监听的邮件文件夹 |
| `smtp_host` | String | 必填 | SMTP 服务器地址 |
| `smtp_port` | u16 | `465` | SMTP 端口（465 为 TLS，587 为 STARTTLS） |
| `smtp_tls` | bool | `true` | SMTP 是否使用 TLS 加密 |
| `username` | String | 必填 | 邮箱登录用户名 |
| `password` | String | 必填 | 邮箱密码或应用专用密码 |
| `from_address` | String | 必填 | 发件人地址 |
| `idle_timeout_secs` | u64 | `1740`（29 分钟） | IMAP IDLE 超时时间（RFC 2177 建议 29 分钟重连） |
| `allowed_senders` | Vec\<String\> | `[]`（拒绝全部） | 允许的发件人地址/域名（`"*"` 允许全部） |

## 功能特性

- **IMAP IDLE** — 利用 IMAP IDLE 命令实时接收新邮件，无需轮询
- **TLS 加密** — IMAP 和 SMTP 均支持 TLS 加密连接
- **域名过滤** — 支持通过域名通配符（如 `*@company.com`）过滤发件人
- **自动重连** — IDLE 连接超时后自动重新建立

## 限制

- 不支持 HTML 富文本回复（纯文本响应）
- 大量邮件可能导致处理延迟
- 部分邮件服务提供商对 IMAP IDLE 的支持不完善
- 密码以明文存储在配置文件中，建议使用环境变量

## 故障排除

**IMAP 连接失败**

1. 确认 IMAP 服务已启用（部分邮件服务默认关闭）
2. 检查是否需要使用应用专用密码
3. 确认 `imap_host` 和 `imap_port` 正确

**邮件发送失败**

- 检查 SMTP 配置（`smtp_host`、`smtp_port`、`smtp_tls`）
- 确认 `from_address` 与登录账号匹配
- 部分服务提供商要求发件人与登录用户一致

**IDLE 频繁断开**

- 调整 `idle_timeout_secs` 值（RFC 2177 建议不超过 29 分钟）
- 检查网络连接稳定性

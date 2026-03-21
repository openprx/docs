---
title: IRC
description: 将 PRX 连接到 IRC 网络
---

# IRC

> 通过 IRC 协议将 PRX 接入任何 IRC 服务器，支持 TLS 加密、NickServ 认证和 SASL 认证。

## 前置条件

- 一个 IRC 服务器（如 Libera.Chat、OFTC 等）
- Bot 的昵称和（可选的）认证凭证
- PRX 守护进程已运行

## 快速配置

### 1. 选择 IRC 网络

常见的公共 IRC 网络：

| 网络 | 服务器 | TLS 端口 |
|------|--------|----------|
| Libera.Chat | `irc.libera.chat` | `6697` |
| OFTC | `irc.oftc.net` | `6697` |
| Rizon | `irc.rizon.net` | `6697` |

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
username = "prx"
channels = ["#my-channel"]
allowed_users = ["your_nick"]
mention_only = true
nickserv_password = "your-nickserv-password"
verify_tls = true
```

### 3. 验证

```bash
prx channel doctor irc
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `server` | String | 必填 | IRC 服务器地址 |
| `port` | u16 | `6697` | 服务器端口（6697 为 TLS） |
| `nickname` | String | 必填 | Bot 昵称 |
| `username` | String? | `null` | 用户名（默认使用昵称） |
| `channels` | Vec\<String\> | `[]` | 连接后自动加入的频道列表 |
| `allowed_users` | Vec\<String\> | `[]` | 允许的昵称列表（大小写不敏感），`"*"` 允许全部 |
| `mention_only` | bool | `false` | 在频道中是否只响应包含 Bot 昵称的消息 |
| `server_password` | String? | `null` | 服务器密码（用于 ZNC 等 Bouncer） |
| `nickserv_password` | String? | `null` | NickServ IDENTIFY 密码 |
| `sasl_password` | String? | `null` | SASL PLAIN 认证密码（IRCv3） |
| `verify_tls` | bool? | `true` | 是否验证 TLS 证书 |

## 功能特性

- **TLS 加密** — 默认使用 TLS 端口（6697）加密连接
- **多种认证** — 支持 NickServ、SASL PLAIN 和服务器密码
- **多频道** — 可同时加入和监听多个频道
- **Bouncer 兼容** — 支持 ZNC 等 IRC Bouncer

## 限制

- IRC 消息长度限制为 512 字节（含协议头），超长响应会自动分割
- 无原生媒体消息支持
- 昵称冲突时需要自行处理（如使用 NickServ GHOST）
- 无消息历史记录（IRC 协议本身不持久化消息）

## 故障排除

**无法连接服务器**

1. 确认 `server` 和 `port` 正确
2. 如果使用自签名证书，设置 `verify_tls = false`
3. 检查防火墙是否允许出站连接到 6697 端口

**昵称已被占用**

- 配置 NickServ 密码，连接后自动 IDENTIFY 并 GHOST 占用者
- 或选择一个不常见的昵称

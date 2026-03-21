---
title: Matrix 端到端加密
description: 将 PRX 连接到 Matrix 协议网络
---

# Matrix 端到端加密

> 通过 Matrix 协议将 PRX 接入去中心化的通讯网络，支持端到端加密和自托管 Homeserver。

## 前置条件

- 一个 Matrix 账号（可在 [matrix.org](https://matrix.org/) 注册或自建 Homeserver）
- Bot 账号的 Access Token
- PRX 守护进程已运行

## 快速配置

### 1. 获取 Access Token

使用 `curl` 登录获取 Token：

```bash
curl -X POST "https://matrix.org/_matrix/client/r0/login" \
  -H "Content-Type: application/json" \
  -d '{"type":"m.login.password","user":"@bot:matrix.org","password":"your-password"}'
```

从返回的 JSON 中获取 `access_token`。

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.matrix]
homeserver = "https://matrix.org"
access_token = "syt_xxxxxxxxxxxx"
user_id = "@prx-bot:matrix.org"
device_id = "PRXDEVICE"
room_id = "!abc123def:matrix.org"
allowed_users = ["@yourname:matrix.org"]
mention_only = false
```

### 3. 验证

```bash
prx channel doctor matrix
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `homeserver` | String | 必填 | Matrix Homeserver URL |
| `access_token` | String | 必填 | Bot 账号的 Access Token |
| `user_id` | String? | `null` | Bot 的 Matrix 用户 ID（如 `@bot:matrix.org`） |
| `device_id` | String? | `null` | 设备 ID（用于加密密钥管理） |
| `room_id` | String | 必填 | 监听的房间 ID |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的 Matrix 用户 ID 列表 |
| `mention_only` | bool | `false` | 在房间中是否只响应 @提及 |

## 功能特性

- **去中心化** — Matrix 是开放协议，支持联邦制自建 Homeserver
- **端到端加密** — 支持 Matrix 的 Megolm 端到端加密
- **自托管** — 可搭配 Synapse/Dendrite 等自建 Homeserver 使用
- **跨平台桥接** — Matrix 社区提供丰富的桥接（Telegram、Discord、IRC 等）

## 限制

- 单个配置仅支持监听一个房间
- 端到端加密需要正确管理 `device_id` 和密钥
- Access Token 长期有效但无自动刷新机制

## 故障排除

**无法连接 Homeserver**

1. 确认 `homeserver` URL 可达
2. 检查 `access_token` 是否有效（可能已过期或被撤销）
3. 确认网络连接正常

**加密消息无法读取**

- 确认 `device_id` 在所有会话中一致
- 如果加密密钥丢失，需要在房间中重新验证设备

---
title: LINQ 自定义集成
description: 通过 LINQ Partner API 将 PRX 连接到自定义消息通道
---

# LINQ 自定义集成

> 通过 LINQ Partner API 将 PRX 接入自定义短信/消息通道，支持 Webhook 签名验证和消息路由。

## 前置条件

- LINQ Partner API 账号和 API Token
- 一个可用的电话号码（E.164 格式）
- PRX 守护进程已运行

## 快速配置

### 1. 获取凭证

1. 注册 LINQ Partner 账号
2. 获取 API Token（Bearer 认证）
3. 配置用于发送消息的电话号码

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.linq]
api_token = "your-linq-api-token"
from_phone = "+1234567890"
signing_secret = "your-signing-secret"
allowed_senders = ["+0987654321"]
mention_only = false
```

### 3. 验证

```bash
prx channel doctor linq
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `api_token` | String | 必填 | LINQ Partner API Token（Bearer 认证） |
| `from_phone` | String | 必填 | 发送消息使用的电话号码（E.164 格式） |
| `signing_secret` | String? | `null` | Webhook 签名验证密钥 |
| `allowed_senders` | Vec\<String\> | `[]` | 允许的发送者号码列表，`"*"` 允许全部 |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @提及 |

## 功能特性

- **SMS/MMS 集成** — 通过 LINQ API 发送和接收短信
- **Webhook 安全** — 通过签名密钥验证入站 Webhook 请求
- **电话号码路由** — 支持多号码配置和发送者过滤

## 限制

- LINQ 服务可用区域有限
- SMS 消息长度限制为 160 字符（超长会分割为多条）
- MMS 附件大小受运营商限制

## 故障排除

**消息发送失败**

1. 确认 `api_token` 有效
2. 检查 `from_phone` 是否为已验证的号码
3. 确认目标号码格式正确（E.164）

**Webhook 收不到消息**

- 确认 Webhook URL 已在 LINQ 控制台中配置
- 检查 `signing_secret` 是否与 LINQ 配置一致

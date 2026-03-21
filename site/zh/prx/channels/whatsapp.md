---
title: WhatsApp Business API
description: 将 PRX 连接到 WhatsApp Business Cloud API
---

# WhatsApp Business API

> 通过 Meta WhatsApp Business Cloud API 将 PRX 接入 WhatsApp，支持消息收发和 Webhook 验证。

## 前置条件

- 一个 [Meta Business Suite](https://business.facebook.com/) 账号
- 已创建 WhatsApp Business 应用
- 可公网访问的 Webhook URL（或使用 `prx tunnel`）
- PRX 守护进程已运行

## 快速配置

### 1. 获取凭证

1. 在 [Meta Developer Portal](https://developers.facebook.com/) 创建应用，选择 **Business** 类型
2. 添加 **WhatsApp** 产品
3. 在 **WhatsApp > API Setup** 中获取：
   - **Access Token**（临时或永久）
   - **Phone Number ID**
4. 配置 Webhook URL 和 Verify Token

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxx..."
phone_number_id = "123456789012345"
verify_token = "your-custom-verify-token"
app_secret = "abcdef1234567890"
allowed_numbers = ["+1234567890"]
dm_policy = "pairing"
group_policy = "deny"
mention_only = false
```

### 3. 验证

```bash
prx channel doctor whatsapp
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `access_token` | String? | `null` | Meta Business Suite Access Token |
| `phone_number_id` | String? | `null` | WhatsApp Business Phone Number ID |
| `verify_token` | String? | `null` | Webhook 验证令牌（自定义，Meta 回调时校验） |
| `app_secret` | String? | `null` | 应用密钥，用于 Webhook 签名验证 |
| `allowed_numbers` | Vec\<String\> | `[]`（拒绝全部） | 允许的电话号码列表（E.164 格式，如 `+1234567890`） |
| `dm_policy` | String | `"open"` | 私聊策略：`"open"` / `"pairing"` / `"deny"` |
| `group_policy` | String | `"deny"` | 群聊策略：`"open"` / `"allowlist"` / `"deny"` |
| `group_allow_from` | Vec\<String\> | `[]` | 允许的群组 ID 列表（当 `group_policy = "allowlist"` 时使用） |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @提及 的消息 |

## 功能特性

- **Cloud API** — 使用 Meta 官方 Cloud API，无需运行本地客户端
- **Webhook 安全** — 通过 `app_secret` 验证 Webhook 签名，防止伪造请求
- **配对认证** — 支持 DM 策略和配对机制
- **群聊控制** — 灵活的群聊策略配置

## 限制

- Cloud API 需要 Meta Business 验证
- Access Token 有过期时间，生产环境需配置系统用户永久 Token
- 消息模板需要预审批后才能主动发送
- 24 小时会话窗口限制

## 故障排除

**Webhook 验证失败**

- 确认 `verify_token` 与 Meta Developer Portal 中配置的一致
- 确认 PRX 网关可从公网访问

**消息发送失败**

1. 检查 `access_token` 是否过期
2. 确认 `phone_number_id` 正确
3. 运行 `prx daemon logs --follow` 查看详细错误信息

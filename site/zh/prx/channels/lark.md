---
title: 飞书 / Lark
description: 将 PRX 连接到飞书（Lark）企业通讯平台
---

# 飞书 / Lark

> 通过飞书开放平台 API 将 PRX 接入飞书 / Lark，支持 WebSocket 和 Webhook 两种事件接收模式。

## 前置条件

- 飞书开放平台企业自建应用（[飞书开放平台](https://open.feishu.cn/)）
- App ID 和 App Secret
- PRX 守护进程已运行

## 快速配置

### 1. 创建应用

1. 登录 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 在 **凭证与基础信息** 中获取 **App ID** 和 **App Secret**
4. 在 **权限管理** 中添加：`im:message`、`im:message.receive_v1`
5. 发布应用

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
encrypt_key = "your-encrypt-key"
verification_token = "your-verification-token"
allowed_users = ["ou_xxxxxxxxxxxxxx"]
use_feishu = true
receive_mode = "websocket"
mention_only = false
```

### 3. 验证

```bash
prx channel doctor lark
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `app_id` | String | 必填 | 飞书应用的 App ID |
| `app_secret` | String | 必填 | 飞书应用的 App Secret |
| `encrypt_key` | String? | `null` | Webhook 消息解密密钥 |
| `verification_token` | String? | `null` | Webhook 验证 Token |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的用户 ID 或 union_id（`"*"` 允许全部） |
| `use_feishu` | bool | `false` | 使用飞书（中国）端点而非 Lark（国际）端点 |
| `receive_mode` | String | `"websocket"` | 事件接收模式：`"websocket"` 或 `"webhook"` |
| `port` | u16? | `null` | Webhook 模式的 HTTP 监听端口（仅 webhook 模式需要） |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @提及 |

## 功能特性

- **WebSocket 模式** — 长连接接收事件，无需公网 URL（推荐）
- **Webhook 模式** — HTTP 回调接收事件，需要公网可达的 URL
- **飞书/Lark 双端点** — 通过 `use_feishu` 切换中国和国际 API 端点
- **加密验证** — 支持消息加密和请求签名验证

## 限制

- WebSocket 模式是飞书较新的特性，部分旧版本可能不支持
- 发送富文本消息需要额外的权限配置
- 应用需经过企业管理员审批

## 故障排除

**WebSocket 连接失败**

1. 确认 `app_id` 和 `app_secret` 正确
2. 检查网络是否可以访问飞书 API（`open.feishu.cn` 或 `open.larksuite.com`）
3. 如果在中国大陆使用国际版 Lark，确认 `use_feishu = false`

**Webhook 收不到事件**

- 确认 `encrypt_key` 和 `verification_token` 与开放平台配置一致
- 确认 PRX 网关的 Webhook 端口可从公网访问

---
title: Nextcloud Talk
description: 将 PRX 连接到 Nextcloud Talk 协作平台
---

# Nextcloud Talk

> 通过 Nextcloud OCS API 将 PRX 接入 Nextcloud Talk，支持 Webhook 签名验证。

## 前置条件

- 一个 Nextcloud 实例（需启用 Talk 应用）
- Bot 应用 Token
- PRX 守护进程已运行

## 快速配置

### 1. 获取 App Token

1. 在 Nextcloud 中进入 **设置 > 安全 > 设备与会话**
2. 创建新的应用密码，记录 Token
3. 或者通过 Nextcloud OCC 命令创建 Bot：
   ```bash
   sudo -u www-data php occ talk:bot:install "PRX Bot" \
     --secret "your-webhook-secret" \
     "https://your-prx-server/webhook/nextcloud-talk"
   ```

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.nextcloud_talk]
base_url = "https://cloud.example.com"
app_token = "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
webhook_secret = "your-webhook-secret"
allowed_users = ["admin", "user1"]
mention_only = false
```

### 3. 验证

```bash
prx channel doctor nextcloud_talk
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `base_url` | String | 必填 | Nextcloud 服务器 URL |
| `app_token` | String | 必填 | Bot 应用 Token（用于 OCS API Bearer 认证） |
| `webhook_secret` | String? | `null` | Webhook 签名验证密钥 |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的用户 ID（`"*"` 允许全部） |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @提及 |

::: tip 环境变量
`webhook_secret` 也可以通过环境变量 `OPENPRX_NEXTCLOUD_TALK_WEBHOOK_SECRET` 设置。
:::

## 功能特性

- **自托管** — 适配 Nextcloud 自托管环境，数据完全可控
- **Webhook 验证** — 通过共享密钥验证 Webhook 请求签名
- **OCS API** — 使用 Nextcloud 标准 OCS API 发送消息

## 限制

- 需要 Nextcloud Talk 2.0+ 版本
- Bot 功能依赖 Nextcloud Talk 的 Bot API 支持
- Webhook 需要 PRX 网关可从 Nextcloud 服务器访问

## 故障排除

**Webhook 验证失败**

1. 确认 `webhook_secret` 与 Nextcloud Talk Bot 配置中的一致
2. 检查请求签名 header 是否正确传递

**消息发送失败**

- 确认 `app_token` 有效且具有发送消息权限
- 检查 `base_url` 是否正确（注意 HTTPS）

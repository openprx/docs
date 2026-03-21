---
title: 钉钉
description: 将 PRX 连接到钉钉企业通讯平台
---

# 钉钉

> 通过钉钉开放平台 Stream 模式将 PRX 接入钉钉，支持单聊和群聊机器人。

## 前置条件

- 钉钉企业内部应用（[钉钉开放平台](https://open.dingtalk.com/)）
- Client ID（AppKey）和 Client Secret（AppSecret）
- PRX 守护进程已运行

## 快速配置

### 1. 创建应用

1. 登录 [钉钉开放平台](https://open.dingtalk.com/)
2. 创建企业内部应用 / 机器人
3. 在 **应用信息** 中获取 **Client ID**（AppKey）和 **Client Secret**（AppSecret）
4. 在 **机器人与消息推送** 中启用机器人功能
5. 在 **消息接收模式** 中选择 **Stream 模式**

### 2. 编辑配置

在 `~/.config/openprx/config.toml` 中添加：

```toml
[channels_config.dingtalk]
client_id = "dingxxxxxxxxxxxxxxxxxx"
client_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["manager1234"]
mention_only = false
```

### 3. 验证

```bash
prx channel doctor dingtalk
```

## 配置参考

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `client_id` | String | 必填 | 钉钉应用的 Client ID（AppKey） |
| `client_secret` | String | 必填 | 钉钉应用的 Client Secret（AppSecret） |
| `allowed_users` | Vec\<String\> | `[]`（拒绝全部） | 允许的用户 ID（`"*"` 允许全部） |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @机器人 的消息 |

## 功能特性

- **Stream 模式** — 使用长连接接收消息，无需公网回调地址
- **单聊和群聊** — 同时支持与机器人私聊和群内 @机器人
- **企业内部应用** — 适合企业内部部署使用

## 限制

- 仅支持企业内部应用（不支持第三方应用）
- 消息频率受钉钉 API 速率限制
- 钉钉 API 仅在中国大陆可用

## 故障排除

**机器人无响应**

1. 确认已启用 Stream 模式
2. 检查 `client_id` 和 `client_secret` 是否正确
3. 确认应用已发布且未被管理员停用

**群聊中不回复**

- 如果启用了 `mention_only = true`，需要在消息中 @机器人
- 确认机器人已被添加到群组

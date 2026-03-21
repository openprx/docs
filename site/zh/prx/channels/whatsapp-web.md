---
title: WhatsApp Web 客户端
description: 通过原生 WhatsApp Web 协议将 PRX 连接到 WhatsApp
---

# WhatsApp Web 客户端

> 通过 wacli (WhatsApp Web 原生客户端) 将 PRX 直接接入 WhatsApp，无需 Business API。支持二维码配对和电话号码配对。

## 前置条件

- 一个已注册的 WhatsApp 账号
- `wacli` 已安装（PRX 的 WhatsApp Web 客户端组件）
- PRX 守护进程已运行

## 快速配置

### 1. 安装 wacli

`wacli` 随 PRX 一起安装，也可以单独安装：

```bash
cargo install wacli
```

### 2. 编辑配置

PRX 提供两种 WhatsApp Web 接入方式：

**方式一：通过 `whatsapp` 配置的 Web 模式**

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session"
pair_phone = "15551234567"
allowed_numbers = ["+1234567890"]
dm_policy = "open"
```

**方式二：通过独立的 `wacli` 渠道**

```toml
[channels_config.wacli]
enabled = true
host = "127.0.0.1"
port = 16867
allowed_from = ["*"]
mention_only = false
```

### 3. 配对

首次运行时，需要通过手机 WhatsApp 扫描二维码或使用配对码完成链接：

```bash
# 使用二维码配对
wacli link --qr

# 使用电话号码配对
wacli link --phone 15551234567
```

### 4. 验证

```bash
prx channel doctor whatsapp
# 或
prx channel doctor wacli
```

## 配置参考（whatsapp Web 模式）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `session_path` | String? | `null` | 会话数据库存储路径（设置此字段启用 Web 模式） |
| `pair_phone` | String? | `null` | 配对用电话号码（国家码+号码，如 `"15551234567"`） |
| `pair_code` | String? | `null` | 自定义配对码（留空由 WhatsApp 自动生成） |
| `allowed_numbers` | Vec\<String\> | `[]` | 允许的电话号码（E.164 格式） |
| `dm_policy` | String | `"open"` | 私聊策略 |
| `group_policy` | String | `"deny"` | 群聊策略 |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @提及 |

## 配置参考（wacli 独立渠道）

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | `false` | 是否启用 wacli 渠道 |
| `host` | String | `"127.0.0.1"` | wacli 守护进程监听地址 |
| `port` | u16 | `16867` | wacli JSON-RPC TCP 端口 |
| `allowed_from` | Vec\<String\> | `["*"]` | 允许的发送者 JID（`"*"` 表示全部允许） |
| `cli_path` | String? | `null` | wacli 二进制路径 |
| `store_dir` | String? | `null` | wacli 存储目录 |
| `mention_only` | bool | `false` | 在群聊中是否只响应 @提及 |

## 功能特性

- **无需 Business API** — 使用个人 WhatsApp 账号即可
- **端到端加密** — 遵循 WhatsApp 原生加密协议
- **二维码/电话号码配对** — 支持两种配对方式
- **JSON-RPC 通信** — wacli 通过 JSON-RPC 与 PRX 通信，稳定可靠

## 限制

- WhatsApp 多设备最多链接 4 个设备
- 会话可能因长时间不活跃而断开，需重新配对
- 不支持 WhatsApp Business 专有功能（如消息模板）

## 故障排除

**会话断开**

- 重新运行 `wacli link` 进行配对
- 确认手机 WhatsApp 中的已链接设备列表中包含 PRX

**wacli 连接失败**

1. 确认 wacli 守护进程正在运行：`wacli status`
2. 检查端口 `16867` 是否被占用
3. 查看 PRX 日志：`prx daemon logs --follow`

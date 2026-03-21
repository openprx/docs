---
title: ngrok
description: 使用 ngrok 快速将 PRX Agent 暴露到公网，适用于开发和临时测试。
---

# ngrok

ngrok 提供即开即用的公网隧道服务，几秒钟内即可获得一个公网 URL。这是 PRX 最简单的隧道方案，特别适合开发调试和临时演示。

## 概述

ngrok 的特点：

- **即开即用** -- 一行命令获得公网 URL
- **Web Inspector** -- 内置请求检查面板，方便调试 webhook
- **多协议** -- 支持 HTTP、HTTPS、TCP、TLS
- **全球覆盖** -- 多区域边缘节点
- **免费层可用** -- 免费计划足够开发使用

## 前置要求

1. 注册 ngrok 账户（免费）
2. 安装 ngrok CLI
3. 配置认证 Token

### 安装

```bash
# macOS
brew install ngrok

# Linux
curl -fsSL https://ngrok-agent.s3.amazonaws.com/ngrok-v3-stable-linux-amd64.tgz \
  | sudo tar xz -C /usr/local/bin

# 验证
ngrok version
```

### 配置 Authtoken

```bash
# 从 https://dashboard.ngrok.com/get-started/your-authtoken 获取 Token
ngrok config add-authtoken <YOUR_TOKEN>
```

## 配置

### PRX 配置

在 `config.toml` 中配置 ngrok：

```toml
[tunnel]
backend = "ngrok"
local_port = 3000
auto_start = true

[tunnel.ngrok]
# 认证 Token（推荐通过环境变量）
authtoken = "${NGROK_AUTHTOKEN}"

# 可选：使用自定义域名（付费计划）
# domain = "my-agent.ngrok-free.app"

# 可选：指定区域
# region = "ap"  # "us" | "eu" | "ap" | "au" | "sa" | "jp" | "in"

# 可选：启用 Web Inspector
inspect = true
inspect_port = 4040

# 可选：基础认证（保护 Agent 端点）
# basic_auth = "user:password"
```

### 完整 TOML 示例

```toml
[tunnel]
backend = "ngrok"
local_port = 3000
auto_start = true
health_check_interval = 30

[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"
domain = "my-agent.ngrok-free.app"
region = "ap"
inspect = true
inspect_port = 4040

[tunnel.reconnect]
enabled = true
max_attempts = 10
backoff_base_ms = 1000
backoff_max_ms = 60000
```

### 环境变量

```bash
# 认证 Token
export NGROK_AUTHTOKEN="2abcdef..."

# 可选：API Key（用于 ngrok API 管理）
export NGROK_API_KEY="..."
```

## 使用方法

### 通过 PRX CLI

```bash
# 启动 ngrok 隧道
prx tunnel start --backend ngrok

# 查看状态
prx tunnel status
# Tunnel: ngrok (connected)
# Public URL: https://a1b2-203-0-113-1.ngrok-free.app
# Inspector: http://localhost:4040
# Local: http://localhost:3000

# 停止
prx tunnel stop
```

### Web Inspector

当 `inspect = true` 时，ngrok 提供请求检查界面：

```
http://localhost:4040
```

Inspector 功能：

- 查看所有经过隧道的请求和响应
- 请求回放（Replay）
- 查看 webhook payload 详情
- 响应时间分析

## 免费层限制

| 限制项 | 免费计划 | 付费计划 |
|--------|---------|---------|
| 并发隧道 | 1 | 按计划 |
| 自定义域名 | 1 (ngrok-free.app) | 多个 |
| 每分钟连接数 | 40 | 按计划 |
| 持久 URL | 1 个静态域名 | 多个 |
| Inspector 请求保留 | 500 条 | 更多 |
| IP 限制 | 不支持 | 支持 |

::: warning 注意
免费计划的随机 URL 在重启后会变更。如果 webhook 源不支持动态更新 URL，请使用自定义域名或静态域名。
:::

## 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `authtoken` | string | 是 | -- | ngrok 认证 Token |
| `domain` | string | 否 | -- | 自定义域名 |
| `region` | string | 否 | `"us"` | 边缘节点区域 |
| `inspect` | bool | 否 | `true` | 启用 Web Inspector |
| `inspect_port` | u16 | 否 | `4040` | Inspector 端口 |
| `basic_auth` | string | 否 | -- | 基础认证（格式：`user:pass`） |

## 安全性

- **TLS 加密** -- ngrok 边缘节点自动终止 TLS
- **Authtoken 保护** -- 通过环境变量管理，避免泄露
- **基础认证** -- 为开发环境添加简单的访问保护
- **请求检查** -- Inspector 仅监听 localhost，不暴露到网络
- **生产建议** -- 生产环境建议使用 Cloudflare Tunnel 替代 ngrok

::: danger 安全提醒
免费计划的 ngrok URL 虽然随机，但 **任何知道 URL 的人都可以访问**。请勿在未保护的 ngrok 隧道上暴露包含敏感数据的 Agent。
:::

## 与其他后端对比

| 特性 | ngrok | Cloudflare Tunnel | Tailscale Funnel |
|------|-------|-------------------|-----------------|
| 上手难度 | 最简单 | 中等 | 中等 |
| 自定义域名 | 付费 | 免费（需 CF DNS） | 固定 ts.net |
| 零信任 | 付费 | 免费 | 内置 |
| 请求调试 | Inspector | 无 | 无 |
| 适用场景 | 开发调试 | 生产部署 | 团队内部 |

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| `ERR_NGROK_108` | Authtoken 无效 | 重新配置 `ngrok config add-authtoken` |
| `ERR_NGROK_226` | 免费账户并发隧道超限 | 关闭其他 ngrok 隧道 |
| 随机 URL 变更 | 免费计划重启后 URL 变化 | 使用 `domain` 配置静态域名 |
| 请求被拦截 | ngrok 免费层的浏览器警告页 | 添加 `ngrok-skip-browser-warning: true` Header |
| Inspector 打不开 | 端口冲突 | 修改 `inspect_port` |

## 相关文档

- [隧道概览](./)
- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [Gateway 配置](/zh/prx/gateway/)

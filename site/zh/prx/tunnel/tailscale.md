---
title: Tailscale Funnel
description: 使用 Tailscale Funnel 将 PRX Agent 安全暴露到公网，基于 WireGuard 加密。
---

# Tailscale Funnel

Tailscale Funnel 允许将 Tailscale 网络中的服务暴露到公网。PRX 利用 Funnel 为运行在 Tailnet 内的 Agent 提供公网可达性，同时保持 WireGuard 级别的安全性。

## 概述

Tailscale Funnel 的特点：

- **WireGuard 加密** -- 所有流量通过 WireGuard 协议加密
- **零配置网络** -- 无需手动管理 IP、端口映射或防火墙规则
- **身份驱动** -- 基于 Tailscale 身份而非 IP 地址的访问控制
- **自动 TLS** -- Tailscale 自动为 `*.ts.net` 域名签发证书
- **个人免费** -- 个人使用免费，支持最多 100 台设备

## 前置要求

1. Tailscale 账户
2. 本机已安装并登录 Tailscale
3. Tailnet 已启用 Funnel 功能

### 安装 Tailscale

```bash
# macOS
brew install tailscale

# Linux (Debian/Ubuntu)
curl -fsSL https://tailscale.com/install.sh | sh

# 启动并登录
sudo tailscale up

# 验证连接
tailscale status
```

### 启用 Funnel

Funnel 需要在 Tailscale Admin Console 中明确启用：

1. 访问 [Tailscale Admin Console](https://login.tailscale.com/admin/acls)
2. 在 ACL 配置中添加 Funnel 策略
3. 允许目标节点使用 Funnel

ACL 策略示例：

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

## 配置

### PRX 配置

在 `config.toml` 中配置 Tailscale Funnel：

```toml
[tunnel]
backend = "tailscale"
local_port = 3000
auto_start = true

[tunnel.tailscale]
# Funnel 公网端口（仅支持 443、8443、10000）
funnel_port = 443

# 可选：指定 tailscale 二进制路径
# tailscale_bin = "/usr/bin/tailscale"

# 可选：使用 Serve（仅 Tailnet 内可达，不暴露公网）
# funnel = false  # 设为 false 则使用 Tailscale Serve
```

### 完整 TOML 配置示例

```toml
[tunnel]
backend = "tailscale"
local_port = 3000
auto_start = true
health_check_interval = 60

[tunnel.tailscale]
funnel_port = 443

[tunnel.reconnect]
enabled = true
max_attempts = 5
backoff_base_ms = 2000
backoff_max_ms = 30000
```

## 使用方法

### 手动管理

```bash
# 启动 Funnel
prx tunnel start --backend tailscale

# 查看状态
prx tunnel status
# Tunnel: tailscale (connected)
# Public URL: https://your-machine.tail1234.ts.net:443
# Local: http://localhost:3000

# 停止
prx tunnel stop
```

### Tailscale CLI 直接操作

```bash
# 查看 Funnel 状态
tailscale funnel status

# 手动启动（PRX 自动调用，通常不需要手动）
tailscale funnel 3000

# 关闭 Funnel
tailscale funnel off
```

## Tailscale Serve vs Funnel

| 特性 | Serve | Funnel |
|------|-------|--------|
| 可达性 | 仅 Tailnet 内 | 公网任意访问 |
| 域名 | `machine.tailnet.ts.net` | 相同，但公网可解析 |
| 认证 | Tailscale 身份 | 无（需应用层认证） |
| 端口 | 任意 | 443、8443、10000 |
| 用途 | 团队内部协作 | 接收外部 webhook |

PRX 默认使用 **Funnel**（公网可达），因为大多数 webhook 源不在 Tailnet 内。

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `funnel_port` | u16 | `443` | Funnel 公网端口（443/8443/10000） |
| `tailscale_bin` | string | `"tailscale"` | tailscale CLI 路径 |
| `funnel` | bool | `true` | `true` 使用 Funnel，`false` 使用 Serve |

## ACL 注意事项

### 最小权限 ACL

建议为运行 PRX 的节点设置最小权限：

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["autogroup:member"],
      "dst": ["tag:prx-agent:443"]
    }
  ],
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ],
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  }
}
```

### 关键限制

- Funnel 仅支持 **HTTPS**（443、8443、10000 端口）
- 单个节点最多暴露 **一个 Funnel 端口**
- Funnel 流量 **不经过 Tailnet**，直接到 Tailscale DERP relay
- 公网访问者 **无 Tailscale 身份**，需应用层认证

## 安全性

- **传输加密** -- WireGuard 加密 + TLS 双重保护
- **ACL 控制** -- 通过 Tailscale ACL 精细控制谁可以使用 Funnel
- **Tag 隔离** -- 使用 Tag 将 PRX Agent 节点与其他节点隔离
- **审计追踪** -- Tailscale Admin Console 记录所有 Funnel 配置变更
- **应用层认证** -- Funnel 公网请求无 Tailscale 身份，务必在 PRX 侧启用 webhook 签名验证

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| `Funnel not available` | ACL 未授权 | 在 Admin Console 添加 `funnel` nodeAttr |
| `port not allowed` | 使用了不支持的端口 | 仅支持 443、8443、10000 |
| 公网无法访问 | DNS 传播延迟 | 等待几分钟或刷新 DNS 缓存 |
| `tailscale not logged in` | 节点未认证 | 运行 `tailscale up` 重新登录 |
| TLS 证书错误 | MagicDNS 未启用 | 在 Admin Console 启用 MagicDNS |

## 相关文档

- [隧道概览](./)
- [Cloudflare Tunnel](./cloudflare)
- [ngrok](./ngrok)
- [安全策略](/zh/prx/security/)

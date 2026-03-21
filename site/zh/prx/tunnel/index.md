---
title: 隧道 / NAT 穿透
description: PRX 隧道系统概览，支持将本地 Agent 暴露给外部 webhook 回调。
---

# 隧道 / NAT 穿透

PRX 内置隧道系统，让运行在 NAT / 防火墙后的 Agent 能够接收来自外部服务（GitHub webhook、Telegram Bot API、Slack Events 等）的 HTTP 回调。系统抽象了多种隧道后端，提供统一的生命周期管理。

## 概述

许多消息渠道和集成服务需要通过 webhook 将事件推送到 Agent。当 Agent 运行在本地开发机或无公网 IP 的服务器上时，隧道系统会自动建立从公网到本地的安全通道。

### 支持的后端

| 后端 | 免费额度 | 自定义域名 | 零信任 | 适用场景 |
|------|---------|-----------|--------|---------|
| [Cloudflare Tunnel](./cloudflare) | 无限 | 需要域名托管在 Cloudflare | Access 集成 | 生产部署、团队使用 |
| [Tailscale Funnel](./tailscale) | 个人免费 | Tailscale 域名 | WireGuard | 内网协作、开发环境 |
| [ngrok](./ngrok) | 有限 | 付费计划 | OAuth/OIDC | 快速原型、临时测试 |
| 自定义命令 | -- | -- | -- | 任意隧道工具 |

## 核心架构

### `Tunnel` trait

所有隧道后端都实现统一的 `Tunnel` trait：

```rust
#[async_trait]
pub trait Tunnel: Send + Sync {
    /// 启动隧道，返回公网 URL
    async fn start(&mut self) -> Result<TunnelInfo>;

    /// 停止隧道并释放资源
    async fn stop(&mut self) -> Result<()>;

    /// 健康检查，验证隧道连通性
    async fn health_check(&self) -> Result<TunnelHealth>;

    /// 获取当前隧道状态
    fn status(&self) -> TunnelStatus;
}
```

### `TunnelInfo` 结构体

```rust
pub struct TunnelInfo {
    /// 公网可访问的 URL
    pub public_url: Url,
    /// 隧道后端标识
    pub backend: String,
    /// 本地监听端口
    pub local_port: u16,
    /// 启动时间
    pub started_at: DateTime<Utc>,
}
```

### 状态枚举

```rust
pub enum TunnelStatus {
    /// 未启动
    Idle,
    /// 正在建立连接
    Connecting,
    /// 已连接，正常服务
    Connected(TunnelInfo),
    /// 连接断开，等待重连
    Reconnecting { attempt: u32 },
    /// 已停止
    Stopped,
    /// 错误状态
    Error(String),
}
```

## 配置

在 `config.toml` 中配置隧道：

```toml
[tunnel]
# 选择后端: "cloudflare" | "tailscale" | "ngrok" | "custom"
backend = "cloudflare"

# 本地 HTTP 服务监听端口（Agent gateway 端口）
local_port = 3000

# 自动启动：Agent 启动时自动建立隧道
auto_start = true

# 健康检查间隔（秒）
health_check_interval = 30

# 断线重连
[tunnel.reconnect]
enabled = true
max_attempts = 10
backoff_base_ms = 1000
backoff_max_ms = 60000
```

### 后端配置

各后端的详细配置请参考各自的文档页面：

```toml
# Cloudflare Tunnel
[tunnel.cloudflare]
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.example.com"

# Tailscale Funnel
[tunnel.tailscale]
funnel_port = 443

# ngrok
[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"
domain = "my-agent.ngrok-free.app"

# 自定义命令
[tunnel.custom]
command = "bore local 3000 --to bore.pub"
url_pattern = "bore.pub"
```

## 使用方法

### CLI 命令

```bash
# 手动启动隧道
prx tunnel start

# 查看隧道状态
prx tunnel status

# 停止隧道
prx tunnel stop

# 使用指定后端临时启动
prx tunnel start --backend ngrok

# 健康检查
prx tunnel health
```

### 自动模式

当 `auto_start = true` 时，Agent 启动会自动建立隧道：

```bash
# Agent 启动时自动建立隧道
prx start
# [INFO] Tunnel connected: https://agent.example.com -> localhost:3000
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backend` | string | `"cloudflare"` | 隧道后端选择 |
| `local_port` | u16 | `3000` | 本地转发端口 |
| `auto_start` | bool | `true` | Agent 启动时自动建立隧道 |
| `health_check_interval` | u64 | `30` | 健康检查间隔秒数 |
| `reconnect.enabled` | bool | `true` | 是否启用断线重连 |
| `reconnect.max_attempts` | u32 | `10` | 最大重连次数 |
| `reconnect.backoff_base_ms` | u64 | `1000` | 退避基础时间（毫秒） |
| `reconnect.backoff_max_ms` | u64 | `60000` | 退避最大时间（毫秒） |

## 安全性

- **最小暴露原则** -- 隧道仅转发到指定的本地端口，不暴露其他服务
- **TLS 终止** -- 所有支持的后端都使用 HTTPS，流量在传输层加密
- **Token 保护** -- 隧道凭据通过环境变量注入，不硬编码在配置文件中
- **健康检查** -- 定期检查连通性，异常时自动断开防止僵尸隧道
- **访问控制** -- Cloudflare Access 和 Tailscale ACL 提供额外的身份验证层

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 隧道启动失败 | 后端二进制未安装 | 安装 `cloudflared` / `tailscale` / `ngrok` |
| 连接超时 | 防火墙阻止出站连接 | 允许 443 端口出站 |
| webhook 不可达 | `local_port` 与 gateway 端口不匹配 | 检查 `[gateway]` 和 `[tunnel]` 配置一致 |
| 频繁重连 | 网络不稳定 | 增大 `backoff_max_ms` |

## 相关文档

- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Gateway 配置](/zh/prx/gateway/)
- [安全策略](/zh/prx/security/)

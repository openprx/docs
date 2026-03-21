---
title: Cloudflare Tunnel
description: 使用 Cloudflare Tunnel 将 PRX Agent 安全暴露到公网，支持零信任访问控制。
---

# Cloudflare Tunnel

Cloudflare Tunnel（原 Argo Tunnel）通过 Cloudflare 全球网络在本地 Agent 和公网之间建立加密隧道，无需开放任何入站端口。这是 PRX 推荐的生产环境隧道方案。

## 概述

Cloudflare Tunnel 的核心优势：

- **免费无限流量** -- 无带宽或请求数量限制
- **全球加速** -- 通过 Cloudflare CDN 边缘节点路由
- **零信任集成** -- 与 Cloudflare Access 无缝配合，支持身份验证
- **自定义域名** -- 使用自有域名（需托管在 Cloudflare DNS）
- **自动 TLS** -- 由 Cloudflare 管理证书

## 前置要求

1. 一个 Cloudflare 账户（免费计划即可）
2. 一个域名（DNS 托管在 Cloudflare）
3. 安装 `cloudflared` CLI

### 安装 cloudflared

```bash
# macOS
brew install cloudflared

# Linux (Debian/Ubuntu)
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install cloudflared

# 验证
cloudflared --version
```

## 配置

### 创建 Tunnel

首先通过 Cloudflare Dashboard 或 CLI 创建隧道：

```bash
# 登录 Cloudflare
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create prx-agent

# 记录隧道 ID 和 token
# 隧道凭据保存在 ~/.cloudflared/
```

### PRX 配置

在 `config.toml` 中配置 Cloudflare 后端：

```toml
[tunnel]
backend = "cloudflare"
local_port = 3000
auto_start = true

[tunnel.cloudflare]
# 方式一：使用 Tunnel Token（推荐，适合远程管理）
token = "${CLOUDFLARE_TUNNEL_TOKEN}"

# 方式二：使用凭据文件（本地管理）
# credentials_file = "~/.cloudflared/<TUNNEL_ID>.json"
# tunnel_id = "<TUNNEL_ID>"

# 自定义域名绑定
hostname = "agent.example.com"

# 可选：指定协议
protocol = "quic"  # "quic" | "http2" | "auto"

# 可选：指标端口
metrics_port = 20241
```

### 环境变量

```bash
# 推荐通过环境变量管理 Token
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjQ..."
```

## 零信任配置

通过 Cloudflare Access 添加身份验证层：

### 配置 Access 应用

1. 在 Cloudflare Dashboard 进入 **Zero Trust** > **Access** > **Applications**
2. 创建 Self-hosted 应用
3. 设置应用域名为 `agent.example.com`
4. 配置 Access Policy（例如：仅允许特定邮箱域名）

### PRX 配置 Access 验证

```toml
[tunnel.cloudflare.access]
# 启用 Access 验证
enabled = true

# Access 应用的 AUD tag（Application Audience）
aud = "32eafc7c..."

# Cloudflare 团队域名
team_domain = "myteam.cloudflareaccess.com"

# 允许 Service Token 访问（用于 CI/CD 或 API 调用）
allow_service_tokens = true
```

## 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `token` | string | 否* | -- | Cloudflare Tunnel Token |
| `credentials_file` | string | 否* | -- | 凭据文件路径 |
| `tunnel_id` | string | 否* | -- | 隧道 ID（配合凭据文件） |
| `hostname` | string | 是 | -- | 公网访问域名 |
| `protocol` | string | 否 | `"auto"` | 传输协议 |
| `metrics_port` | u16 | 否 | -- | 本地指标端口 |
| `access.enabled` | bool | 否 | `false` | 启用 Access 验证 |
| `access.aud` | string | 否 | -- | Access 应用 AUD |
| `access.team_domain` | string | 否 | -- | 团队域名 |

> \* `token` 和 `credentials_file` + `tunnel_id` 二选一

## 健康检查

PRX 会定期验证 Cloudflare Tunnel 连通性：

```
[2026-03-21T10:00:00Z INFO  prx::tunnel::cloudflare]
  Tunnel health: connected
  Public URL: https://agent.example.com
  Protocol: quic
  Edge location: HKG (Hong Kong)
  Uptime: 2h 15m
```

健康检查包含：

- **进程存活** -- `cloudflared` 进程是否运行
- **连接状态** -- 是否有活跃的 Edge 连接
- **延迟测试** -- 通过公网 URL 自测往返延迟

## 安全性

- **出站连接** -- 所有连接由 `cloudflared` 主动建立到 Cloudflare Edge，无需入站端口
- **加密传输** -- 本地到 Edge 使用 TLS/QUIC 加密
- **Token 隔离** -- Tunnel Token 应通过环境变量或 secrets manager 注入
- **Access 策略** -- 建议为生产环境启用 Access，避免公开暴露 Agent
- **审计日志** -- Cloudflare Dashboard 提供完整的访问审计记录

## 故障排除

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| `ERR No tunnel token` | Token 未配置或为空 | 检查环境变量 `CLOUDFLARE_TUNNEL_TOKEN` |
| `ERR register tunnel` | Token 无效或已过期 | 在 Dashboard 重新生成 Token |
| DNS 解析失败 | 域名未绑定到隧道 | 在 Dashboard 配置 CNAME 或使用 `cloudflared tunnel route dns` |
| 502 Bad Gateway | 本地服务未启动 | 确保 `local_port` 对应的 gateway 正在运行 |
| QUIC 连接失败 | 网络不支持 UDP | 设置 `protocol = "http2"` 回退到 TCP |

## 相关文档

- [隧道概览](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Gateway 配置](/zh/prx/gateway/)
- [安全策略](/zh/prx/security/)

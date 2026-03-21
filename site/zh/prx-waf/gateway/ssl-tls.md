---
title: SSL/TLS 配置
description: 在 PRX-WAF 中配置 HTTPS。自动 Let's Encrypt 证书、手动证书管理、HTTP/3 QUIC 支持和 TLS 最佳实践。
---

# SSL/TLS 配置

PRX-WAF 支持通过 Let's Encrypt（ACME v2）自动管理 TLS 证书、手动证书配置和通过 QUIC 的 HTTP/3。本页面涵盖所有与 HTTPS 相关的配置。

## 自动证书（Let's Encrypt）

PRX-WAF 使用 `instant-acme` 库从 Let's Encrypt 自动获取和续签 TLS 证书。当主机配置了 SSL 后，PRX-WAF 会：

1. 在端口 80 上响应 ACME HTTP-01 挑战
2. 从 Let's Encrypt 获取证书
3. 将证书存储在数据库中
4. 到期前自动续签

::: tip
要使自动证书正常工作，端口 80 必须从互联网可达，以便进行 ACME HTTP-01 挑战验证。
:::

## 手动证书

对于不适合自动 ACME 的环境，可以手动配置证书：

```toml
[http3]
cert_pem = "/etc/prx-waf/tls/cert.pem"
key_pem  = "/etc/prx-waf/tls/key.pem"
```

也可以通过管理界面上传证书：

1. 在侧边栏中点击 **SSL 证书**
2. 点击 **上传证书**
3. 提供证书链（PEM）和私钥（PEM）
4. 将证书关联到主机

或通过 API：

```bash
curl -X POST http://localhost:9527/api/certificates \
  -H "Authorization: Bearer $TOKEN" \
  -F "cert=@/path/to/cert.pem" \
  -F "key=@/path/to/key.pem" \
  -F "host=example.com"
```

## TLS 监听器

PRX-WAF 在配置的 TLS 地址上监听 HTTPS 流量：

```toml
[proxy]
listen_addr     = "0.0.0.0:80"      # HTTP
listen_addr_tls = "0.0.0.0:443"     # HTTPS
```

## HTTP/3（QUIC）

PRX-WAF 通过 Quinn QUIC 库支持 HTTP/3。在配置中启用：

```toml
[http3]
enabled     = true
listen_addr = "0.0.0.0:443"
cert_pem    = "/etc/prx-waf/tls/cert.pem"
key_pem     = "/etc/prx-waf/tls/key.pem"
```

::: warning
HTTP/3 需要有效的 TLS 证书。启用 `enabled = true` 时必须提供 cert 和 key 路径。HTTP/3 也支持 Let's Encrypt 自动证书。
:::

HTTP/3 在与 HTTPS 相同的端口（443）上通过 UDP 运行。支持 QUIC 的客户端会自动升级，其他客户端则回退到基于 TCP 的 HTTP/2 或 HTTP/1.1。

## 证书存储

所有证书（自动和手动）存储在 PostgreSQL 数据库中。`certificates` 表（迁移 `0003`）包含：

- 证书链（PEM）
- 私钥（使用 AES-256-GCM 加密）
- 域名
- 过期日期
- ACME 账户信息（用于自动续签）

::: info
私钥使用 AES-256-GCM 进行静态加密。加密密钥从配置派生。切勿在数据库中存储未加密的私钥。
:::

## Docker 中使用 HTTPS

在 Docker 中运行时，映射 443 端口用于 TLS 流量：

```yaml
# docker-compose.yml
services:
  prx-waf:
    ports:
      - "80:80"
      - "443:443"
      - "9527:9527"
```

对于 HTTP/3，还需映射 UDP 端口：

```yaml
    ports:
      - "80:80"
      - "443:443/tcp"
      - "443:443/udp"  # HTTP/3 QUIC
      - "9527:9527"
```

## 最佳实践

1. **生产环境务必使用 HTTPS。** HTTP 应仅用于 ACME 挑战响应和重定向到 HTTPS。

2. **启用 HTTP/3** 为支持的客户端提供更快的连接建立和更好的弱网络性能。

3. **尽可能使用自动证书。** Let's Encrypt 证书免费、受所有浏览器信任，且 PRX-WAF 自动续签。

4. **限制管理 API 访问。** 管理 API 应仅从可信网络访问：

```toml
[security]
admin_ip_allowlist = ["10.0.0.0/8", "172.16.0.0/12"]
```

## 下一步

- [反向代理](./reverse-proxy) —— 后端路由和主机配置
- [网关概述](./index) —— 响应缓存和隧道
- [集群模式](../cluster/) —— 多节点 TLS 和 mTLS 证书

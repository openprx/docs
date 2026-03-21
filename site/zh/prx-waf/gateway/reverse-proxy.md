---
title: 反向代理配置
description: 将 PRX-WAF 配置为反向代理。主机路由、上游后端、负载均衡、请求/响应头和健康检查。
---

# 反向代理配置

PRX-WAF 作为反向代理运行，在请求通过 WAF 检测流水线后，将客户端请求转发到上游后端服务器。本页面介绍主机路由、负载均衡和代理配置。

## 主机配置

每个受保护的域名需要一个主机条目，将传入请求映射到上游后端。主机可以通过三种方式配置：

### 通过 TOML 配置文件

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### 通过管理界面

1. 在侧边栏中点击 **主机**
2. 点击 **添加主机**
3. 填写主机详情
4. 点击 **保存**

### 通过 REST API

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## 主机字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `host` | `string` | 是 | 要匹配的域名（如 `example.com`） |
| `port` | `integer` | 是 | 监听端口（通常为 `80` 或 `443`） |
| `remote_host` | `string` | 是 | 上游后端 IP 或主机名 |
| `remote_port` | `integer` | 是 | 上游后端端口 |
| `ssl` | `boolean` | 否 | 上游是否使用 HTTPS（默认：`false`） |
| `guard_status` | `boolean` | 否 | 是否启用 WAF 防护（默认：`true`） |

## 负载均衡

PRX-WAF 使用加权轮询算法在多个上游后端之间分发流量。当一个主机配置了多个后端时，流量按照权重比例分配。

::: info
每个主机的多后端配置可以通过管理界面或 API 管理。TOML 配置文件支持单后端主机条目。
:::

## 请求头

PRX-WAF 自动为转发的请求添加标准代理头：

| 请求头 | 值 |
|--------|------|
| `X-Real-IP` | 客户端原始 IP 地址 |
| `X-Forwarded-For` | 客户端 IP（追加到现有链） |
| `X-Forwarded-Proto` | `http` 或 `https` |
| `X-Forwarded-Host` | 原始 Host 头值 |

## 请求体大小限制

最大请求体大小由安全配置控制：

```toml
[security]
max_request_body_bytes = 10485760  # 10 MB
```

超过此限制的请求在到达 WAF 流水线之前，会被以 413 Payload Too Large 响应拒绝。

## 管理主机

### 列出所有主机

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### 更新主机

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### 删除主机

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 基于 IP 的规则

PRX-WAF 支持在检测流水线第 1-4 阶段评估的 IP 黑白名单规则：

```bash
# 添加 IP 白名单规则
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# 添加 IP 黑名单规则
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## 下一步

- [SSL/TLS](./ssl-tls) —— 启用 HTTPS 和 Let's Encrypt
- [网关概述](./index) —— 响应缓存和反向隧道
- [配置参考](../configuration/reference) —— 所有代理配置项

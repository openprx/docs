---
title: HTTP 请求工具
description: PRX 的 http_request 工具提供安全的 HTTP API 调用能力，采用默认拒绝策略，仅允许访问白名单域名。
---

# HTTP 请求工具

`http_request` 工具允许 PRX Agent 向外部 API 发起 HTTP 请求。与浏览器工具不同，HTTP 请求工具用于结构化的 API 调用——发送 JSON 数据、获取 API 响应、与 RESTful 服务交互。

该工具采用"默认拒绝"（deny-by-default）安全策略：只有在 `allowed_domains` 中明确列出的域名才可以访问。这种设计从根本上杜绝了 SSRF（Server-Side Request Forgery）攻击的风险。Agent 无法访问任何未经授权的外部服务或内部网络地址。

HTTP 请求工具支持所有常用的 HTTP 方法（GET、POST、PUT、DELETE、PATCH），可以设置自定义请求头和请求体，并对响应大小和超时时间进行限制。

## 配置

在 `config.toml` 中启用和配置 HTTP 请求工具：

```toml
[http_request]
enabled = true

# 域名白名单（必填，空列表等同于禁用）
allowed_domains = [
    "api.github.com",
    "api.openai.com",
    "api.anthropic.com",
    "*.example.com",
    "jsonplaceholder.typicode.com"
]

# 请求限制
max_response_size = 1048576   # 最大响应大小（字节），默认 1MB
timeout_secs = 30             # 请求超时（秒）
max_redirects = 5             # 最大重定向次数

# 默认请求头
[http_request.default_headers]
User-Agent = "PRX-Agent/1.0"
Accept = "application/json"
```

### 带认证的 API 配置

```toml
[http_request]
enabled = true
allowed_domains = ["api.github.com"]

# 为特定域名配置认证头
[http_request.domain_headers."api.github.com"]
Authorization = "Bearer ghp_xxxxxxxxxxxx"
Accept = "application/vnd.github.v3+json"

[http_request.domain_headers."api.openai.com"]
Authorization = "Bearer sk-xxxxxxxxxxxx"
```

## 使用方法

### GET 请求

```json
{
  "tool": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://api.github.com/repos/openprx/prx",
    "headers": {
      "Accept": "application/vnd.github.v3+json"
    }
  }
}
```

### POST 请求

```json
{
  "tool": "http_request",
  "arguments": {
    "method": "POST",
    "url": "https://api.example.com/data",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"name\": \"test\", \"value\": 42}"
  }
}
```

### 带查询参数的请求

```json
{
  "tool": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://api.github.com/search/repositories?q=rust+async&sort=stars&per_page=5"
  }
}
```

### 典型交互场景

```
用户: 查看 PRX 仓库的最新 release

Agent:
1. [调用 http_request: GET https://api.github.com/repos/openprx/prx/releases/latest]
2. 解析响应 JSON
3. 最新版本是 v1.2.0，发布于 2024-01-10...
```

## 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `method` | string | 否 | `"GET"` | HTTP 方法：`GET`、`POST`、`PUT`、`DELETE`、`PATCH`、`HEAD`、`OPTIONS` |
| `url` | string | 是 | — | 请求 URL（域名必须在白名单中） |
| `headers` | object | 否 | `{}` | 自定义请求头（键值对） |
| `body` | string | 否 | — | 请求体（POST/PUT/PATCH 使用） |
| `timeout` | integer | 否 | 配置值 | 此次请求的超时秒数（覆盖全局配置） |
| `follow_redirects` | boolean | 否 | `true` | 是否跟随重定向 |

### 响应格式

工具返回结构化的响应信息：

```json
{
  "status": 200,
  "headers": {
    "content-type": "application/json",
    "x-ratelimit-remaining": "59"
  },
  "body": "{\"name\": \"prx\", \"full_name\": \"openprx/prx\", ...}",
  "elapsed_ms": 245
}
```

## 域名白名单

### 匹配规则

域名白名单支持精确匹配和通配符匹配：

| 模式 | 匹配 | 不匹配 |
|------|------|--------|
| `api.github.com` | `api.github.com` | `github.com`、`raw.github.com` |
| `*.github.com` | `api.github.com`、`raw.github.com` | `github.com` |
| `*.example.com` | `api.example.com`、`sub.api.example.com` | `example.com` |

### 常用 API 域名

```toml
# AI/LLM 提供商
allowed_domains = [
    "api.openai.com",
    "api.anthropic.com",
    "generativelanguage.googleapis.com",
]

# 开发工具
allowed_domains = [
    "api.github.com",
    "gitlab.com",
    "registry.npmjs.org",
    "crates.io",
]

# 通用服务
allowed_domains = [
    "jsonplaceholder.typicode.com",   # 测试 API
    "httpbin.org",                     # HTTP 测试
]
```

## 安全性

### 默认拒绝策略

HTTP 请求工具的核心安全原则是"默认拒绝"：

- **空白名单 = 完全禁用** — 如果 `allowed_domains` 为空或未配置，所有请求都会被拒绝
- **内网地址拦截** — 私有 IP 地址（`10.x.x.x`、`172.16-31.x.x`、`192.168.x.x`）和 localhost 被默认拦截
- **重定向检查** — 重定向目标 URL 也必须在白名单中，防止通过合法域名跳转到未授权地址

### SSRF 防护

HTTP 请求工具采用多层 SSRF 防护：

1. **域名白名单** — 源头控制，仅允许授权域名
2. **IP 地址检查** — DNS 解析后检查目标 IP 是否为内网地址
3. **重定向跟踪** — 每次重定向都检查域名和 IP
4. **端口限制** — 默认仅允许 80 和 443 端口

### 凭据保护

通过 `domain_headers` 配置的认证信息不会暴露给 Agent：

```toml
# Agent 看不到此认证头的值
[http_request.domain_headers."api.github.com"]
Authorization = "Bearer ghp_xxxxxxxxxxxx"
```

Agent 只知道可以访问 `api.github.com`，但无法获取具体的认证凭据。凭据由 PRX 运行时自动注入到请求中。

### 响应大小限制

`max_response_size` 防止因超大响应导致的内存耗尽：

```toml
[http_request]
max_response_size = 1048576   # 1MB
```

超过限制的响应会被截断，Agent 会收到截断提示。

### 速率限制建议

虽然 PRX 不内置 HTTP 请求的速率限制，但建议：

- 配合 Agent 的 `max_iterations` 限制总请求次数
- 监控审计日志中的请求频率
- 使用工具策略的 `supervised` 模式审查高频请求

```toml
[security.tool_policy.tools]
http_request = "supervised"   # 每次 API 调用需审批
```

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [网页搜索](/zh/prx/tools/web-search/) — DuckDuckGo 和 Brave Search 集成
- [浏览器工具](/zh/prx/tools/browser/) — 全功能浏览器自动化
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
- [配置参考](/zh/prx/config/reference/) — 完整 config.toml 参考

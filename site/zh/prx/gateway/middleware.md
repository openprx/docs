---
title: 中间件
description: 网关中间件栈，用于认证、速率限制、CORS 和日志。
---

# 中间件

PRX 网关使用可组合的中间件栈处理横切关注点，如认证、速率限制、CORS 和请求日志。

## 中间件栈

请求按顺序通过中间件栈：

1. **请求日志** -- 记录传入请求及耗时
2. **CORS** -- 处理跨域资源共享头
3. **认证** -- 验证 Bearer Token 或 API Key
4. **速率限制** -- 强制执行每客户端的请求限制
5. **请求路由** -- 分发到相应的处理器

## 认证中间件

```toml
[gateway.auth]
enabled = true
method = "bearer"  # "bearer" | "api_key" | "none"
token_secret = "your-secret-key"
```

## 速率限制

```toml
[gateway.rate_limit]
enabled = true
requests_per_minute = 60
burst_size = 10
```

## CORS

```toml
[gateway.cors]
allowed_origins = ["https://app.example.com"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
allowed_headers = ["Authorization", "Content-Type"]
max_age_secs = 86400
```

## 请求日志

所有 API 请求记录方法、路径、状态码和响应时间。日志级别可配置：

```toml
[gateway.logging]
level = "info"  # "debug" | "info" | "warn" | "error"
format = "json"  # "json" | "pretty"
```

## 相关页面

- [网关概览](./)
- [HTTP API](./http-api)
- [安全](/zh/prx/security/)

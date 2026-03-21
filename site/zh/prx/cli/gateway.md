---
title: prx gateway — HTTP/WS 网关
description: 启动独立的 HTTP/WebSocket 网关服务器，接收 webhook 事件和 WebSocket 连接。
---

# prx gateway

启动独立的 HTTP/WebSocket 网关服务器。基于 Axum 构建，接收外部 webhook 事件和 WebSocket 连接。

与 `prx daemon` 不同，`prx gateway` 仅启动网关服务器，不启动消息渠道、心跳监控和定时调度。适合只需要 HTTP API 端点的场景。

## 用法

```bash
prx gateway [OPTIONS]
```

## 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--port <PORT>` | `-p` | 配置文件 `gateway.port` | 监听端口，设为 `0` 使用随机可用端口 |
| `--host <HOST>` | — | 配置文件 `gateway.host` | 绑定地址 |

## 示例

### 使用配置默认值

```bash
prx gateway
```

### 指定端口

```bash
prx gateway -p 8080
```

### 绑定到所有接口

```bash
prx gateway --host 0.0.0.0
```

### 随机端口（用于测试）

```bash
prx gateway -p 0
```

启动时日志会输出实际分配的端口号。

## 网关功能

Gateway 提供以下端点类型：

- **Webhook 接收** — 接收来自 Telegram/Discord/Slack 等平台的 webhook 推送
- **WebSocket** — 双向实时通信，用于 Web Console 等客户端
- **REST API** — Agent 交互、状态查询等 HTTP 接口
- **健康检查** — 用于负载均衡器和监控系统探测

## 反向代理配置

生产环境建议在 Gateway 前放置反向代理（Caddy/Nginx/Traefik）处理 TLS。

### Caddy 示例

```
prx.example.com {
    reverse_proxy localhost:8080
}
```

### Nginx 示例

```nginx
server {
    listen 443 ssl;
    server_name prx.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

注意：WebSocket 需要 `Upgrade` 和 `Connection` 头转发。

## 相关链接

- [prx daemon](./daemon) — 完整守护进程（包含网关）
- [prx channel](./channel) — 渠道管理
- [安全](../security/) — 策略引擎与访问控制

---
title: prx daemon — 守护进程
description: 启动 OpenPRX 完整守护进程，包含网关服务器、所有消息渠道、心跳监控和定时调度。
---

# prx daemon

启动 OpenPRX 长运行守护进程。这是生产环境和持久运行推荐的启动方式，会同时启动以下组件：

- **Gateway 网关** — Axum HTTP/WebSocket 服务器，接收 webhook 和 WebSocket 连接
- **Channels 渠道** — 所有已配置的消息渠道（Telegram/Discord/Slack 等）
- **Heartbeat 心跳** — 系统健康监控
- **Scheduler 调度器** — Cron 定时任务执行引擎

## 用法

```bash
prx daemon [OPTIONS]
```

## 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--port <PORT>` | `-p` | 配置文件 `gateway.port` | 网关监听端口，设为 `0` 使用随机可用端口 |
| `--host <HOST>` | — | 配置文件 `gateway.host` | 网关绑定地址 |

## 示例

### 使用配置默认值启动

```bash
prx daemon
```

### 指定端口

```bash
prx daemon -p 9090
```

### 仅监听本地

```bash
prx daemon --host 127.0.0.1
```

### 绑定到所有接口

```bash
prx daemon --host 0.0.0.0 -p 8080
```

### 后台运行（配合 nohup）

```bash
nohup prx daemon > /var/log/openprx.log 2>&1 &
```

推荐使用 `prx service install` 注册为系统服务，而非手动后台运行。

## 生产部署

### 注册为系统服务

```bash
# 安装 systemd/launchd 服务单元
prx service install

# 启动服务
prx service start

# 查看状态
prx service status
```

注册为系统服务后，守护进程会在系统启动时自动运行，并在崩溃时自动重启。

### 运行流程

```
prx daemon
  |
  +-- 加载配置 (config.toml + config.d/*.toml)
  +-- 应用环境变量覆盖
  +-- 启动 Gateway (HTTP/WS)
  +-- 启动所有已配置的 Channels
  +-- 启动 Heartbeat 监控
  +-- 启动 Cron 调度器
  +-- 进入事件循环（持续运行）
```

### 配置热重载

守护进程支持配置文件热重载。修改 `config.toml` 后，变更会被自动检测并应用，无需重启进程。底层使用 `arc-swap` + 文件系统监听实现。

## 与 prx gateway 的区别

| 特性 | `prx daemon` | `prx gateway` |
|------|-------------|---------------|
| HTTP/WS 网关 | 包含 | 包含 |
| 消息渠道 | 全部启动 | 不启动 |
| 心跳监控 | 包含 | 不包含 |
| 定时调度 | 包含 | 不包含 |
| 适用场景 | 生产/持久运行 | 仅需 HTTP API |

## 相关链接

- [prx gateway](./gateway) — 独立网关模式
- [prx service](./service) — 系统服务管理
- [prx channel](./channel) — 渠道管理
- [prx cron](./cron) — 定时任务
- [配置参考](../config/) — 完整配置文档

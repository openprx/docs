# 安装指南

## 前置要求

- Rust 工具链（2024 edition 或更高版本）
- 一个能发送 Webhook 事件的 OpenPR 实例

## 从源码构建

克隆仓库并执行 release 构建：

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

构建产物位于 `target/release/openpr-webhook`。

## 核心依赖

OpenPR-Webhook 基于以下核心库构建：

| Crate | 用途 |
|-------|------|
| `axum` 0.8 | HTTP 服务框架 |
| `tokio` 1 | 异步运行时 |
| `reqwest` 0.12 | 用于 Webhook 转发和回调的 HTTP 客户端 |
| `hmac` + `sha2` | HMAC-SHA256 签名验证 |
| `toml` 0.8 | 配置文件解析 |
| `tokio-tungstenite` 0.28 | 隧道模式的 WebSocket 客户端 |
| `tracing` | 结构化日志 |

## 配置文件

创建 `config.toml` 文件。服务启动时会加载此文件。完整字段说明请参阅[配置参考](../configuration/index.md)。

最小配置示例：

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "通知机器人"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## 运行

```bash
# 默认加载当前目录下的 config.toml
./target/release/openpr-webhook

# 指定自定义配置文件路径
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## 日志配置

日志级别通过 `RUST_LOG` 环境变量控制。默认级别为 `openpr_webhook=info`。

```bash
# 调试级别日志
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# 追踪级别日志（非常详细）
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## 健康检查

服务提供 `GET /health` 端点，运行正常时返回 `ok`：

```bash
curl http://localhost:9000/health
# ok
```

## Systemd 服务（可选）

用于 Linux 生产环境部署：

```ini
[Unit]
Description=OpenPR Webhook 事件分发器
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## 下一步

- [快速上手](quickstart.md) -- 配置第一个代理并完成端到端测试
- [配置参考](../configuration/index.md) -- 完整的 TOML 配置字段说明

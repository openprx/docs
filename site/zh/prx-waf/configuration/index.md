---
title: 配置概述
description: PRX-WAF 配置工作原理。TOML 配置文件结构、环境变量覆盖，以及文件配置与数据库存储配置之间的关系。
---

# 配置

PRX-WAF 通过 `-c` / `--config` 参数传入的 TOML 文件进行配置。默认路径为 `configs/default.toml`。

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## 配置层级

PRX-WAF 使用两个配置层：

| 来源 | 范围 | 说明 |
|------|------|------|
| TOML 文件 | 服务启动 | 代理端口、数据库 URL、缓存、HTTP/3、安全、集群 |
| 数据库 | 运行时 | 主机、规则、证书、插件、隧道、通知 |

TOML 文件包含启动时需要的设置（端口、数据库连接、集群配置）。运行时设置如主机和规则存储在 PostgreSQL 中，通过管理界面或 REST API 管理。

## 配置文件结构

TOML 配置文件包含以下节：

```toml
[proxy]          # 反向代理监听地址
[api]            # 管理 API 监听地址
[storage]        # PostgreSQL 连接
[cache]          # 响应缓存设置
[http3]          # HTTP/3 QUIC 设置
[security]       # 管理 API 安全（IP 白名单、限速、CORS）
[rules]          # 规则引擎设置（目录、热重载、规则源）
[crowdsec]       # CrowdSec 集成
[cluster]        # 集群模式（可选）
```

### 最小配置

用于开发的最小配置：

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### 生产配置

启用所有安全功能的生产配置：

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## 主机配置

可以在 TOML 文件中为静态部署定义主机：

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
对于动态环境，建议通过管理界面或 REST API 而非 TOML 文件管理主机。数据库存储的主机优先于 TOML 定义的主机。
:::

## 数据库迁移

PRX-WAF 包含 8 个迁移文件，用于创建所需的数据库模式：

```bash
# 运行迁移
prx-waf -c configs/default.toml migrate

# 创建默认管理员用户
prx-waf -c configs/default.toml seed-admin
```

迁移是幂等的，可以安全地多次运行。

## Docker 环境

在 Docker 部署中，配置值通常在 `docker-compose.yml` 中设置：

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## 下一步

- [配置参考](./reference) —— 所有 TOML 配置项的类型和默认值详细文档
- [安装](../getting-started/installation) —— 初始设置和数据库迁移
- [集群模式](../cluster/) —— 集群特定配置

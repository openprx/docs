---
title: 集群部署
description: 部署多节点 PRX-WAF 集群的分步指南。证书生成、节点配置、Docker Compose 和验证。
---

# 集群部署

本指南逐步介绍如何部署一个三节点 PRX-WAF 集群：一个主节点和两个工作节点。

## 前置要求

- 三台服务器（或 Docker 主机），网络连通 UDP 端口 `16851`
- 所有节点均可访问 PostgreSQL 16+（共享或复制）
- 每个节点已安装 PRX-WAF 二进制（或可用 Docker 镜像）

## 第 1 步：生成集群证书

使用 cert-init 容器或手动使用 OpenSSL 生成 CA 和节点证书。

**使用 Docker Compose（推荐）：**

仓库包含 `docker-compose.cluster.yml` 文件，可自动处理证书生成：

```bash
# 生成证书
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

这将在共享卷中创建证书：

```
cluster_certs/
├── cluster-ca.pem      # CA 证书
├── cluster-ca.key      # CA 私钥（仅主节点）
├── node-a.pem          # 主节点证书
├── node-a.key          # 主节点私钥
├── node-b.pem          # 工作节点 B 证书
├── node-b.key          # 工作节点 B 私钥
├── node-c.pem          # 工作节点 C 证书
└── node-c.key          # 工作节点 C 私钥
```

**使用 auto_generate：**

或者在主节点上设置 `auto_generate = true`。工作节点将在加入过程中接收证书：

```toml
[cluster.crypto]
auto_generate = true
```

## 第 2 步：配置主节点

创建 `configs/cluster-node-a.toml`：

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-a"
role        = "main"
listen_addr = "0.0.0.0:16851"
seeds       = []                # 主节点没有种子节点

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
ca_key    = "/certs/cluster-ca.key"   # 主节点持有 CA 密钥
node_cert = "/certs/node-a.pem"
node_key  = "/certs/node-a.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5
stats_interval_secs        = 10
events_queue_size          = 10000

[cluster.election]
timeout_min_ms        = 150
timeout_max_ms        = 300
heartbeat_interval_ms = 50

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## 第 3 步：配置工作节点

创建 `configs/cluster-node-b.toml`（节点 C 类似）：

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-b"
role        = "worker"
listen_addr = "0.0.0.0:16851"
seeds       = ["node-a:16851"]    # 指向主节点

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
node_cert = "/certs/node-b.pem"
node_key  = "/certs/node-b.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## 第 4 步：启动集群

**使用 Docker Compose：**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**手动启动：**

按顺序启动：先数据库，然后主节点，最后工作节点：

```bash
# 在每个节点上
prx-waf -c /etc/prx-waf/config.toml run
```

## 第 5 步：验证集群

从任意节点检查集群状态：

```bash
# 通过管理界面 — 导航到集群仪表板

# 通过 API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

预期响应：

```json
{
  "cluster_enabled": true,
  "node_id": "node-a",
  "role": "main",
  "peers": [
    {"node_id": "node-b", "role": "worker", "status": "healthy"},
    {"node_id": "node-c", "role": "worker", "status": "healthy"}
  ],
  "sync": {
    "last_rule_sync": "2026-03-21T10:00:00Z",
    "last_config_sync": "2026-03-21T10:00:00Z"
  }
}
```

## 负载均衡器集成

在集群前放置外部负载均衡器（如 HAProxy、Nginx 或云 LB），将客户端流量分发到所有节点：

```
                    ┌──── node-a（主节点）  :80/:443
客户端 → LB ────────┼──── node-b（工作节点）:80/:443
                    └──── node-c（工作节点）:80/:443
```

每个节点独立通过 WAF 流水线处理流量。主节点也是流量处理节点 —— 它不仅限于协调职责。

::: tip
使用 `/health` 端点进行负载均衡器健康检查：
```
GET http://node-a/health → 200 OK
```
:::

## 扩展集群

添加新的工作节点：

1. 为新节点生成证书（或使用 `auto_generate`）
2. 配置新节点的 `seeds = ["node-a:16851"]`
3. 启动节点 —— 它会自动加入集群并同步

移除节点只需停止它。集群健康检查器会检测到离开并将其排除在同步之外。

## 下一步

- [集群模式概述](./index) —— 架构和同步详情
- [配置参考](../configuration/reference) —— 所有集群配置项
- [故障排除](../troubleshooting/) —— 常见集群部署问题
